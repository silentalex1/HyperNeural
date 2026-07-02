@echo off
echo ========================================
echo HyperNeural Turbo SDK Quick Install
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [1/4] Python not found. Installing Python 3.11...
    echo This may take a few minutes...
    
    REM Try winget first
    winget install --id Python.Python.3.11 -e --silent --accept-package-agreements --accept-source-agreements
    if errorlevel 1 (
        echo Winget failed. Downloading Python installer...
        
        REM Download Python installer
        powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe' -OutFile 'python_installer.exe'"
        if errorlevel 1 (
            echo ERROR: Failed to download Python
            echo Please install Python manually from https://python.org
            pause
            exit /b 1
        )
        
        echo Installing Python...
        python_installer.exe /quiet InstallAllUsers=1 PrependPath=1
        if errorlevel 1 (
            echo ERROR: Failed to install Python
            pause
            exit /b 1
        )
        
        del python_installer.exe
        
        REM Refresh PATH
        refreshenv >nul 2>&1
        set PATH=%PATH%;C:\Program Files\Python311;C:\Program Files\Python311\Scripts
    )
    
    echo Python installed successfully!
) else (
    echo [1/4] Python found, skipping installation
)

REM Refresh PATH to include Python
set PATH=%PATH%;C:\Program Files\Python311;C:\Program Files\Python311\Scripts;C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311;C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311\Scripts

REM Verify Python is now available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python still not found after installation
    echo Please restart your terminal and run this script again
    pause
    exit /b 1
)

echo [2/4] Installing Python dependencies...
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install typer rich datasets peft accelerate bitsandbytes trl transformers requests websockets tqdm click scipy numpy wandb
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [3/4] Installing local SDK...
pip install -e .
if errorlevel 1 (
    echo ERROR: Failed to install SDK
    pause
    exit /b 1
)

echo [4/4] Creating hypertrain.bat in current directory...
echo @echo off > hypertrain.bat
echo python -m hyperneural_turbo %%* >> hypertrain.bat
echo hypertrain.bat created successfully

echo [5/5] Testing installation...
python -m hyperneural_turbo --version
if errorlevel 1 (
    echo ERROR: Failed to run hypertrain
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo IMPORTANT: Use hypertrain with .bat extension:
echo   .\hypertrain.bat --help
echo   .\hypertrain.bat version
echo   .\hypertrain.bat benchmark
echo.
echo To use 'hypertrain' without .bat, add to PATH:
echo   setx PATH "%PATH%;%CD%"
echo.
echo Then restart your terminal and run:
echo   hypertrain --help
echo.
pause
