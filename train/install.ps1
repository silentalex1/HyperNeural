Write-Host "🚀 HyperNeural Turbo SDK - Smart Installer" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Detecting System Configuration..." -ForegroundColor Yellow

$gpuDetected = $false
$gpuName = "None"
$vramGB = 0
$gpuType = "Unknown"

try {
    $nvidiaSmi = nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>$null
    if ($nvidiaSmi) {
        $gpuInfo = $nvidiaSmi -split ','
        $gpuName = $gpuInfo[0].Trim()
        $vramStr = $gpuInfo[1].Trim() -replace ' MiB', ''
        $vramGB = [math]::Round($vramStr / 1024, 1)
        $gpuType = "NVIDIA"
        $gpuDetected = $true
    }
} catch {}

if (-not $gpuDetected) {
    try {
        $amdGpu = wmic path win32_VideoController get name 2>$null | Select-String -Pattern "AMD|Radeon"
        if ($amdGpu) {
            $gpuName = "AMD GPU Detected"
            $gpuType = "AMD"
            $gpuDetected = $true
        }
    } catch {}
}

if ($gpuDetected) {
    Write-Host "✅ GPU Detected: $gpuName" -ForegroundColor Green
    Write-Host "✅ VRAM: ${vramGB}GB" -ForegroundColor Green
    Write-Host "✅ GPU Type: $gpuType" -ForegroundColor Green
    
    if ($vramGB -ge 24) {
        Write-Host "🎯 Recommended: Ultra Speed Mode (4-bit + Flash Attention)" -ForegroundColor Cyan
        $recommendedSpeed = "ultra"
    } elseif ($vramGB -ge 16) {
        Write-Host "🎯 Recommended: Balanced Speed Mode" -ForegroundColor Yellow
        $recommendedSpeed = "balanced"
    } elseif ($vramGB -ge 8) {
        Write-Host "🎯 Recommended: Fast Speed Mode" -ForegroundColor Yellow
        $recommendedSpeed = "fast"
    } else {
        Write-Host "⚠️  Low VRAM: CPU training recommended" -ForegroundColor Red
        $recommendedSpeed = "cpu"
    }
} else {
    Write-Host "⚠️  No GPU detected - CPU training mode" -ForegroundColor Yellow
    $recommendedSpeed = "cpu"
}

Write-Host ""
Write-Host "[2/5] Checking Python Installation..." -ForegroundColor Yellow

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python not found. Installing Python 3.11..."
    
    try {
        winget install --id Python.Python.3.11 -e --silent --accept-package-agreements --accept-source-agreements
        if ($?) {
            Write-Host "✅ Python 3.11 installed via winget" -ForegroundColor Green
        } else {
            Write-Host "Winget failed. Downloading Python installer..."
            Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe' -OutFile 'python_installer.exe'
            python_installer.exe /quiet InstallAllUsers=1 PrependPath=1
            Remove-Item python_installer.exe
        }
        
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } catch {
        Write-Host "❌ Failed to install Python. Please install manually from https://python.org" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Python found" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3/5] Installing HyperNeural Turbo SDK..." -ForegroundColor Yellow

$scriptPath = $PSScriptRoot
$sdkPath = Join-Path $scriptPath "..\hyper neural training"

Write-Host "Installing dependencies..."
python -m pip install --upgrade pip
python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
python -m pip install typer rich datasets peft accelerate bitsandbytes trl transformers requests websockets tqdm click scipy numpy wandb

Write-Host "Installing local SDK from: $sdkPath"
Set-Location $sdkPath
python -m pip install -e .

if ($gpuDetected -and $gpuType -eq "NVIDIA") {
    Write-Host "Installing GPU-optimized dependencies..."
    try {
        python -m pip install flash-attn --no-build-isolation --no-deps
    } catch {
        Write-Host "⚠️  Flash Attention installation failed, continuing without it" -ForegroundColor Yellow
    }
}

Set-Location $scriptPath

Write-Host ""
Write-Host "[4/5] Creating Configuration..." -ForegroundColor Yellow

$configDir = "$env:USERPROFILE\.hyperneural"
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

$config = @{
    gpu_detected = $gpuDetected
    gpu_name = $gpuName
    vram_gb = $vramGB
    gpu_type = $gpuType
    recommended_speed = $recommendedSpeed
    version = "beta-v1.0"
}

$config | ConvertTo-Json | Out-File "$configDir\config.json" -Encoding UTF8

Write-Host "✅ Configuration saved to $configDir\config.json" -ForegroundColor Green

Write-Host ""
Write-Host "[5/6] Installing command shortcuts..." -ForegroundColor Yellow

$batSource = Join-Path $sdkPath ".hyperneural"
$batDest = $configDir

if (Test-Path $batSource) {
    Copy-Item -Path "$batSource\*.bat" -Destination $batDest -Force
    Write-Host "✅ Command shortcuts installed to $batDest" -ForegroundColor Green
    
    $scriptsPath = "$env:USERPROFILE\AppData\Roaming\Python\Python311\Scripts"
    if (Test-Path $scriptsPath) {
        Copy-Item -Path "$batSource\hypertrain.bat" -Destination $scriptsPath -Force
        Write-Host "✅ hypertrain added to Scripts folder" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Batch files not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[6/6] Testing Installation..." -ForegroundColor Yellow

python -m hyperneural_turbo version

if ($?) {
    Write-Host ""
    Write-Host "🎉 Installation Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Quick Start Commands:" -ForegroundColor Cyan
    Write-Host "  hypertrain quickstart 'MyAI' 'A helpful assistant'" -ForegroundColor White
    Write-Host "  hypertrain benchmark" -ForegroundColor White
    Write-Host "  hypertrain --help" -ForegroundColor White
    Write-Host ""
    Write-Host "Recommended Settings: $recommendedSpeed mode" -ForegroundColor Yellow
} else {
    Write-Host "❌ Installation test failed" -ForegroundColor Red
    exit 1
}
