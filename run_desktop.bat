@echo off
echo Starting Project Management Desktop Application...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if there are dependency issues and fix them
echo Checking for dependency compatibility issues...
python -c "import werkzeug.urls; werkzeug.urls.url_decode" >nul 2>&1
if errorlevel 1 (
    echo Detected Werkzeug compatibility issue. Running fix script...
    python fix_dependencies.py
    if errorlevel 1 (
        echo Failed to fix dependencies. Please run fix_dependencies.py manually.
        pause
        exit /b 1
    )
) else (
    echo Dependencies look good. Installing/updating packages...
    pip install -r requirements.txt
)

REM Run the desktop application
echo Starting application...
python run_desktop.py

REM Keep window open if there's an error
if errorlevel 1 (
    echo.
    echo Application encountered an error.
    pause
) 