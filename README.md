# DeepSeek R1 — Local Chat

Run the **DeepSeek R1 8B** large-language model on your own
Windows machine and chat with it from the terminal. No cloud account or API
key needed — everything runs locally.

---

## Prerequisites

| Requirement | Why |
|---|---|
| **Windows 10 or 11** | Ollama supports Windows natively |
| **Python 3.10+** | Runs the chat script ([download](https://www.python.org/downloads/) — tick **"Add python.exe to PATH"** during install) |
| **~8 GB free RAM** | The 8B model needs this to run comfortably |
| **~5 GB free disk space** | For the downloaded model weights |

> **GPU recommended but not required.** Ollama automatically uses your NVIDIA
> GPU if one is available. On CPU-only machines the model still works — just
> slower.

---

## Quick Start (Windows)

### 1 — Run the setup script

Open **PowerShell** in this folder and run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned   # only needed once
.\setup.ps1
```

> **Prefer Command Prompt?** Double-click `setup.bat` instead.

The setup script will:

1. Check for (or install) [Ollama](https://ollama.com) — the tool that runs
   the model locally.
2. Pull the **deepseek-r1:8b** model (~5 GB download, first time only).
3. Create a Python virtual environment and install dependencies.

### 2 — Start chatting

```powershell
.\venv\Scripts\Activate.ps1
python chat.py
```

Type your message and press Enter. The model streams its reply token-by-token.
Type `quit` or `exit` to end the session.

#### One-shot mode

```powershell
python chat.py --oneshot "Explain quantum computing in simple terms"
```

---

## What's in this repo

| File | Purpose |
|---|---|
| `setup.ps1` | One-command setup for Windows (PowerShell) |
| `setup.bat` | One-command setup for Windows (Command Prompt) |
| `setup.sh` | One-command setup for macOS / Linux |
| `chat.py` | Interactive chat script (calls Ollama's local API) |
| `requirements.txt` | Python dependencies |

---

## How it works

```
┌──────────┐       HTTP        ┌──────────────┐
│ chat.py  │  ──────────────▶  │  Ollama API  │
│ (Python) │  localhost:11434  │  (local)     │
└──────────┘       ◀──────────  └──────┬───────┘
                    streamed           │
                    tokens             ▼
                               ┌──────────────┐
                               │ DeepSeek R1  │
                               │ Qwen 8B      │
                               └──────────────┘
```

1. **Ollama** runs the model as a local server on port 11434.
2. **chat.py** sends your messages to `http://localhost:11434/api/chat` and
   streams the response back to your terminal.
3. Everything stays on your machine — no data leaves your computer.

---

## Troubleshooting

### "Cannot connect to Ollama"

Make sure the Ollama server is running. Open a separate terminal and run:

```powershell
ollama serve
```

### Model is slow

- Close other memory-heavy apps.
- If you have an NVIDIA GPU, make sure you have up-to-date drivers — Ollama
  detects and uses it automatically.

### PowerShell says "execution of scripts is disabled"

Run this once to allow local scripts:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Want a different model?

Change the `MODEL` variable at the top of `chat.py`:

```python
MODEL = "deepseek-r1:8b"   # current
MODEL = "deepseek-r1:14b"  # larger, needs ~16 GB RAM
MODEL = "deepseek-r1:1.5b" # smaller, faster, less capable
```

Then pull the new model:

```powershell
ollama pull deepseek-r1:14b
```

---

## License

See [LICENSE](LICENSE) for details.
