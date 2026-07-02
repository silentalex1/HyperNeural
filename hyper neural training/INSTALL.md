# Installation Guide

## Windows Installation

### Method 1: One-Line Installer (Recommended)

```powershell
irm https://hyperneural.cfd/train/install.ps1 | iex
```

### Method 2: Manual Installation

1. **Install Python 3.8+**
   ```powershell
   winget install Python.Python.3.11
   ```

2. **Clone or download the SDK**
   ```powershell
   git clone https://github.com/hyperneural/hyperneural-turbo.git
   cd hyperneural-turbo
   ```

3. **Install dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Add to PATH**
   - Add the directory containing `hypertrain.bat` to your system PATH
   - Or run directly: `.\hypertrain.bat --help`

## Linux/Mac Installation

```bash
# Install Python 3.8+
sudo apt install python3.11 python3-pip  # Ubuntu/Debian
brew install python@3.11  # macOS

# Clone repository
git clone https://github.com/hyperneural/hyperneural-turbo.git
cd hyperneural-turbo

# Install dependencies
pip3 install -r requirements.txt

# Make executable
chmod +x hypertrain

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$PATH:$(pwd)"
```

## Pip Installation

```bash
pip install hyperneural-turbo
```

## Verify Installation

```bash
hypertrain --help
```

## GPU Requirements

For optimal performance (ultra speed mode):
- NVIDIA GPU with 8GB+ VRAM
- CUDA 11.8+ 
- cuDNN 8.6+

Recommended GPUs:
- RTX 4090 (24GB) - Best performance
- RTX 3090 (24GB) - Excellent performance  
- RTX 4080 (16GB) - Good performance
- RTX 3080 (10GB) - Acceptable performance

CPU-only training is supported but significantly slower.

## Troubleshooting

### Python not found
- Ensure Python 3.8+ is installed and in PATH
- On Windows, restart terminal after installation

### CUDA errors
- Install latest NVIDIA drivers
- Install CUDA toolkit from NVIDIA website
- Verify with: `nvidia-smi`

### Out of memory
- Reduce batch size in training config
- Use "balanced" or "fast" speed mode instead of "ultra"
- Close other GPU-intensive applications

### Import errors
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Try upgrading pip: `pip install --upgrade pip`
