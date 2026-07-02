from setuptools import setup, find_packages
import os

setup(
    name="hyperneural-turbo",
    version="beta-v1.0",
    description="HyperNeural Turbo SDK - Next-gen AI model training with synthetic data generation",
    author="HyperNeural",
    author_email="contact@hyperneural.cfd",
    url="https://hyperneural.cfd",
    packages=find_packages(),
    install_requires=[
        "torch>=2.0.0",
        "transformers>=4.35.0",
        "datasets>=2.14.0",
        "accelerate>=0.24.0",
        "bitsandbytes>=0.41.0",
        "peft>=0.6.0",
        "trl>=0.7.0",
        "rich>=13.0.0",
        "typer>=0.9.0",
        "click>=8.1.0",
        "tqdm>=4.66.0",
        "requests>=2.31.0",
        "websockets>=11.0.0",
        "numpy>=1.24.0",
        "wandb>=0.15.0",
        "scipy>=1.10.0",
    ],
    entry_points={
        "console_scripts": [
            "hypertrain=hyperneural_turbo.cli:main",
        ],
    },
    python_requires=">=3.8",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)
