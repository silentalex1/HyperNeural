$ErrorActionPreference = "Stop"

Write-Host "🚀 Installing HyperNeural Turbo SDK..." -ForegroundColor Cyan
Write-Host ""

$installDir = "$env:USERPROFILE\.hyperneural"
$binDir = "$installDir\bin"
$pythonDir = "$installDir\python"

Write-Host "📁 Creating installation directory: $installDir" -ForegroundColor Yellow
if (!(Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}
if (!(Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}
if (!(Test-Path $pythonDir)) {
    New-Item -ItemType Directory -Path $pythonDir -Force | Out-Null
}

Write-Host "🐍 Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Python not found. Installing Python 3.11..." -ForegroundColor Yellow
    try {
        winget install --id Python.Python.3.11 -e --silent --accept-package-agreements --accept-source-agreements
        Write-Host "✅ Python 3.11 installed" -ForegroundColor Green
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } catch {
        Write-Host "❌ Failed to install Python automatically" -ForegroundColor Red
        Write-Host "Please install Python 3.11+ from https://python.org and try again." -ForegroundColor Red
        exit 1
    }
}

Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
try {
    pip install --upgrade pip
    pip install torch transformers datasets accelerate bitsandbytes peft trl
    pip install rich typer click tqdm
    pip install requests websockets wandb scipy
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Creating hypertrain CLI..." -ForegroundColor Yellow

$cliCode = @"
import sys
import os
sys.path.insert(0, r'$pythonDir')

try:
    from hyperneural_turbo.cli import main
    main()
except ImportError:
    print("HyperNeural Turbo SDK not found. Please install from: https://github.com/hyperneural/hyperneural-turbo")
    sys.exit(1)
"@
$cliCode | Out-File -FilePath "$binDir\hypertrain.py" -Encoding UTF8

Write-Host "🔧 Creating command shortcuts..." -ForegroundColor Yellow
$batContent = @"
@echo off
python "$binDir\hypertrain.py" %*
"@
$batContent | Out-File -FilePath "$binDir\hypertrain.bat" -Encoding ASCII

$ps1Wrapper = @"
`$args = `$args
python "$binDir\hypertrain.py" `$args
"@
$ps1Wrapper | Out-File -FilePath "$binDir\hypertrain.ps1" -Encoding ASCII

Write-Host "🔗 Adding to PATH..." -ForegroundColor Yellow
$pathEnv = [System.Environment]::GetEnvironmentVariable("Path", "User")
if ($pathEnv -notlike "*$binDir*") {
    [System.Environment]::SetEnvironmentVariable("Path", "$pathEnv;$binDir", "User")
    Write-Host "✅ Added to PATH (restart terminal to use)" -ForegroundColor Green
} else {
    Write-Host "✅ Already in PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 HyperNeural Turbo SDK installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Download the SDK from: https://github.com/hyperneural/hyperneural-turbo" -ForegroundColor White
Write-Host "2. Extract to: $pythonDir" -ForegroundColor White
Write-Host "3. Restart terminal and run: hypertrain --help" -ForegroundColor White
Write-Host ""
Write-Host "Or use the local .bat file: $binDir\hypertrain.bat --help" -ForegroundColor Cyan

