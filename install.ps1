<#
.SYNOPSIS
    HyperNeural Forge Installer for Windows
.DESCRIPTION
    Installs HyperNeural Forge using the custom PyPI index at hyperneural.cfd
.EXAMPLE
    powershell -c "irm https://hyperneural.cfd/install.ps1 | iex"
#>
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
$ErrorActionPreference = "Stop"

function Find-Python {
    foreach ($cmd in @("py -3","python","python3")) {
        try {
            $out = Invoke-Expression "$cmd --version 2>&1" | Out-String
            if ($out -match "Python\s+3\.\d+") {
                if ($out -match "Python was not found") { continue }
                return $cmd
            }
        } catch { continue }
    }
    try {
        $where = (Get-Command python -ErrorAction SilentlyContinue).Source
        if ($where) {
            $v = & python --version 2>&1 | Out-String
            if ($v -notmatch "Python was not found" -and $v -match "Python") { return "python" }
        }
    } catch {}
    return $null
}

Write-Host ""
Write-Host "  HyperNeural Forge Installer v0.2.0" -ForegroundColor Cyan
Write-Host "  ================================" -ForegroundColor Cyan
Write-Host ""

$python = Find-Python
if (-not $python) {
    Write-Host "Python 3.10+ is required but not found." -ForegroundColor Red
    Write-Host "Install from https://www.python.org/downloads/ and check 'Add python to PATH'." -ForegroundColor Yellow
    Write-Host "After installing, restart PowerShell and run again:" -ForegroundColor Yellow
    Write-Host '  powershell -c "irm https://hyperneural.cfd/install.ps1 | iex"' -ForegroundColor White
    exit 1
}

$version = Invoke-Expression "$python -c ""import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')""" 2>&1
$version = $version.ToString().Trim()
if (-not ($version -match "^\d+\.\d+")) {
    Write-Host "Could not determine Python version: $version" -ForegroundColor Red
    exit 1
}
$major, $minor = $version.Split('.') | ForEach-Object { [int]$_ }
if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 10)) {
    Write-Host "Python 3.10+ required. Found: $version" -ForegroundColor Red
    exit 1
}
Write-Host "Python $version detected ($python)" -ForegroundColor Green

$pipOk = $false
try { & $python -m pip --version 2>&1 | Out-Null; if ($LASTEXITCODE -eq 0) { $pipOk = $true } } catch {}
if (-not $pipOk) {
    Write-Host "pip not found. Installing pip..." -ForegroundColor Yellow
    & $python -m ensurepip --upgrade
}

Write-Host "Upgrading pip..." -ForegroundColor Cyan
& $python -m pip install --upgrade pip --quiet

Write-Host "Installing HyperNeural Forge..." -ForegroundColor Cyan
try {
    & $python -m pip install inferforge --index-url https://hyperneural.cfd/pypi/simple/ --extra-index-url https://pypi.org/simple
    if ($LASTEXITCODE -ne 0) { throw "pip exit $LASTEXITCODE" }
    Write-Host ""
    Write-Host "  HyperNeural Forge installed successfully!" -ForegroundColor Green
    Write-Host "  Run 'forge --help' to get started" -ForegroundColor White
    Write-Host "  Run 'forge connect' to link your account" -ForegroundColor White
} catch {
    Write-Host "Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Try: pip install git+https://github.com/silentalex1/HyperNeural.git" -ForegroundColor Yellow
    exit 1
}
