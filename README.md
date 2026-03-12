# Meteorite Hunter ☄️

An addictive space game where you catch falling meteorites! Move your collector to grab meteorites as they rain down from the cosmos. Built with React + Vite — no external game libraries needed.

## How to Play

- **Move** your collector with your mouse or finger (touch supported)
- **Catch** meteorites ☄️ to score points
- **Grab** gold meteorites 🌟 for bonus points
- **Avoid** explosions 💥 — they cost a life!
- **Collect** shields 🛡️ to absorb one hit
- Build **combos** by catching meteorites in a row for score multipliers
- Difficulty **increases** every 15 catches — how far can you go?

## Features

- 🎮 Smooth 60fps game loop with progressive difficulty
- ✨ Animated starfield background and particle effects
- 🔊 Synthesized sound effects via Web Audio API (no files needed)
- 📱 Responsive design — works on desktop and mobile
- 🏆 High score persistence via `localStorage`
- 🛡️ Power-up system (shields)
- 🔥 Combo multiplier system

## Running Locally

```bash
npm install
npm run dev
```

Opens on `localhost:3000`.

## Building for GitHub Pages

```bash
npm run build
```

Generates a `dist` directory ready for deployment.

## Architecture

* **Frontend:** React 18 + Vite
* **Rendering:** Canvas (starfield & particles) + DOM (game objects)
* **Audio:** Web Audio API (synthesized effects)
* **Storage:** Browser `localStorage` (high scores)
