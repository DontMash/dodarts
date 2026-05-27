# packages/database (@dodarts/database)

Drizzle libSQL schema, migrations, CRUD repos.

## Commands

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `deno task check`    | Check drizzle status                |
| `deno task generate` | Generate drizzle migrations         |
| `deno task push`     | Push drizzle schema to DB           |
| `deno task update`   | Generate + push in one step         |
| `deno task studio`   | Open drizzle Studio                 |

## Architecture notes

- libSQL via Drizzle ORM.
- Soft deletes: `tosses` table has `deleted_at`; all queries filter with
  `isDeleted = sql\`${table.deleted_at} is null\``.
