$ErrorActionPreference = "Stop"

Write-Host "🚀 HyperNeural Turbo SDK Installer" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$installDir = "$env:USERPROFILE\.hyperneural"
$binDir = "$installDir\bin"
$pythonDir = "$installDir\python"

Write-Host "📁 Setting up directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $installDir -Force | Out-Null
New-Item -ItemType Directory -Path $binDir -Force | Out-Null
New-Item -ItemType Directory -Path $pythonDir -Force | Out-Null

Write-Host "📥 Downloading Python CLI package..." -ForegroundColor Yellow
$packageUrl = "https://hyperneural.cfd/train/hyperneural-turbo.zip"
$zipPath = "$installDir\hyperneural-turbo.zip"

try {
    Invoke-WebRequest -Uri $packageUrl -OutFile $zipPath -UseBasicParsing
    Expand-Archive -Path $zipPath -DestinationPath $pythonDir -Force
    Remove-Item $zipPath
    Write-Host "✅ Package downloaded and extracted" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not download package, using embedded code..." -ForegroundColor Yellow
}

Write-Host "🐍 Installing Python dependencies..." -ForegroundColor Yellow
$requirements = @"
torch>=2.0.0
transformers>=4.35.0
datasets>=2.14.0
accelerate>=0.24.0
bitsandbytes>=0.41.0
peft>=0.6.0
trl>=0.7.0
rich>=13.0.0
typer>=0.9.0
click>=8.1.0
tqdm>=4.66.0
requests>=2.31.0
websockets>=11.0.0
numpy>=1.24.0
"@
$requirements | Out-File -FilePath "$installDir\requirements.txt" -Encoding ASCII

try {
    pip install -r "$installDir\requirements.txt" -q
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Creating hypertrain entry point..." -ForegroundColor Yellow
$entryPoint = @"
import sys
import os

sys.path.insert(0, r'$pythonDir')

from hyperneural_turbo.cli import main

if __name__ == "__main__":
    main()
"@
$entryPoint | Out-File -FilePath "$binDir\hypertrain.py" -Encoding UTF8

Write-Host "🔗 Creating command shortcuts..." -ForegroundColor Yellow
$batContent = @"
@echo off
python "%binDir%\hypertrain.py" %*
"@
$batContent | Out-File -FilePath "$binDir\hypertrain.bat" -Encoding ASCII

$ps1Wrapper = @"
`$args = `$args
python "$binDir\hypertrain.py" `$args
"@
$ps1Wrapper | Out-File -FilePath "$binDir\hypertrain.ps1" -Encoding ASCII

Write-Host "🔗 Adding to system PATH..." -ForegroundColor Yellow
$pathEnv = [System.Environment]::GetEnvironmentVariable("Path", "User")
if ($pathEnv -notlike "*$binDir*") {
    [System.Environment]::SetEnvironmentVariable("Path", "$pathEnv;$binDir", "User")
    Write-Host "✅ Added to PATH" -ForegroundColor Green
} else {
    Write-Host "✅ Already in PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Restart your terminal and run:" -ForegroundColor Cyan
Write-Host "  hypertrain --help" -ForegroundColor White
Write-Host ""
