# setup.ps1 — Set up Seaside Static on Windows.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Seaside Static - Setup"                   -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Setting up Python environment ..." -ForegroundColor Gray

$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "[!!] Python 3.10+ is required but not found." -ForegroundColor Red
    Write-Host "     Please install Python from https://www.python.org/downloads/"
    exit 1
}

python -m venv venv
& .\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip -q
pip install -r requirements.txt -q

Write-Host "[OK] Environment ready (virtualenv in .\venv)." -ForegroundColor Green
Write-Host ""
Write-Host "Run the game with:" -ForegroundColor White
Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor Yellow
Write-Host "  python chat.py" -ForegroundColor Yellow
