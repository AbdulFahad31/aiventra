@echo off
REM ForensiAI Backend Startup Script for Windows

echo.
echo ================================================
echo ForensiAI Backend - Startup Script
echo ================================================
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo [*] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo [*] Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

REM Install requirements
echo [*] Installing dependencies...
pip install -q -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

REM Check for .env file
if not exist ".env" (
    echo.
    echo [!] No .env file found
    echo [*] Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo [!] IMPORTANT: Edit .env and add your Featherless API key
    echo    FEATHERLESS_API_KEY=your_api_key_here
    echo.
)

REM Start backend
echo.
echo ================================================
echo [*] Starting ForensiAI Backend...
echo [*] Backend: http://localhost:8000
echo [*] API Docs: http://localhost:8000/docs
echo ================================================
echo.

python main.py

pause
