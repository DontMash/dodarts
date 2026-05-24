# dodarts (hidden-eagle)

Deno monorepo — dart-score tracking app that ingests throws and exposes them via
ORPC.

## Workspace structure

```
deno.json          ← workspace root ("apps/*", "packages/*")
apps/backend/      ← Hono + ORPC server, input consumer
packages/api/      ← @dodarts/api — ORPC router, HTTP/WebSocket handlers, typed client factory
packages/database/ ← @dodarts/database — Drizzle libSQL schema, migrations, CRUD repos
packages/shared/   ← @dodarts/shared — .env loading + Zod validation (leaf package)
```

Dependency graph: `shared` ← `database` ← `api` ← `apps/*`

## Commands

All tasks run from the workspace root or within a package.

| Command                                       | Description                         |
| --------------------------------------------- | ----------------------------------- |
| `deno task dev` (in `apps/backend`)           | Start backend dev server with watch |
| `deno task start` (in `apps/backend`)         | Run backend production              |
| `deno task check` (in `packages/database`)    | Check drizzle status                |
| `deno task generate` (in `packages/database`) | Generate drizzle migrations         |
| `deno task push` (in `packages/database`)     | Push drizzle schema to DB           |
| `deno task update` (in `packages/database`)   | Generate + push in one step         |
| `deno task studio` (in `packages/database`)   | Open drizzle Studio                 |
| `deno task test`                              | Run tests                           |
| `deno task test:coverage`                     | Run tests with coverage report      |
| `deno task coverage`                          | Show coverage report                |

## Environment

- **Required**: `DATABASE_URL` — validated by `@dodarts/shared`. See
  `.env.example` for a starting point.
- All `.env` files are gitignored except `.env.example`; local overrides like
  `.env.local` are also excluded to prevent leaks.
- The backend hardcodes `ws://autodarts.local:3180/api/events` for the Autodarts
  camera feed (not configurable via env).

## Architecture notes

- **API layer**: ORPC (`@orpc/server`) over Hono, with HTTP fetch and WebSocket
  upgrade handlers exported from `packages/api/mod.ts`.
- **Real-time**: The `subscribe` procedure uses pub/sub between the HTTP handler
  (dispatcher) and WS subscriber iterators.
- **Soft deletes**: `tosses` table has `deleted_at`; all queries filter with
  `isDeleted = sql\`${table.deleted_at} is null\``.
- **Database**: libSQL via Drizzle ORM..
- **Tests**: Written in AAA-Pattern (Arrange, Act, Assert).

## Verification

After any edit, run in order:

1. `deno fmt` // Formatting
2. `deno check` // Type-checking
3. `deno lint` // Linting
4. `deno task test:coverage` // Testing (coverage should be above 90%)
5. Project-related verification (e.g.,
   `deno task --cwd=packages/database check`) — if it returns false, run
   `deno task --cwd=packages/database update` to regenerate migrations and push
   the schema.
