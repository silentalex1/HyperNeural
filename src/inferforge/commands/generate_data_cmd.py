from __future__ import annotations

import json
import random
from pathlib import Path

import click
from rich.console import Console

console = Console()

TOPICS = {
    "python coding": [
        ("Write a Python function that {task}.", ["reverses a string", "flattens a nested list", "checks if a number is prime", "merges two sorted lists"]),
        ("Explain what this code does:\n{snippet}", ["x = [i**2 for i in range(10)]", "d = dict.fromkeys(keys, 0)", "result = list(filter(None, items))"]),
        ("Fix the bug in this function:\n{snippet}", ["def add(a, b): return a - b", "for i in range(len(items) + 1): print(items[i])", "def greet(name): print('Hello ' + name"]),
    ],
    "general": [
        ("Summarize the following text in one sentence:\n{text}", []),
        ("Answer this question with a short explanation: {question}", ["Why is the sky blue?", "What is a binary tree?", "How does HTTP caching work?"]),
    ],
}


@click.command("generate-data")
@click.option("--topic", default="general", help="Topic for synthetic data")
@click.option("--count", "-n", default=100, help="Number of examples to generate")
@click.option("--difficulty", type=click.Choice(["easy", "medium", "hard"]), default="medium", help="Difficulty level")
@click.option("--output", "-o", default=None, help="Output JSON file path")
@click.option("--seed-file", "--from-seed", "seed_file", default=None, help="Seed examples JSON to augment")
@click.option("--augment", "-a", type=int, default=None, help="Augmentation factor when using --from-seed")
def generate_data_command(topic: str, count: int, difficulty: str, output: str | None, seed_file: str | None, augment: int | None):
    """Generate synthetic training data."""
    if seed_file:
        seed_path = Path(seed_file)
        if not seed_path.exists():
            console.print(f"[red]Seed file not found:[/] {seed_path}")
            return
        try:
            seeds = json.loads(seed_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            console.print("[red]Seed file is not valid JSON.[/]")
            return
        factor = augment or 5
        generated = []
        for i in range(factor):
            for item in seeds:
                variant = dict(item)
                text = str(variant.get("text", json.dumps(item)))
                suffixes = ["", f"\nVariation {i + 1}.", "\nReworded for training.", f"\nDifficulty: {difficulty}."]
                variant["text"] = text + suffixes[i % len(suffixes)]
                generated.append(variant)
        console.print(f"[green]Augmented {len(seeds)} seeds by {factor}x -> {len(generated)} examples[/]")
    else:
        templates = TOPICS.get(topic.lower(), TOPICS["general"])
        generated = []
        rng = random.Random(count + len(topic))
        prefixes = {"easy": "Simple task: ", "medium": "", "hard": "Advanced challenge: "}
        for i in range(count):
            template, options = rng.choice(templates)
            content = template
            if "{task}" in content and options:
                content = content.replace("{task}", rng.choice(options))
            elif "{snippet}" in content and options:
                content = content.replace("{snippet}", rng.choice(options))
            elif "{text}" in content:
                content = content.replace("{text}", "Sample paragraph used for summarization practice.")
            elif "{question}" in content and options:
                content = content.replace("{question}", rng.choice(options))
            content = prefixes[difficulty] + content
            generated.append({
                "id": f"{topic.replace(' ', '_')}_{difficulty}_{i + 1}",
                "prompt": content,
                "topic": topic,
                "difficulty": difficulty,
            })
        console.print(f"[green]Generated {len(generated)} examples on topic '{topic}' ({difficulty})[/]")

    out_path = Path(output) if output else Path(f"generated_{topic.replace(' ', '_')}_{difficulty}.json")
    out_path.write_text(json.dumps(generated, indent=2), encoding="utf-8")
    console.print(f"[green]Saved to[/] [bold]{out_path}[/]")
    console.print("[dim]Use with: forge train my-model --data {}[/]".format(out_path))
