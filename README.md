# Seaside Static

A tiny retro 80s arcade game with chunky pixels, synthy sunset colours, and a parade of slightly ridiculous seaside enemies.

Think **faded cafe cabinet**, **sticky buttons**, **too-loud attract mode**, and **one more go** energy.

---

## What you play

You pilot a neon beach-runner skimming across a pastel shoreline while blasting:

- dive-bombing **seagulls**,
- roller-rink **crabs**, and
- deeply suspicious **haunted ice creams**.

The whole thing runs in a deliberately low-resolution pixel-art style and scales up to fill the window like an old arcade screen.

---

## Controls

| Action | Keys |
|---|---|
| Move | `Arrow keys` or `WASD` |
| Fire | `Space` or `Enter` |
| Start / Restart | `Space` |
| Quit | Close the window |

---

## Quick start

### Windows

Run one of these:

```powershell
.\setup.ps1
```

or:

```cmd
setup.bat
```

Then launch the game:

```powershell
.\venv\Scripts\Activate.ps1
python chat.py
```

### macOS / Linux

```bash
chmod +x setup.sh
./setup.sh
source venv/bin/activate
python chat.py
```

---

## Notes

- Built with **Pygame**.
- The internal game resolution is **320 × 180** for chunky upscaled pixels.
- A round lasts **75 seconds** unless you run out of lives first.
- The score chain increases while you keep deleting enemies without getting bonked.

---

## Files

| File | Purpose |
|---|---|
| `chat.py` | Main game loop and rendering |
| `requirements.txt` | Python dependency list |
| `setup.ps1` / `setup.bat` / `setup.sh` | Small setup helpers |

---

## License

See [LICENSE](LICENSE).
