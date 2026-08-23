$ErrorActionPreference = "Stop"

Write-Host "InferForge Installer for Windows" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$INSTALL_DIR = "$env:LOCALAPPDATA\InferForge"
$BIN_DIR = "$INSTALL_DIR\bin"

if (!(Test-Path $INSTALL_DIR)) {
    New-Item -ItemType Directory -Path $INSTALL_DIR -Force | Out-Null
}

if (!(Test-Path $BIN_DIR)) {
    New-Item -ItemType Directory -Path $BIN_DIR -Force | Out-Null
}

Write-Host "Installing Python dependencies..." -ForegroundColor Yellow

if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m pip install --upgrade pip | Out-Null
    
    $installed = python -m pip show inferforge 2>$null
    if ($installed) {
        Write-Host "Upgrading InferForge..." -ForegroundColor Yellow
        python -m pip install --upgrade inferforge | Out-Null
    } else {
        Write-Host "Installing from GitHub..." -ForegroundColor Yellow
        python -m pip install git+https://github.com/silentalex1/HyperNeural.git | Out-Null
    }
    
    Write-Host "InferForge installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Quick Start:" -ForegroundColor Cyan
    Write-Host "  forge pull qwen2.5-coder:7b" -ForegroundColor White
    Write-Host "  forge chat" -ForegroundColor White
    Write-Host ""
    Write-Host "Documentation: https://hyperneural.cfd/docs" -ForegroundColor Gray
} else {
    Write-Host "Python not found. Install Python 3.11+ first:" -ForegroundColor Red
    Write-Host "https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}
