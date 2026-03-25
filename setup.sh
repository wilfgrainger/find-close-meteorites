#!/usr/bin/env bash
# setup.sh — Set up Seaside Static.

set -euo pipefail

echo "============================================"
echo "  Seaside Static — Setup"
echo "============================================"
echo

echo "🐍  Setting up Python environment …"

if ! command -v python3 &>/dev/null; then
    echo "❌  Python 3.10+ is required but not found."
    echo "    https://www.python.org/downloads/"
    exit 1
fi

python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo "✅  Environment ready (virtualenv in ./venv)."
echo
echo "Run the game with:"
echo "  source venv/bin/activate"
echo "  python chat.py"
