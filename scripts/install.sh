#!/bin/bash
set -e

echo "InferForge Installer"
echo "==================="
echo ""

if ! command -v python3 &> /dev/null; then
    echo "Python 3 not found. Installing..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install python@3.11
        else
            echo "Install Homebrew first: https://brew.sh"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip
    fi
fi

echo "Installing InferForge..."
python3 -m pip install --upgrade pip

if pip3 show inferforge &> /dev/null; then
    echo "Upgrading InferForge..."
    python3 -m pip install --upgrade inferforge
else
    echo "Installing from GitHub..."
    python3 -m pip install git+https://github.com/silentalex1/HyperNeural.git
fi

echo ""
echo "InferForge installed successfully!"
echo ""
echo "Quick Start:"
echo "  forge pull qwen2.5-coder:7b"
echo "  forge chat"
echo ""
echo "Documentation: https://hyperneural.cfd/docs"
