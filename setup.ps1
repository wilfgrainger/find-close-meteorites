# setup.ps1 — Install everything needed to run DeepSeek R1 (8B) locally on Windows.
#
# Usage (run from PowerShell):
#   .\setup.ps1
#
# If you get an execution-policy error, run this first:
#   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DeepSeek R1 (8B) - Local Setup"            -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Check for Ollama ──────────────────────────────────────────────────────
$ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue
if ($ollamaCmd) {
    Write-Host "[OK] Ollama is already installed." -ForegroundColor Green
} else {
    Write-Host "[!!] Ollama is NOT installed." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "     Downloading Ollama installer ..."
    $installerUrl = "https://ollama.com/download/OllamaSetup.exe"
    $installerPath = Join-Path $env:TEMP "OllamaSetup.exe"
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "     Running installer (follow the prompts) ..."
    Start-Process -FilePath $installerPath -Wait
    # Refresh PATH so we can find ollama
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH", "User")
    $ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue
    if (-not $ollamaCmd) {
        Write-Host "[!!] Ollama still not found on PATH. Please restart this terminal and re-run the script." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Ollama installed." -ForegroundColor Green
}

Write-Host ""

# ── 2. Start Ollama if not running ───────────────────────────────────────────
try {
    $null = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3
} catch {
    Write-Host "Starting Ollama server in the background ..." -ForegroundColor Gray
    Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# ── 3. Pull the model ────────────────────────────────────────────────────────
$model = "deepseek-r1:8b"
Write-Host "Pulling model: $model  (this may take a while on first run) ..." -ForegroundColor Gray
& ollama pull $model
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!!] Failed to pull model. Check your internet connection." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Model ready." -ForegroundColor Green

Write-Host ""

# ── 4. Python virtual environment & dependencies ─────────────────────────────
Write-Host "Setting up Python environment ..." -ForegroundColor Gray

$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "[!!] Python is required but not found." -ForegroundColor Red
    Write-Host "     Please install Python 3.10+ from https://www.python.org/downloads/"
    Write-Host "     IMPORTANT: Check 'Add python.exe to PATH' during installation."
    exit 1
}

python -m venv venv
& .\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip -q
pip install -r requirements.txt -q

Write-Host "[OK] Python environment ready (virtualenv in .\venv)." -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  To start chatting, run:" -ForegroundColor White
Write-Host ""
Write-Host "    .\venv\Scripts\Activate.ps1" -ForegroundColor Yellow
Write-Host "    python chat.py" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
