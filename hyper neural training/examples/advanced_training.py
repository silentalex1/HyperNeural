"""
Advanced Training Example
Shows how to use all features including self-evolution and ultra speed mode
"""

from hyperneural_turbo.core.trainer import HyperTrainer, TrainingConfig
import asyncio

async def main():
    config = TrainingConfig(
        name="AdvancedAI",
        description="A sophisticated AI with deep knowledge of science and technology",
        base_model="llama3.1-8b",
        examples=5,
        evolve=10,
        gpu="auto",
        speed="ultra",
        output_dir="./models",
        backend_url="https://hyperneural.cfd/api/generate"
    )

    trainer = HyperTrainer(config)
    success = await trainer.train()

    if success:
        print("Advanced training completed!")
        print("Model saved to: ./models/AdvancedAI")
        
        trainer.export_to_gguf(config.output_dir / config.name)
    else:
        print("Training failed")

if __name__ == "__main__":
    asyncio.run(main())
