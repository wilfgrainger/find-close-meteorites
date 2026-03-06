# Toca Life World Clone

A bare-bones React prototype for a 2D drag-and-drop sandbox game like Toca Life World.
Everything runs locally in the browser and state is saved using `localStorage`.

## Running the Prototype locally

```bash
npm install
npm run dev
```

The prototype should load on `localhost:3000`.

## Building for GitHub Pages

```bash
npm run build
```

This will generate a `dist` directory that you can deploy to GitHub Pages.

## Architecture

* **Frontend:** React + Vite
* **Storage:** Browser `localStorage`
