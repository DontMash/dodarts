// This file is not part of the distributed code.
// It is used to update the database (drizzle-kit).

import { defineConfig } from "drizzle-kit";

const DATABASE_URL = Deno.env.get("DATABASE_URL");
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const MIGRATIONS_PATH = Deno.env.get("MIGRATIONS_PATH");
if (!MIGRATIONS_PATH) {
  throw new Error("MIGRATIONS_PATH is not set");
}

const schemaPath = new URL("./tables.ts", import.meta.url).pathname;

export default defineConfig({
  dialect: "sqlite",
  schema: schemaPath,
  out: MIGRATIONS_PATH,
  dbCredentials: {
    url: DATABASE_URL,
  },
});
