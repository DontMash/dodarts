import { and, desc, eq, isNull, sql } from "drizzle-orm";
import z from "zod";

import type { Database } from "../mod.ts";
import { sessionInsertSchema, sessionSelectSchema } from "./session.table.ts";
import { sessionTable } from "./session.table.ts";

type SessionInsert = z.infer<typeof sessionInsertSchema>;
const sessionSelectSingleSchema = sessionSelectSchema.pick({ id: true });
type SessionSelectSingle = z.infer<typeof sessionSelectSingleSchema>;
const sessionSelectMultipleSchema = z.object({
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
});
type SessionSelectMultiple = z.infer<typeof sessionSelectMultipleSchema>;

const isDeleted = sql`${sessionTable.deleted_at} is null`;

export const create = async (
  db: Database,
  input: Omit<SessionInsert, "id"> = {},
) => {
  const values = sessionInsertSchema.parse(input);
  const sessions = await db.insert(sessionTable).values(values).returning();
  return sessions[0];
};
export const read = async (db: Database, input: SessionSelectSingle) => {
  const { id } = sessionSelectSingleSchema.parse(input);
  const sessions = await db.select().from(sessionTable).where(
    and(
      eq(sessionTable.id, id),
      isDeleted,
    ),
  );
  if (sessions.length < 1) {
    throw new Error("Session not found");
  }
  return sessions[0];
};
export const list = async (db: Database, input: SessionSelectMultiple) => {
  const { limit, offset } = sessionSelectMultipleSchema.parse(input);
  const sessions = await db.select().from(sessionTable).where(
    isDeleted,
  ).orderBy(desc(sessionTable.created_at)).limit(limit).offset(offset);
  return sessions;
};
export const end = async (db: Database, input: SessionSelectSingle) => {
  const { id } = sessionSelectSingleSchema.parse(input);
  const now = new Date();
  const sessions = await db.update(sessionTable).set({
    ended_at: now,
  }).where(
    and(
      eq(sessionTable.id, id),
      isNull(sessionTable.ended_at),
      isDeleted,
    ),
  ).returning();
  if (sessions.length < 1) {
    throw new Error("Session not found or already ended");
  }
  return sessions[0];
};
export const findActive = async (db: Database) => {
  const sessions = await db.select().from(sessionTable).where(
    and(
      isNull(sessionTable.ended_at),
      isDeleted,
    ),
  ).limit(1);
  if (sessions.length < 1) {
    return null;
  }
  return sessions[0];
};
