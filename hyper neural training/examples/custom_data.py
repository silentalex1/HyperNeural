"""
Custom Data Training Example
Shows how to train with your own dataset instead of synthetic generation
"""

from hyperneural_turbo.core.trainer import HyperTrainer, TrainingConfig
import asyncio
from datasets import load_dataset

async def main():
    config = TrainingConfig(
        name="CustomDataAI",
        description="AI trained on custom dataset",
        base_model="llama3.1-8b",
        examples=0,
        evolve=0,
        gpu="auto",
        speed="balanced",
        output_dir="./models"
    )

    trainer = HyperTrainer(config)
    
    dataset = load_dataset("json", data_files="your_data.jsonl", split="train")
    
    success = await trainer.train_with_custom_data(dataset)

    if success:
        print("Training with custom data completed!")
    else:
        print("Training failed")

if __name__ == "__main__":
    asyncio.run(main())
