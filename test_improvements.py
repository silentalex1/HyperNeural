#!/usr/bin/env python3
"""
Test script for InferForge improvements.
Validates Nexara parsing and enhanced features.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from inferforge.nexara.parser import NexaraParser
from inferforge.nexara.engine import NexaraEngine
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()


def test_nexara_parser():
    """Test enhanced Nexara parser with complex syntax."""
    console.print("\n[bold cyan]Testing Nexara Parser...[/]\n")
    
    parser = NexaraParser()
    
    # Read the training file
    training_file = Path(__file__).parent / "inferforge_beta_training.nexara"
    
    if not training_file.exists():
        console.print("[red]✗[/] Training file not found")
        return False
    
    code = training_file.read_text(encoding="utf-8")
    
    # Test parsing
    try:
        models = parser.parse(code)
        console.print(f"[green]✓[/] Parsed {len(models)} model(s)")
        
        for model in models:
            console.print(f"\n[bold]Model:[/] {model.name}")
            console.print(f"  Base: {model.base_model}")
            console.print(f"  Task: {model.task}")
            
            # Check training config
            if model.training_config:
                console.print(f"  Training params: {len(model.training_config)} keys")
                if "task_weights" in model.training_config:
                    console.print("    [green]✓[/] Multi-task learning detected")
                if "adversarial_training" in model.training_config:
                    console.print("    [green]✓[/] Adversarial training enabled")
            
            # Check curriculum
            if model.metadata.get("curriculum"):
                stages = len([k for k in model.metadata.keys() if k.startswith("stage")])
                console.print(f"  Curriculum stages: {stages}")
            
            # Check dataset config
            if model.dataset_config:
                console.print(f"  Dataset params: {len(model.dataset_config)} keys")
                if "sources" in model.dataset_config:
                    console.print("    [green]✓[/] Multi-source dataset")
                if "languages" in model.dataset_config:
                    console.print("    [green]✓[/] Multi-language support")
            
            # Check evolution
            if model.evolution_config:
                console.print(f"  Evolution params: {len(model.evolution_config)} keys")
                if "objectives" in model.evolution_config:
                    console.print("    [green]✓[/] Multi-objective optimization")
            
            # Check metadata for new blocks
            new_blocks = ["reinforcement", "code_understanding", "meta_learning", 
                         "adversarial", "continual_learning", "interpretability", "safety"]
            found_blocks = [b for b in new_blocks if b in model.metadata]
            if found_blocks:
                console.print(f"  Advanced features: {', '.join(found_blocks)}")
        
        return True
    
    except Exception as e:
        console.print(f"[red]✗[/] Parse error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_nexara_validation():
    """Test Nexara code validation."""
    console.print("\n[bold cyan]Testing Nexara Validation...[/]\n")
    
    parser = NexaraParser()
    
    # Test valid code
    valid_code = """
    model TestModel {
        base: "qwen2.5-coder:7b"
        task: "code-completion"
        
        training {
            epochs: 3
            learning_rate: 0.0001
        }
    }
    """
    
    is_valid, errors = parser.validate(valid_code)
    if is_valid:
        console.print("[green]✓[/] Valid code accepted")
    else:
        console.print(f"[red]✗[/] Valid code rejected: {errors}")
        return False
    
    # Test invalid code
    invalid_code = """
    model InvalidModel {
        training {
            epochs: -1
            batch_size: 0
        }
    }
    """
    
    is_valid, errors = parser.validate(invalid_code)
    if not is_valid:
        console.print("[green]✓[/] Invalid code rejected")
        console.print(f"  Errors: {len(errors)}")
    else:
        console.print("[red]✗[/] Invalid code accepted")
        return False
    
    return True


def test_hardware_detection():
    """Test hardware detection and optimization."""
    console.print("\n[bold cyan]Testing Hardware Detection...[/]\n")
    
    engine = NexaraEngine()
    
    try:
        hardware = engine.detect_hardware()
        
        table = Table(title="Detected Hardware")
        table.add_column("Component", style="cyan")
        table.add_column("Value", style="green")
        
        table.add_row("OS", hardware["os"])
        table.add_row("CPU Cores", str(hardware["cpu_cores"]))
        table.add_row("RAM", f"{hardware['ram']}GB")
        table.add_row("GPU Available", "Yes" if hardware["gpu_available"] else "No")
        if hardware["gpu_available"]:
            table.add_row("GPU Name", hardware["gpu_name"] or "Unknown")
            table.add_row("GPU Memory", f"{hardware['gpu_memory']}MB" if hardware['gpu_memory'] else "Unknown")
        
        console.print(table)
        console.print("[green]✓[/] Hardware detection successful")
        
        return True
    
    except Exception as e:
        console.print(f"[red]✗[/] Hardware detection failed: {e}")
        return False


def test_nexara_compilation():
    """Test Nexara compilation to training config."""
    console.print("\n[bold cyan]Testing Nexara Compilation...[/]\n")
    
    engine = NexaraEngine()
    
    test_code = """
    model TestModel {
        base: "qwen2.5-coder:7b"
        task: "code-completion"
        
        training {
            epochs: 3
            learning_rate: 0.0001
            batch_size: 4
        }
        
        hardware {
            prefer_gpu: true
            min_ram: 8
        }
    }
    """
    
    try:
        # Validate first
        is_valid, errors = engine.validate_code(test_code)
        if not is_valid:
            console.print(f"[red]✗[/] Validation failed: {errors}")
            return False
        
        console.print("[green]✓[/] Code validated")
        
        # Test compilation (dry run)
        from pathlib import Path
        import tempfile
        
        with tempfile.TemporaryDirectory() as tmpdir:
            output_dir = Path(tmpdir)
            result = engine.compile_and_train(test_code, output_dir)
            
            console.print(f"[green]✓[/] Compilation successful")
            console.print(f"  Models: {result['models_count']}")
            console.print(f"  Hardware: {result['hardware']['cpu_cores']} cores, {result['hardware']['ram']}GB RAM")
            console.print(f"  Script: {result['script_path']}")
            
            # Check generated files
            if (output_dir / "nexara_config.json").exists():
                console.print("  [green]✓[/] Config file generated")
            if (output_dir / "train_nexara.py").exists():
                console.print("  [green]✓[/] Training script generated")
                # Check script size
                script_size = (output_dir / "train_nexara.py").stat().st_size
                console.print(f"  Script size: {script_size} bytes")
        
        return True
    
    except Exception as e:
        console.print(f"[red]✗[/] Compilation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_nested_parsing():
    """Test parsing of complex nested structures."""
    console.print("\n[bold cyan]Testing Nested Structure Parsing...[/]\n")
    
    parser = NexaraParser()
    
    complex_code = """
    model ComplexModel {
        base: "qwen2.5-coder:7b"
        
        reasoning {
            type: "chain_of_thought"
            depth: 8
            self_reflection: true
        }
        
        dataset {
            sources {
                github: 0.4
                stackoverflow: 0.3
                docs: 0.3
            }
            
            languages {
                python: { weight: 0.5, min_examples: 10000 }
                rust: { weight: 0.3, min_examples: 5000 }
            }
        }
        
        evolution {
            objectives {
                intelligence: { weight: 0.5, metric: "score" }
                speed: { weight: 0.3, metric: "tps" }
            }
        }
    }
    """
    
    try:
        models = parser.parse(complex_code)
        if not models:
            console.print("[red]✗[/] No models parsed")
            return False
        
        model = models[0]
        console.print(f"[green]✓[/] Parsed complex model: {model.name}")
        
        # Check nested structures
        checks = []
        
        if "reasoning" in model.metadata:
            reasoning = model.metadata["reasoning"]
            if isinstance(reasoning, dict) and "type" in reasoning:
                console.print("  [green]✓[/] Reasoning config parsed")
                checks.append(True)
            else:
                console.print("  [red]✗[/] Reasoning config malformed")
                checks.append(False)
        
        if model.dataset_config:
            if "sources" in model.dataset_config:
                console.print("  [green]✓[/] Dataset sources parsed")
                checks.append(True)
            if "languages" in model.dataset_config:
                langs = model.dataset_config["languages"]
                if isinstance(langs, dict):
                    console.print(f"  [green]✓[/] Languages parsed ({len(langs)} languages)")
                    checks.append(True)
        
        if model.evolution_config:
            if "objectives" in model.evolution_config:
                objectives = model.evolution_config["objectives"]
                if isinstance(objectives, dict):
                    console.print(f"  [green]✓[/] Evolution objectives parsed ({len(objectives)} objectives)")
                    checks.append(True)
        
        return all(checks) if checks else False
    
    except Exception as e:
        console.print(f"[red]✗[/] Nested parsing failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all tests and show summary."""
    console.print(Panel.fit(
        "[bold cyan]InferForge Improvements Test Suite[/]",
        border_style="cyan"
    ))
    
    tests = [
        ("Nexara Parser", test_nexara_parser),
        ("Nexara Validation", test_nexara_validation),
        ("Hardware Detection", test_hardware_detection),
        ("Nexara Compilation", test_nexara_compilation),
        ("Nested Parsing", test_nested_parsing),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            console.print(f"\n[red]Test crashed: {name}[/]")
            console.print(f"[red]Error: {e}[/]")
            results.append((name, False))
    
    # Summary
    console.print("\n" + "=" * 60)
    console.print("[bold cyan]Test Summary[/]\n")
    
    table = Table()
    table.add_column("Test", style="cyan")
    table.add_column("Result", style="white")
    
    passed = 0
    failed = 0
    
    for name, result in results:
        if result:
            table.add_row(name, "[green]✓ PASSED[/]")
            passed += 1
        else:
            table.add_row(name, "[red]✗ FAILED[/]")
            failed += 1
    
    console.print(table)
    
    console.print(f"\n[bold]Total:[/] {len(results)} tests")
    console.print(f"[green]Passed:[/] {passed}")
    console.print(f"[red]Failed:[/] {failed}")
    
    success_rate = (passed / len(results) * 100) if results else 0
    console.print(f"[cyan]Success Rate:[/] {success_rate:.1f}%\n")
    
    if passed == len(results):
        console.print(Panel.fit(
            "[bold green]✓ All tests passed![/]\n"
            "InferForge improvements are working correctly.",
            border_style="green",
            title="Success"
        ))
        return 0
    else:
        console.print(Panel.fit(
            f"[bold yellow]⚠ {failed} test(s) failed[/]\n"
            "Some features may need attention.",
            border_style="yellow",
            title="Partial Success"
        ))
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
