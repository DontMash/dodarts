# apps/backend

Hono + ORPC server with autodarts input consumer.

## Commands

| Command           | Description                 |
| ----------------- | --------------------------- |
| `deno task dev`   | Start dev server with watch |
| `deno task start` | Run production server       |

## Environment

- The backend hardcodes `ws://autodarts.local:3180/api/events` for the Autodarts
  camera feed (not configurable via env) - to be changed.
