# Toca Life World Clone

A bare-bones React and Cloudflare prototype for a 2D drag-and-drop sandbox game like Toca Life World.

## Running the Prototype locally

```bash
npm install
npm run dev
```

The prototype should load on `localhost:3000`.

## Architecture

* **Frontend:** React + Vite
* **Backend API:** Cloudflare Workers
* **Database:** Cloudflare D1 (relational storage)
* **Cache:** Cloudflare KV (fast retrieval)
