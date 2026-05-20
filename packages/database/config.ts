// This file is not part of the distributed code.
// It is used to update the database (drizzle-kit).

import { defineConfig } from "drizzle-kit";

import { env } from "@dodarts/shared";

export default defineConfig({
  dialect: "sqlite",
  schema: "./tables.ts",
  out: "./migrations",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
