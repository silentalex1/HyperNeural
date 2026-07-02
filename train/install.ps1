Write-Host "🚀 Installing HyperNeural Turbo SDK..." -ForegroundColor Cyan

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python not found. Please install Python 3.11+ manually." -ForegroundColor Yellow
} else {
    python -m pip install --upgrade pip
    python -m pip install hyperneural-turbo --upgrade
    Write-Host "✅ HyperNeural Turbo SDK installed successfully!" -ForegroundColor Green
    Write-Host "Run: hypertrain --help" -ForegroundColor Cyan
}
