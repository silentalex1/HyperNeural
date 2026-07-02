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
pip install torch transformers datasets accelerate bitsandbytes peft trl rich typer click tqdm requests websockets wandb scipy
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [3/4] Creating run script...
echo @echo off > run_hypertrain.bat
echo cd /d "%%~dp0" >> run_hypertrain.bat
echo python hyperneural_turbo\cli.py %%* >> run_hypertrain.bat

echo [4/4] Testing installation...
python hyperneural_turbo\cli.py --version
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
echo To use hypertrain:
echo   run_hypertrain.bat --help
echo   run_hypertrain.bat version
echo   run_hypertrain.bat benchmark
echo   run_hypertrain.bat train --name "MyAI" --description "..." --base "meta-llama/Llama-3.1-8B"
echo.
echo NOTE: If commands don't work, restart your terminal first
echo.
pause
