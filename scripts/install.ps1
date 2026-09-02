$ErrorActionPreference = "Stop"

Write-Host "InferForge Installer for Windows" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python not found. Install Python 3.11+ first:" -ForegroundColor Red
    Write-Host "https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

python -m pip install --upgrade pip | Out-Null

$installed = python -m pip show inferforge 2>$null
if ($installed) {
    Write-Host "Upgrading InferForge..." -ForegroundColor Yellow
    python -m pip install --upgrade inferforge | Out-Null
} else {
    Write-Host "Installing InferForge from PyPI..." -ForegroundColor Yellow
    python -m pip install inferforge | Out-Null
}

Write-Host ""
Write-Host "InferForge installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Quick Start:" -ForegroundColor Cyan
Write-Host "  forge pull qwen2.5-coder:7b" -ForegroundColor White
Write-Host "  forge chat" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: https://hyperneural.cfd/docs" -ForegroundColor Gray
