@echo off
REM setup.bat — Set up Seaside Static on Windows.

echo ============================================
echo   Seaside Static — Setup
echo ============================================
echo.
echo Setting up Python environment ...

where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [!!] Python 3.10+ is required but not found.
    echo     Please install Python from https://www.python.org/downloads/
    pause
    exit /b 1
)

python -m venv venv
call venv\Scripts\activate.bat
python -m pip install --upgrade pip -q
pip install -r requirements.txt -q

echo [OK] Environment ready.
echo.
echo Run the game with:
echo   venv\Scripts\activate.bat
echo   python chat.py
pause
