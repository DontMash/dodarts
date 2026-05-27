# dodarts (hidden-eagle)

Deno monorepo — dart-score tracking app that ingests throws and exposes them via
ORPC.

## Workspace structure

```
deno.json          ← workspace root ("apps/*", "packages/*")
apps/backend/      ← Hono + ORPC server, input consumer
apps/frontend/     ← TanStack Start (SPA mode) + React + Tailwind, realtime throws display
packages/api/      ← @dodarts/api — ORPC router, HTTP/WebSocket handlers, typed client factory
packages/database/ ← @dodarts/database — Drizzle libSQL schema, migrations, CRUD repos
```

Dependency graph: `database` ← `api` ← `apps/*`, `api` ← `apps/frontend`

## Workspace docs

- [Backend](./apps/backend/AGENTS.md)
- [Frontend](./apps/frontend/AGENTS.md)
- [API](./packages/api/AGENTS.md)
- [Database](./packages/database/AGENTS.md)

## Tests

- Written in AAA-Pattern (Arrange, Act, Assert).

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

or run `deno task verify` to run all steps in one from root.
