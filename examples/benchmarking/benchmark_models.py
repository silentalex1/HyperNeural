"""
Model Benchmarking Example
Compare performance of different models and backends.
"""

from pathlib import Path

from inferforge.benchmark.suite import BenchmarkSuite, PerformanceBenchmark
from inferforge.core.registry import Registry


def main():
    print("🎯 InferForge Benchmarking Example\n")
    
    # Get available models
    registry = Registry()
    models = registry.list()
    
    if not models:
        print("No models found. Run: forge import ollama")
        return
    
    print(f"Found {len(models)} models")
    print("Select models to benchmark (comma-separated):")
    
    for idx, model in enumerate(models, 1):
        print(f"{idx}. {model.name} ({model.display_size()})")
    
    selection = input("\nEnter numbers (e.g., 1,2,3): ").strip()
    
    if not selection:
        print("No models selected")
        return
    
    # Parse selection
    indices = [int(x.strip()) - 1 for x in selection.split(",")]
    selected_models = [models[i] for i in indices if 0 <= i < len(models)]
    
    if not selected_models:
        print("Invalid selection")
        return
    
    # Create benchmark
    benchmark = PerformanceBenchmark()
    suite = BenchmarkSuite(
        name="comparison",
        prompt="Write a Python function to calculate fibonacci numbers",
        max_tokens=150,
        num_runs=3,
    )
    
    print(f"\nBenchmarking {len(selected_models)} models...")
    print("This may take a few minutes...\n")
    
    # Run benchmarks
    comparison = benchmark.compare_models(selected_models, suite)
    
    # Display results
    print("\n" + "="*60)
    print("BENCHMARK RESULTS")
    print("="*60 + "\n")
    
    for model_name, results in comparison.items():
        print(f"Model: {model_name}")
        
        if not results or results[0].error:
            print(f"  ❌ Error: {results[0].error if results else 'Unknown'}\n")
            continue
        
        result = results[0]
        print(f"  ✅ Duration: {result.duration:.2f}s")
        
        if result.tokens_per_second:
            print(f"  ⚡ Tokens/s: {result.tokens_per_second:.1f}")
        
        if result.first_token_latency:
            print(f"  🚀 First token: {result.first_token_latency:.3f}s")
        
        if result.memory_used_mb:
            print(f"  💾 Memory: {result.memory_used_mb:.1f}MB")
        
        print()
    
    # Save results
    output_path = Path("benchmark_results.json")
    benchmark.save_results(output_path)
    print(f"📊 Results saved to: {output_path}")


if __name__ == "__main__":
    main()
