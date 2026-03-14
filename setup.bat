@echo off
REM setup.bat — Install everything needed to run DeepSeek R1 (Qwen3 8B) locally on Windows.
REM
REM Usage:
REM   Double-click this file, or run from Command Prompt:
REM     setup.bat

echo ============================================
echo   DeepSeek R1 (Qwen3 8B) — Local Setup
echo ============================================
echo.

REM ── 1. Check for Ollama ─────────────────────────────────────────────────────
where ollama >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Ollama is already installed.
) else (
    echo [!!] Ollama is NOT installed.
    echo.
    echo     Please download and install Ollama from:
    echo       https://ollama.com/download
    echo.
    echo     After installing, re-run this script.
    pause
    exit /b 1
)

echo.

REM ── 2. Pull the model ──────────────────────────────────────────────────────
echo Pulling model: deepseek-r1:8b  (this may take a while on first run) ...
ollama pull deepseek-r1:8b
echo [OK] Model ready.

echo.

REM ── 3. Python virtual environment & dependencies ───────────────────────────
echo Setting up Python environment ...

where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [!!] Python is required but not found.
    echo     Please install Python 3.10+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

python -m venv venv
call venv\Scripts\activate.bat
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo [OK] Python environment ready.

echo.
echo ============================================
echo   Setup complete!
echo.
echo   To start chatting, run:
echo.
echo     venv\Scripts\activate.bat
echo     python chat.py
echo.
echo ============================================
pause
