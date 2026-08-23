from __future__ import annotations

import json
import sys
from pathlib import Path

import click
from rich.console import Console
from rich.progress import BarColumn, Progress, SpinnerColumn, TextColumn, TimeElapsedColumn
from rich.table import Table
from rich.text import Text

from inferforge.core.config import get_training_config
from inferforge.core.registry import Registry
from inferforge.model.identity import INFERFORGE_BETA, resolve_base_model
from inferforge.nexara.engine import NexaraEngine
from inferforge.training.coding_dataset import build_coding_dataset
from inferforge.training.forge_trainer import ForgeTrainer

console = Console(force_terminal=True, stderr=True)


@click.command("train")
@click.argument("model", required=False, default=None)
@click.option("--data", default=None, help="Path to JSON array of {input, output} examples.")
@click.option("--max-examples", default=None, type=int, help="Cap on examples embedded.")
@click.option("--base", default=None, help="Base Ollama model (for new / beta builds).")
@click.option(
    "--curriculum",
    type=click.Choice(["none", "coding"], case_sensitive=False),
    default="coding",
    help="Built-in training curriculum to include.",
)
@click.option("--system", default=None, help="Override system prompt.")
@click.option("--rebuild-beta", is_flag=True, help="Force rebuild InferForge beta with coding curriculum.")
@click.option("--temperature", default=None, type=float, help="Sampling temperature baked into model.")
@click.option("--ctx", default=None, type=int, help="Context length (num_ctx).")
@click.option("--export-dataset", type=click.Path(path_type=Path), default=None, help="Write built-in dataset JSON and exit.")
@click.option("--epochs", default=1, type=int, help="Number of training epochs.")
@click.option("--learning-rate", default=None, type=float, help="Learning rate for training.")
@click.option("--batch-size", default=None, type=int, help="Batch size for training.")
@click.option("--checkpoint-dir", type=click.Path(path_type=Path), default=None, help="Directory for training checkpoints.")
@click.option("--resume", is_flag=True, help="Resume training from checkpoint.")
@click.option("--validation-split", default=0.1, type=float, help="Fraction of data for validation (0.0-1.0).")
@click.option("--lora", is_flag=True, help="Use LoRA fine-tuning for efficiency.")
@click.option("--lora-r", default=8, type=int, help="LoRA rank.")
@click.option("--lora-alpha", default=16, type=int, help="LoRA alpha.")
@click.option("--workers", default=1, type=int, help="Number of parallel workers for data processing.")
@click.option("--validate-data", is_flag=True, help="Validate training data quality before training.")
@click.option("--nexara", type=click.Path(path_type=Path), default=None, help="Path to Nexara code file for AI-native training.")
def train_command(
    model: str | None,
    data: str | None,
    max_examples: int | None,
    base: str | None,
    curriculum: str,
    system: str | None,
    rebuild_beta: bool,
    temperature: float | None,
    ctx: int | None,
    export_dataset: Path | None,
    epochs: int,
    learning_rate: float | None,
    batch_size: int | None,
    checkpoint_dir: Path | None,
    resume: bool,
    validation_split: float,
    lora: bool,
    lora_r: int,
    lora_alpha: int,
    workers: int,
    validate_data: bool,
    nexara: Path | None,
) -> None:
    """
    Train / customize a model with advanced fine-tuning options.

    Examples:

      forge train                          # rebuild InferForge beta (coding)

      forge train inferforge-beta --rebuild-beta

      forge train my-model --data examples.json --base qwen2.5-coder:7b

      forge train --export-dataset coding.json

      forge train --epochs 3 --learning-rate 0.0001 --batch-size 4

      forge train --lora --lora-r 16 --lora-alpha 32

      forge train --checkpoint-dir ./checkpoints --resume

      forge train --nexara model.nexara     # Train with Nexara AI-native code
    """
    if nexara:
        if not nexara.exists():
            console.print(f"[red]Nexara file not found:[/] {nexara}")
            raise SystemExit(1)
        
        nexara_code = nexara.read_text(encoding="utf-8")
        engine = NexaraEngine()
        output_dir = Path.cwd() / "nexara_output"
        
        console.print("[bold dark_orange]◈ Nexara[/] AI-native compilation\n")
        result = engine.compile_and_train(nexara_code, output_dir)
        
        console.print(f"[green]✓[/] Hardware detected: {result['hardware']['cpu_cores']} cores, {result['hardware']['ram']}GB RAM")
        if result['hardware']['gpu_available']:
            console.print(f"[green]✓[/] GPU detected: {result['hardware']['gpu_memory']}GB VRAM")
        
        console.print(f"[green]✓[/] Compiled {len(result['compiled']['models'])} model(s)")
        for model_name in result['compiled']['models'].keys():
            console.print(f"  - {model_name}")
        
        engine.generate_training_script(result['compiled'], output_dir)
        console.print(f"[green]✓[/] Training script generated: {output_dir / 'train_nexara.py'}")
        console.print(f"\n[dim]Run training script to start training with Nexara optimizations.[/]")
        return
    
    if export_dataset:
        payload = build_coding_dataset()
        export_dataset.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        console.print(f"[green]✓[/] wrote {len(payload)} examples → [cyan]{export_dataset}[/]")
        return

    config = get_training_config()
    if not config["enabled"]:
        console.print("[red]Training is disabled in settings[/]")
        raise SystemExit(1)

    # Default target: InferForge beta
    target = (model or INFERFORGE_BETA).strip()
    if rebuild_beta or target in {INFERFORGE_BETA, "beta", "inferforge"}:
        target = INFERFORGE_BETA

    training_data: list[dict] = []
    if data:
        data_path = Path(data)
        if not data_path.exists():
            console.print(f"[red]Training data not found:[/] {data}")
            raise SystemExit(1)
        with data_path.open("r", encoding="utf-8") as f:
            loaded = json.load(f)
        if not isinstance(loaded, list):
            console.print("[red]Training data must be a JSON array of {input, output} objects[/]")
            raise SystemExit(1)
        training_data = loaded

    cap = max_examples or int(config.get("max_examples") or 64)
    if target == INFERFORGE_BETA and max_examples is None:
        cap = max(cap, 64)

    params: dict = {}
    if temperature is not None:
        params["temperature"] = temperature
    if ctx is not None:
        params["num_ctx"] = ctx
    if learning_rate is not None:
        params["learning_rate"] = learning_rate
    if batch_size is not None:
        params["batch_size"] = batch_size
    if epochs is not None:
        params["epochs"] = epochs
    if lora:
        params["lora"] = True
        params["lora_r"] = lora_r
        params["lora_alpha"] = lora_alpha
    
    checkpoint_path = checkpoint_dir or Path.cwd() / "checkpoints" / target.replace(":", "-")
    checkpoint_path.mkdir(parents=True, exist_ok=True)

    use_coding = curriculum.lower() == "coding"
    base_model = resolve_base_model(base)

    console.print(
        f"[bold dark_orange]◈ InferForge[/] training [bold cyan]{target}[/]\n"
        f"  base: [cyan]{base_model}[/]  ·  curriculum: [cyan]{curriculum}[/]  ·  cap: {cap}\n"
        f"  epochs: {epochs}  ·  workers: {workers}"
    )
    if training_data:
        console.print(f"  extra examples: {len(training_data)}")
    if lora:
        console.print(f"  LoRA: rank={lora_r}, alpha={lora_alpha}")
    if validation_split > 0:
        console.print(f"  validation split: {validation_split:.1%}")
    if checkpoint_dir:
        console.print(f"  checkpoints: {checkpoint_path}")
    console.print()
    
    if validate_data and training_data:
        _validate_training_data(training_data, console)

    trainer = ForgeTrainer()

    try:
        with Progress(
            SpinnerColumn(style="dark_orange"),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(bar_width=28),
            TextColumn("{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
            console=console,
        ) as progress:
            task = progress.add_task("training…", total=100)

            def on_prog(status: str, frac: float, eta: float | None = None) -> None:
                desc = f"[cyan]{status or 'training'}[/]"
                if eta:
                    desc += f" [dim]ETA: {eta:.0f}s[/]"
                progress.update(
                    task,
                    completed=max(1, min(99, int(frac * 100))),
                    description=desc,
                )

            if target == INFERFORGE_BETA:
                result = trainer.build_inferforge_beta(
                    base_model=base_model,
                    force=True,
                    progress=on_prog,
                    extra_data=training_data or None,
                    max_examples=cap,
                    checkpoint_dir=checkpoint_path if not resume else None,
                    resume_from=checkpoint_path if resume else None,
                    validation_split=validation_split,
                    workers=workers,
                )
                from inferforge.model.identity import register_inferforge_beta

                register_inferforge_beta(
                    base_model,
                    extra_meta={
                        "trained": True,
                        "examples_embedded": result.get("examples_embedded"),
                        "epochs": epochs,
                        "lora": lora,
                        "checkpoint_path": str(checkpoint_path),
                    },
                )
            else:
                reg = Registry()
                existing = reg.get(target)
                if existing and not training_data and not use_coding:
                    console.print(
                        "[yellow]No --data and curriculum=none — nothing to train. "
                        "Pass --data or --curriculum coding.[/]"
                    )
                    raise SystemExit(2)

                train_base = base or (existing.meta.get("base_model") if existing else None) or base_model
                result = trainer.train_model(
                    target,
                    train_base,
                    training_data=training_data or None,
                    system=system,
                    max_examples=cap,
                    params=params or None,
                    progress=on_prog,
                    use_builtin_coding=use_coding,
                    checkpoint_dir=checkpoint_path if not resume else None,
                    resume_from=checkpoint_path if resume else None,
                    validation_split=validation_split,
                    workers=workers,
                )
            progress.update(task, completed=100, description="done")
    except Exception as exc:
        console.print(f"[bold red]Training failed:[/] {exc}")
        raise SystemExit(1) from exc

    table = Table(title="Training complete", show_header=True, header_style="bold")
    table.add_column("field", style="dim")
    table.add_column("value", style="cyan")
    table.add_row("model", target)
    table.add_row("examples", str(result.get("examples_embedded", "—")))
    table.add_row("epochs", str(epochs))
    table.add_row("status", str(result.get("status", "completed")))
    if lora:
        table.add_row("method", "LoRA")
    if result.get("validation_loss"):
        table.add_row("validation_loss", f"{result['validation_loss']:.4f}")
    if result.get("training_time"):
        table.add_row("training_time", f"{result['training_time']:.1f}s")
    if result.get("path"):
        table.add_row("path", str(result["path"]))
    console.print()
    console.print(table)
    console.print()
    console.print(f"[green]✓[/] Run with: [bold]forge chat[/]  or  [bold]forge run {target}[/]")
    sys.stdout.flush()


def _validate_training_data(data: list[dict], console: Console) -> None:
    """Validate training data quality."""
    console.print("[dim]Validating training data...[/]")
    
    issues = []
    total = len(data)
    
    for i, example in enumerate(data):
        if not isinstance(example, dict):
            issues.append(f"Example {i}: not a dict")
            continue
        
        if "input" not in example:
            issues.append(f"Example {i}: missing 'input' field")
        elif not isinstance(example["input"], str):
            issues.append(f"Example {i}: 'input' not a string")
        elif len(example["input"]) < 3:
            issues.append(f"Example {i}: 'input' too short")
        
        if "output" not in example:
            issues.append(f"Example {i}: missing 'output' field")
        elif not isinstance(example["output"], str):
            issues.append(f"Example {i}: 'output' not a string")
        elif len(example["output"]) < 3:
            issues.append(f"Example {i}: 'output' too short")
    
    if issues:
        console.print(f"[yellow]Found {len(issues)} validation issues:[/]")
        for issue in issues[:10]:
            console.print(f"  [dim]- {issue}[/]")
        if len(issues) > 10:
            console.print(f"  [dim]... and {len(issues) - 10} more[/]")
    else:
        console.print(f"[green]✓[/] All {total} examples validated successfully")
