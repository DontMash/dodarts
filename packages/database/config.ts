// This file is not part of the distributed code.
// It is used to update the database (drizzle-kit).

import { defineConfig } from "drizzle-kit";

const DATABASE_URL = Deno.env.get("DATABASE_URL");
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  dialect: "sqlite",
  schema: "./tables.ts",
  out: "./migrations",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
