# packages/shared (@dodarts/shared)

.env loading + Zod validation (leaf package).

## Environment

- **Required**: `DATABASE_URL` — validated by this package. See `.env.example`
  for a starting point.
- All `.env` files are gitignored except `.env.example`; local overrides like
  `.env.local` are also excluded to prevent leaks.
