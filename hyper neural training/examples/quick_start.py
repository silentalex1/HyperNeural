"""
Quick Start Example for HyperNeural Turbo SDK
This shows how to train a simple AI model with synthetic data generation
"""

from hyperneural_turbo.core.trainer import HyperTrainer, TrainingConfig
import asyncio

async def main():
    config = TrainingConfig(
        name="QuickStartAI",
        description="A helpful assistant that answers questions about programming",
        base_model="llama3.1-8b",
        examples=3,
        evolve=2,
        gpu="auto",
        speed="balanced",
        output_dir="./models"
    )

    trainer = HyperTrainer(config)
    success = await trainer.train()

    if success:
        print("Training completed successfully!")
        print("Model saved to: ./models/QuickStartAI")
    else:
        print("Training failed")

if __name__ == "__main__":
    asyncio.run(main())
