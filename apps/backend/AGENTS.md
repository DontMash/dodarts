# apps/backend

Hono + ORPC server with autodarts input consumer.

## Commands

| Command                 | Description                    |
| ----------------------- | ------------------------------ |
| `deno task dev`         | Start dev server with watch    |
| `deno task start`       | Run production server          |
| `deno task db:check`    | Check drizzle migration status |
| `deno task db:generate` | Generate drizzle migrations    |
| `deno task db:push`     | Push drizzle schema to DB      |
| `deno task db:update`   | Generate + push in one step    |
| `deno task db:studio`   | Open drizzle Studio            |

## Environment

- The backend hardcodes `ws://autodarts.local:3180/api/events` for the Autodarts
  camera feed (not configurable via env) - to be changed.
- `DATABASE_URL` is required and points to the sqlite database file (e.g.,
  `file:local.db`).
- `MIGRATIONS_PATH` is required and points to the migrations folder (e.g.,
  `./migrations`).
- Migrations run automatically on server startup before accepting requests.
