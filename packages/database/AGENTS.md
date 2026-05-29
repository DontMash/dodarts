# packages/database (@dodarts/database)

Drizzle libSQL schema, CRUD repos.

## Architecture notes

- libSQL via Drizzle ORM.
- Soft deletes: `tosses` table has `deleted_at`; all queries filter with
  `isDeleted = sql\`${table.deleted_at} is null\``.
- Migrations are managed by consuming apps (e.g., `apps/backend`), not this
  package. The `config.ts` file is used by consuming apps when running
  `drizzle-kit` commands.
