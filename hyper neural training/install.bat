@echo off
echo Installing HyperNeural Turbo SDK...
echo.

REM Install Python dependencies
echo Installing Python dependencies...
pip install torch transformers datasets accelerate bitsandbytes peft trl
pip install rich typer click tqdm requests websockets wandb scipy

echo.
echo Installation complete!
echo.
echo To use hypertrain, run:
echo python -m hyperneural_turbo.cli --help
echo.
echo Or from this directory:
echo python hyperneural_turbo\cli.py --help
