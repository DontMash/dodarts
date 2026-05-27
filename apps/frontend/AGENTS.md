# apps/frontend

TanStack Start (SPA mode) + React + Tailwind, realtime throws display.

## Commands

| Command             | Description              |
| ------------------- | ------------------------ |
| `deno task dev`     | Start dev server (Vite)  |
| `deno task build`   | Build for production     |
| `deno task preview` | Preview production build |

## Environment

- `VITE_WS_URL` — WebSocket URL for ORPC client (e.g.
  `ws://localhost:8000/api`). See `.env.example`.

## Architecture notes

- TanStack Start in SPA mode (no SSR).
- Client-side routing with TanStack Router, styled with Tailwind CSS.
- Dartboard visualization plots toss coordinates.
- List shows recent throws with live updates.
- Uses a single WebSocket client for both history (`toss.list`) and real-time
  updates (`toss.subscribe`).
