"""
chat.py — Interactive chat with DeepSeek R1 (Qwen3 8B) running locally via Ollama.

Usage:
    python chat.py                  # interactive chat (default)
    python chat.py --oneshot "Hi"   # single question, then exit

Requires:
    - Ollama running locally (start with `ollama serve`)
    - The model pulled (`ollama pull deepseek-r1:8b`)
"""

import argparse
import json
import sys

import requests

OLLAMA_URL = "http://localhost:11434"
MODEL = "deepseek-r1:8b"


def check_ollama():
    """Make sure Ollama is reachable."""
    try:
        resp = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        resp.raise_for_status()
    except requests.ConnectionError:
        print(
            "❌  Cannot connect to Ollama. Make sure it is running:\n"
            "      ollama serve\n"
        )
        sys.exit(1)


def chat_stream(messages):
    """Send messages to the model and stream the response token-by-token."""
    resp = requests.post(
        f"{OLLAMA_URL}/api/chat",
        json={"model": MODEL, "messages": messages, "stream": True},
        stream=True,
        timeout=300,
    )
    resp.raise_for_status()

    full_reply = []
    for line in resp.iter_lines():
        if not line:
            continue
        chunk = json.loads(line)
        token = chunk.get("message", {}).get("content", "")
        if token:
            print(token, end="", flush=True)
            full_reply.append(token)

    print()  # newline after stream ends
    return "".join(full_reply)


def interactive():
    """Run an interactive multi-turn chat session."""
    print("=" * 50)
    print(f"  💬  Chat with {MODEL}")
    print("  Type 'quit' or 'exit' to end the session.")
    print("=" * 50)
    print()

    messages = []

    while True:
        try:
            user_input = input("You: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye!")
            break

        if not user_input:
            continue
        if user_input.lower() in ("quit", "exit"):
            print("Goodbye!")
            break

        messages.append({"role": "user", "content": user_input})
        print(f"\n{MODEL}: ", end="")
        reply = chat_stream(messages)
        messages.append({"role": "assistant", "content": reply})
        print()


def oneshot(prompt):
    """Send a single prompt and print the response."""
    messages = [{"role": "user", "content": prompt}]
    print(f"{MODEL}: ", end="")
    chat_stream(messages)


def main():
    parser = argparse.ArgumentParser(
        description="Chat with DeepSeek R1 (Qwen3 8B) locally via Ollama."
    )
    parser.add_argument(
        "--oneshot",
        type=str,
        default=None,
        help="Send a single prompt and exit (non-interactive mode).",
    )
    args = parser.parse_args()

    check_ollama()

    if args.oneshot:
        oneshot(args.oneshot)
    else:
        interactive()


if __name__ == "__main__":
    main()
