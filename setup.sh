#!/usr/bin/env bash
# setup.sh — Install everything needed to run DeepSeek R1 (8B) locally.
#
# Usage:
#   chmod +x setup.sh
#   ./setup.sh
#
# What this script does:
#   1. Installs Ollama (the easiest way to run LLMs on your own machine).
#   2. Pulls the DeepSeek R1 8B model (~5 GB download).
#   3. Creates a Python virtual environment and installs dependencies.

set -euo pipefail

echo "============================================"
echo "  DeepSeek R1 (8B) — Local Setup"
echo "============================================"
echo

# ── 1. Install Ollama ──────────────────────────────────────────────────────────
if command -v ollama &>/dev/null; then
    echo "✅  Ollama is already installed: $(ollama --version)"
else
    echo "📦  Installing Ollama …"
    curl -fsSL https://ollama.com/install.sh | sh
    echo "✅  Ollama installed."
fi

echo

# ── 2. Start Ollama (if not already running) ──────────────────────────────────
if ! curl -sf http://localhost:11434/api/tags &>/dev/null; then
    echo "🚀  Starting Ollama server in the background …"
    ollama serve &>/dev/null &
    sleep 3
fi

# ── 3. Pull the model ─────────────────────────────────────────────────────────
MODEL="deepseek-r1:8b"
echo "📥  Pulling model: $MODEL  (this may take a while on first run) …"
ollama pull "$MODEL"
echo "✅  Model ready."

echo

# ── 4. Python virtual environment & dependencies ─────────────────────────────
echo "🐍  Setting up Python environment …"

if ! command -v python3 &>/dev/null; then
    echo "❌  Python 3 is required but not found. Please install Python 3.10+ first."
    echo "    https://www.python.org/downloads/"
    exit 1
fi

python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo "✅  Python environment ready (virtualenv in ./venv)."

echo
echo "============================================"
echo "  🎉  Setup complete!"
echo ""
echo "  To start chatting, run:"
echo ""
echo "    source venv/bin/activate"
echo "    python chat.py"
echo ""
echo "============================================"
