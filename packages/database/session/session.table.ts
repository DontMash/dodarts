// deno-coverage-ignore-file
import { relations, sql } from "drizzle-orm";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { tossTable } from "../toss/toss.table.ts";

export const sessionTable = sqliteTable("sessions", (t) => ({
  id: t.text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ended_at: t.integer({ mode: "timestamp_ms" }),
  updated_at: t.integer({ mode: "timestamp_ms" }).$onUpdate(() =>
    sql`(CURRENT_TIMESTAMP)`
  ).notNull(),
  created_at: t.integer({ mode: "timestamp_ms" }).default(
    sql`(CURRENT_TIMESTAMP)`,
  ).notNull(),
  deleted_at: t.integer({ mode: "timestamp_ms" }),
}));

export const sessionRelations = relations(sessionTable, ({ many }) => ({
  tosses: many(tossTable),
}));

export const sessionInsertSchema = createInsertSchema(sessionTable);
export const sessionSelectSchema = createSelectSchema(sessionTable);
