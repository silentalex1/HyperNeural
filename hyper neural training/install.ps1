$ErrorActionPreference = "Stop"

Write-Host "🚀 Installing HyperNeural Turbo SDK..." -ForegroundColor Cyan
Write-Host ""

$scriptUrl = "https://hyperneural.cfd/train/hypertrain.ps1"
$installDir = "$env:USERPROFILE\.hyperneural"
$binDir = "$installDir\bin"

Write-Host "📁 Creating installation directory: $installDir" -ForegroundColor Yellow
if (!(Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}
if (!(Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

Write-Host "📥 Downloading hypertrain.ps1..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $scriptUrl -OutFile "$binDir\hypertrain.ps1" -UseBasicParsing
} catch {
    Write-Host "❌ Failed to download hypertrain.ps1" -ForegroundColor Red
    Write-Host "Please check your internet connection and try again." -ForegroundColor Red
    exit 1
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
    pip install requests websockets
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Creating hypertrain command..." -ForegroundColor Yellow
$batContent = @"
@echo off
python "%USERPROFILE%\.hyperneural\bin\hypertrain.py" %*
"@
$batContent | Out-File -FilePath "$binDir\hypertrain.bat" -Encoding ASCII

$ps1Content = @"
python "%USERPROFILE%\.hyperneural\bin\hypertrain.py" `$args
"@
$ps1Content | Out-File -FilePath "$binDir\hypertrain.ps1" -Encoding ASCII

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
Write-Host "Run these commands to get started:" -ForegroundColor Cyan
Write-Host "  hypertrain --help" -ForegroundColor White
Write-Host "  hypertrain --name MyAI --description 'Your AI description' --base llama3.1-8b" -ForegroundColor White
Write-Host ""
Write-Host "For more info: https://hyperneural.cfd/docs" -ForegroundColor Cyan
