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

# Colors
$RED = [ConsoleColor]::Red
$GREEN = [ConsoleColor]::Green
$YELLOW = [ConsoleColor]::Yellow
$BLUE = [ConsoleColor]::Cyan
$WHITE = [ConsoleColor]::White
$GRAY = [ConsoleColor]::DarkGray

function Write-Colored {
    param([string]$Message, [ConsoleColor]$Color = $WHITE)
    Write-Host $Message -ForegroundColor $Color
}

function Write-Section {
    param([string]$Title)
    Write-Colored "`n╔══════════════════════════════════════════════════════════╗" $BLUE
    Write-Colored "║  $Title" $BLUE
    Write-Colored "╚══════════════════════════════════════════════════════════╝" $BLUE
}

Write-Section "HyperNeural Forge Installer v0.2.0"

# Check for Python
$python = $null
if (Get-Command python -ErrorAction SilentlyContinue) { $python = "python" }
elseif (Get-Command python3 -ErrorAction SilentlyContinue) { $python = "python3" }

if (-not $python) {
    Write-Colored "✗ Python 3.10+ is required but not found." $RED
    Write-Host "Please install Python 3.10+ from https://python.org"
    exit 1
}

# Check Python version
$version = & $python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
$major, $minor = $version.Split('.') | ForEach-Object { [int]$_ }

if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 10)) {
    Write-Colored "✗ Python 3.10+ required. Found: $version" $RED
    exit 1
}

Write-Colored "✓ Python $version detected" $GREEN

# Check for pip
$pip = "pip"
if (-not (Get-Command pip -ErrorAction SilentlyContinue)) {
    if (Get-Command pip3 -ErrorAction SilentlyContinue) { $pip = "pip3" }
    else {
        Write-Colored "⚠ pip not found. Installing pip..." $YELLOW
        & $python -m ensurepip --upgrade
        $pip = "pip"
    }
}

# Upgrade pip
Write-Colored "→ Upgrading pip..." $BLUE
& $python -m pip install --upgrade pip --quiet

# Install Forge with custom index
Write-Colored "→ Installing HyperNeural Forge with custom index..." $BLUE
try {
    & $pip install inferforge --index-url https://hyperneural.cfd/pypi/simple/ --extra-index-url https://pypi.org/simple
    Write-Colored "`n══════════════════════════════════════════════════════════" $GREEN
    Write-Colored "  ✓ HyperNeural Forge installed successfully!" $GREEN
    Write-Colored "══════════════════════════════════════════════════════════" $GREEN
    Write-Colored "`nRun ${BLUE}forge --help${NC} to get started"
    Write-Colored "Run ${BLUE}forge connect${NC} to link your account"
} catch {
    Write-Colored "`n✗ Installation failed: $($_.Exception.Message)" $RED
    Write-Host "You can also try: pip install git+https://github.com/silentalex1/HyperNeural.git"
    exit 1
}