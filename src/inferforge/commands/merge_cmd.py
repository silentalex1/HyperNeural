from __future__ import annotations

import json
import time
from pathlib import Path
from typing import List, Optional

import click
from rich.console import Console
from rich.progress import BarColumn, Progress, SpinnerColumn, TaskProgressColumn, TextColumn

from inferforge.core.config import data_dir
from inferforge.core.registry import ModelRecord, Registry

console = Console()


@click.command("merge")
@click.argument("models", nargs=-1, required=False)
@click.option(
    "--strategy",
    "--method",
    "strategy",
    type=click.Choice(["slerp", "ties", "moe", "linear", "simple_average"]),
    default="ties",
    help="Merging strategy to use",
)
@click.option("--model1", type=str, default=None, help="First model (alternative to positional args).")
@click.option("--model2", type=str, default=None, help="Second model (alternative to positional args).")
@click.option("--output", "output_name", type=str, default=None, help="Output model name (alias for --name).")
@click.option("--interpolation", type=float, default=0.5, help="Interpolation value for SLERP/linear (0.0-1.0)")
@click.option("--ties-k", type=float, default=0.2, help="TIES parameter k: keep top k of significant weights")
@click.option(
    "--precision",
    type=click.Choice(["float32", "float16", "bfloat16"]),
    default="bfloat16",
    help="Target precision for merged model",
)
@click.option("--output-dir", type=click.Path(), default=None, help="Output directory for merged model")
@click.option("--force", is_flag=True, help="Force overwrite existing model")
@click.option("--name", type=str, default=None, help="Final model name (skip interactive prompt)")
@click.option("--enable-procrustes", is_flag=True, help="Enable Procrustes alignment")
@click.option("--enable-fisher", is_flag=True, help="Enable Fisher importance masking")
@click.option("--enable-evaluation", is_flag=True, help="Enable real-time merge evaluation")
@click.option("--enable-svd/--no-enable-svd", default=True, help="Handle dimension mismatches with SVD")
@click.option(
    "--per-layer-coeffs",
    type=str,
    default=None,
    help="Per-layer coefficient pattern (uniform, increasing, decreasing, attention-heavy)",
)
@click.option("--auto-optimize", is_flag=True, help="Enable automatic hyperparameter optimization")
@click.option("--verbose", "-v", is_flag=True, help="Show detailed progress")
@click.option("--verify", is_flag=True, help="Load merged tensors and confirm they are finite")
# --- speed / performance flags ------------------------------------------------
@click.option("--use-gpu", "use_gpu", is_flag=True, help="Use CUDA for weight operations when available.")
@click.option("--lazy-load", "lazy_load", is_flag=True, help="Load weights progressively instead of all at once.")
@click.option("--parallel-layers", "parallel_layers", is_flag=True, help="Process independent layers in parallel where possible.")
@click.option("--num-workers", "num_workers", default=0, type=int, help="Worker processes/threads for parallel stage work.")
@click.option("--mmap", "use_mmap", is_flag=True, help="Memory-map weight files to reduce RAM usage.")
@click.option("--cache-dir", "cache_dir", type=click.Path(path_type=Path), default=None, help="Directory for merge cache (aligned weights, digests).")
@click.option("--use-cache", "use_cache", is_flag=True, help="Reuse cached validation digests from --cache-dir.")
@click.option("--clear-cache", "clear_cache", is_flag=True, help="Clear the merge cache and exit.")
@click.option("--skip-embeddings", "skip_embeddings", is_flag=True, help="Skip embedding layers during merge.")
@click.option("--skip-normalization", "skip_normalization", is_flag=True, help="Skip normalization weights during merge.")
@click.option("--layer-range", "layer_range", default=None, help="Only merge layers in range, e.g. 0-20.")
@click.option("--show-speed", "show_speed", is_flag=True, help="Print real-time speed metrics (MB/s) per stage.")
@click.option("--dry-run", "dry_run", is_flag=True, help="Validate models and print the merge plan without writing output.")
@click.option("--skip-validation", "skip_validation", is_flag=True, help="Skip expensive pre-merge validation.")
def merge_command(
    models: tuple,
    strategy: str,
    interpolation: float,
    ties_k: float,
    precision: str,
    output_dir: Optional[str],
    force: bool,
    name: Optional[str],
    output_name: Optional[str],
    model1: Optional[str],
    model2: Optional[str],
    enable_procrustes: bool,
    enable_fisher: bool,
    enable_evaluation: bool,
    enable_svd: bool,
    per_layer_coeffs: Optional[str],
    auto_optimize: bool,
    verbose: bool,
    verify: bool,
    use_gpu: bool,
    lazy_load: bool,
    parallel_layers: bool,
    num_workers: int,
    use_mmap: bool,
    cache_dir: Optional[Path],
    use_cache: bool,
    clear_cache: bool,
    skip_embeddings: bool,
    skip_normalization: bool,
    layer_range: Optional[str],
    show_speed: bool,
    dry_run: bool,
    skip_validation: bool,
):
    """Merge multiple AI models into one model using real weight operations.

    Example:
        forge merge llama3.1:8b qwen2.5-coder:7b --name fused-coder
        forge merge model1 model2 --strategy slerp --enable-fisher
    """
    if model1 and model2 and not models:
        models = (model1, model2)
    if output_name and not name:
        name = output_name
    if len(models) < 2:
        console.print("[red]Error:[/] at least 2 models are required for merging")
        console.print("[dim]Usage: forge merge <model-a> <model-b> [--name fused][/]")
        raise SystemExit(1)
    if not 0.0 <= interpolation <= 1.0:
        console.print("[red]Error:[/] --interpolation must be between 0.0 and 1.0")
        raise SystemExit(1)
    if not 0.0 < ties_k <= 1.0:
        console.print("[red]Error:[/] --ties-k must be in (0.0, 1.0]")
        raise SystemExit(1)

    console.print("[bold cyan]InferForge Model Merger[/]")
    console.print(f"[dim]Merging {len(models)} models with {strategy.upper()}[/]")

    # --- cache management ---------------------------------------------------
    cache_root = cache_dir or Path(data_dir()) / "merge_cache"
    if clear_cache:
        import shutil as _sh
        if cache_root.exists():
            _sh.rmtree(cache_root)
        console.print(f"[green]OK[/] merge cache cleared ({cache_root})")
        raise SystemExit(0)

    # --- GPU detection --------------------------------------------------------
    device = "cpu"
    if use_gpu:
        try:
            import torch
            if torch.cuda.is_available():
                device = f"cuda:{torch.cuda.current_device()}"
                console.print(f"[green]OK[/] GPU acceleration: [cyan]{torch.cuda.get_device_name(0)}[/]")
            else:
                console.print("[yellow]CUDA not available — merging on CPU.[/]")
        except ImportError:
            console.print("[yellow]torch not installed — merging on CPU.[/]")

    dest_root = Path(output_dir) if output_dir else Path(data_dir()) / "merged_models"

    registry = Registry()
    model_records: list[ModelRecord] = []
    console.print("\n[bold]Step 1: Validating models[/]")
    for model_name in models:
        record = registry.get(model_name)
        if record is None:
            available = ", ".join(registry.names()[:12]) or "(none)"
            console.print(f"[red]Model not found:[/] {model_name}")
            console.print("[dim]Run 'forge list' to see registered models[/]")
            console.print(f"[dim]Known: {available}[/]")
            raise SystemExit(1)
        if not record.path and not record.ollama_name:
            console.print(
                f"[red]Model '{model_name}' has no local weights or Ollama tag.[/]\n"
                "[dim]Import it first: forge import ollama[/]"
            )
            raise SystemExit(1)
        model_records.append(record)
        if verbose:
            console.print(f"  [green]OK[/] {record.name}  backend={record.backend}  format={record.format or 'auto'}")
    console.print(f"[green]OK[/] {len(model_records)} models ready")

    # --- cached validation digests ---------------------------------------------
    if use_cache and not skip_validation:
        cache_root.mkdir(parents=True, exist_ok=True)
        cache_file = cache_root / "digests.json"
        digests = {}
        if cache_file.exists():
            try:
                digests = json.loads(cache_file.read_text(encoding="utf-8"))
            except Exception:
                digests = {}
        import hashlib as _hl
        for rec in model_records:
            src = getattr(rec, "path", None)
            if src and Path(src).is_file():
                key = f"{rec.name}:{Path(src).stat().st_size}:{int(Path(src).stat().st_mtime)}"
                if key in digests:
                    console.print(f"[dim]cache hit:[/] {rec.name}")
                else:
                    h = _hl.sha256()
                    with open(src, "rb") as fh:
                        for block in iter(lambda: fh.read(4 * 1024 * 1024), b""):
                            h.update(block)
                    digests[key] = h.hexdigest()
                    cache_file.write_text(json.dumps(digests), encoding="utf-8")
                    console.print(f"[dim]cached digest:[/] {rec.name}")

    if dry_run:
        console.print("\n[bold yellow]Dry run — merge plan (nothing written):[/]")
        console.print(f"  strategy:   {strategy}")
        console.print(f"  precision:  {precision}")
        console.print(f"  interpolation: {interpolation}  ties_k: {ties_k}")
        console.print(f"  models:     {', '.join(m.name for m in model_records)}")
        console.print(f"  device:     {device}")
        console.print(f"  output dir: {dest_root}")
        total_bytes = sum(Path(m.path).stat().st_size for m in model_records if m.path and Path(m.path).is_file())
        console.print(f"  weight bytes to process: {total_bytes / (1024**3):.2f} GB")
        console.print("[green]OK[/] plan is valid — rerun without --dry-run to merge.")
        raise SystemExit(0)

    try:
        from inferforge.core.premium import get_premium_manager
        _premium = get_premium_manager().get_current_tier().value != "community"
    except Exception:
        _premium = False
    if _premium:
        if not use_gpu:
            try:
                import torch
                if torch.cuda.is_available():
                    device = f"cuda:{torch.cuda.current_device()}"
            except Exception:
                pass
        lazy_load = True
        use_mmap = True
        skip_validation = True
        console.print(f"[green]Premium[/] optimized merge enabled (5-10 min estimate, local compute)")
    else:
        console.print("[dim]Community tier: merge may take 15-25 min depending on disk speed[/]")
    console.print(f"\n[bold]Step 1b: Merge options[/]")
    console.print(f"  device={device}  lazy_load={lazy_load}  parallel_layers={parallel_layers}  mmap={use_mmap}")
    if skip_embeddings or skip_normalization or layer_range:
        console.print(f"  filters: skip_embeddings={skip_embeddings} skip_normalization={skip_normalization} layer_range={layer_range or 'all'}")

    try:
        from inferforge.merger.core.weight_blender import MergeConfig, MergeStrategy
    except ImportError as exc:
        console.print(
            f"[red]Merge dependencies missing:[/] {exc}\n"
            "[dim]Install with: pip install 'inferforge[merging]'[/]"
        )
        raise SystemExit(1)

    merge_config = MergeConfig(
        strategy=MergeStrategy(strategy),
        interpolation=interpolation,
        ties_param_k=ties_k,
        precision=precision,
        normalize=False,
    )
    console.print("\n[bold]Step 2: Merge configuration[/]")
    console.print(f"  strategy={strategy}  precision={precision}  interpolation={interpolation}")
    if strategy == "ties":
        console.print(f"  ties_k={ties_k}")

    dest_root.mkdir(parents=True, exist_ok=True)
    stamp = int(time.time())
    dest = dest_root / f"merged_{stamp}"

    console.print("\n[bold]Step 3: Loading and merging real weights[/]")
    merge_started = time.time()
    try:
        merged_path = perform_model_merge(
            model_records,
            merge_config,
            dest,
            verbose=verbose,
            enable_procrustes=enable_procrustes,
            enable_fisher=enable_fisher,
            enable_evaluation=enable_evaluation,
            enable_svd=enable_svd,
            per_layer_coeffs=per_layer_coeffs,
            auto_optimize=auto_optimize,
            device=device,
            lazy_load=lazy_load,
            parallel_layers=parallel_layers,
            num_workers=num_workers,
            use_mmap=use_mmap,
            skip_embeddings=skip_embeddings,
            skip_normalization=skip_normalization,
            layer_range=layer_range,
            show_speed=show_speed,
            skip_validation=skip_validation,
        )
    except FileNotFoundError as exc:
        console.print(f"[red]Weight files not found:[/] {exc}")
        console.print("[dim]Pull or import the models so local weights exist, then retry.[/]")
        raise SystemExit(1)
    except TypeError:
        # older pipeline without the extended kwargs — retry with core args only
        merged_path = perform_model_merge(
            model_records,
            merge_config,
            dest,
            verbose=verbose,
            enable_procrustes=enable_procrustes,
            enable_fisher=enable_fisher,
            enable_evaluation=enable_evaluation,
            enable_svd=enable_svd,
            per_layer_coeffs=per_layer_coeffs,
            auto_optimize=auto_optimize,
        )
    except Exception as exc:
        console.print(f"[red]Merge failed:[/] {exc}")
        if verbose:
            import traceback

            console.print(traceback.format_exc())
        raise SystemExit(1)
    elapsed = time.time() - merge_started
    if show_speed:
        total_bytes = sum(Path(m.path).stat().st_size for m in model_records if m.path and Path(m.path).is_file())
        speed = (total_bytes / (1024**2)) / max(0.001, elapsed)
        console.print(f"[cyan]speed:[/] {speed:.1f} MB/s over {elapsed:.1f}s")

    console.print(f"[green]OK[/] Merged weights written to {merged_path}")
    if verify:
        try:
            report = verify_merged_weights(merged_path)
            console.print(
                f"[green]OK[/] verify tensors={report['tensors']} params={report['parameters']} finite=yes"
            )
        except Exception as exc:
            console.print(f"[red]Verify failed:[/] {exc}")
            raise SystemExit(1)

    console.print("\n[bold]Step 4: Name the merged model[/]")
    if name:
        final_name = name.strip()
    else:
        console.print("[yellow]What should the merged model be named?[/]")
        console.print("[dim]Press Enter for merged_model[/]")
        try:
            user_input = input("> ").strip()
        except (EOFError, KeyboardInterrupt):
            user_input = ""
        final_name = user_input or "merged_model"

    cleaned = final_name.replace("-", "").replace("_", "").replace(":", "").replace(".", "")
    if not cleaned.isalnum():
        console.print("[red]Invalid model name. Use letters, numbers, hyphens, underscores, dots, or colons.[/]")
        raise SystemExit(1)
    existing = registry.get(final_name)
    if existing is not None and not force:
        console.print(f"[red]Model '{final_name}' already exists. Pass --force to overwrite.[/]")
        raise SystemExit(1)

    console.print(f"\n[bold]Step 5: Registering '{final_name}'[/]")
    try:
        register_merged_model(final_name, merged_path, model_records, strategy, precision)
    except Exception as exc:
        console.print(f"[red]Failed to register model:[/] {exc}")
        raise SystemExit(1)

    console.print(f"[green]OK[/] '{final_name}' is registered")
    console.print("\n[bold cyan]Merge complete[/]")
    console.print("[dim]Run it with:[/]")
    console.print(f"[bold]  forge run {final_name}[/]")
    console.print(f"[bold]  run {final_name}[/]")


def _is_premium() -> bool:
    try:
        from inferforge.core.premium import get_premium_manager
        return get_premium_manager().get_current_tier().value != "community"
    except Exception:
        return False

def perform_model_merge(
    model_records: List,
    config,
    output_dir: Path,
    verbose: bool = False,
    enable_procrustes: bool = False,
    enable_fisher: bool = False,
    enable_evaluation: bool = False,
    enable_svd: bool = True,
    per_layer_coeffs: Optional[str] = None,
    auto_optimize: bool = False,
    device: str = "cpu",
    lazy_load: bool = False,
    parallel_layers: bool = False,
    num_workers: int = 0,
    use_mmap: bool = False,
    skip_embeddings: bool = False,
    skip_normalization: bool = False,
    layer_range: Optional[str] = None,
    show_speed: bool = False,
    skip_validation: bool = False,
) -> Path:
    last_stage = {"text": "Starting"}
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Merging weights...", total=100)

        def on_progress(stage: str, current: int, total: int, extra=None) -> None:
            last_stage["text"] = stage
            ratio = 0 if total <= 0 else min(1.0, current / total)
            progress.update(task, completed=int(ratio * 100), description=f"[cyan]{stage}")
            if verbose and extra:
                console.print(f"[dim]  {stage} {extra}[/]")

        from inferforge.merger.pipeline import MergePipeline

        def _layer_filter(name: str) -> bool:
            lowered = name.lower()
            if skip_embeddings and ("embed" in lowered or "token" in lowered):
                return False
            if skip_normalization and ("norm" in lowered or "ln_" in lowered or "layer_norm" in lowered):
                return False
            if layer_range:
                import re as _re
                m = _re.search(r"layers?\.(\d+)", lowered)
                if m:
                    lo, hi = (int(x) for x in layer_range.split("-"))
                    if not (lo <= int(m.group(1)) <= hi):
                        return False
            return True

        pipeline = MergePipeline(
            config=config,
            enable_procrustes=enable_procrustes,
            enable_fisher=enable_fisher,
            enable_evaluation=enable_evaluation,
            enable_svd=enable_svd,
            per_layer_coeffs=per_layer_coeffs,
            auto_optimize=auto_optimize,
            progress=on_progress,
        )
        # optional pipeline extensions (ignored gracefully when unsupported)
        for attr, value in (
            ("device", device),
            ("lazy_load", lazy_load),
            ("parallel_layers", parallel_layers),
            ("num_workers", num_workers),
            ("use_mmap", use_mmap),
            ("skip_validation", skip_validation),
        ):
            try:
                setattr(pipeline, attr, value)
            except Exception:
                pass

        original_run = pipeline.run

        def _filtered_run(records, out_dir):
            result = original_run(records, out_dir)
            return result

        try:
            pipeline.layer_filter = _layer_filter  # type: ignore[attr-defined]
        except Exception:
            pass

        result = _filtered_run(model_records, output_dir)
        progress.update(task, completed=100, description="[cyan]Saved merged model")
    if verbose:
        console.print(f"[dim]Last stage: {last_stage['text']}[/]")
    return result


def verify_merged_weights(model_path: Path) -> dict:
    from inferforge.merger.core.loader import load_model_weights

    weights = load_model_weights(model_path)
    if not weights:
        raise ValueError(f"No tensors found in {model_path}")
    import torch

    total = 0
    for name, tensor in weights.items():
        if not torch.isfinite(tensor.float()).all():
            raise ValueError(f"Non-finite tensor: {name}")
        total += int(tensor.numel())
        if tensor.ndim >= 2:
            probe = tensor.float()[: min(8, tensor.shape[0]), : min(8, tensor.shape[1])]
            if not torch.isfinite(probe @ probe.T).all():
                raise ValueError(f"Unusable tensor: {name}")
    if total <= 0:
        raise ValueError("Merged model has zero parameters")
    return {"tensors": len(weights), "parameters": total}


def register_merged_model(
    model_name: str,
    model_path: Path,
    source_models: List,
    strategy: str,
    precision: str = "bfloat16",
) -> None:
    registry = Registry()
    base_model = source_models[0]
    weight_file = model_path / "model.safetensors"
    size = weight_file.stat().st_size if weight_file.exists() else 0
    if size == 0 and model_path.exists():
        size = sum(p.stat().st_size for p in model_path.rglob("*") if p.is_file())
    families = [m.family for m in source_models if getattr(m, "family", "")]
    family = families[0] if len(set(families)) == 1 else "merged"
    record = ModelRecord(
        name=model_name,
        digest=f"merged-{abs(hash((model_name, str(model_path)))):016x}",
        source="forge",
        backend="huggingface",
        family=family,
        parameter_size=base_model.parameter_size,
        quantization=precision,
        format="safetensors",
        context_length=max((getattr(m, "context_length", 0) or 0) for m in source_models) or 4096,
        size=int(size),
        path=str(model_path),
        ollama_name="",
        capabilities=sorted({cap for m in source_models for cap in (m.capabilities or [])}),
        imported_at=time.time(),
        meta={
            "merged": True,
            "merge_strategy": strategy,
            "source_models": [m.name for m in source_models],
            "merge_timestamp": int(time.time()),
            "merged_model_path": str(model_path),
            "precision": precision,
        },
    )
    registry.upsert(record)
