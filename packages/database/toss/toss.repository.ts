import { and, desc, eq, sql } from "drizzle-orm";
import z from "zod";

import type { Database } from "../mod.ts";
import { tossInsertSchema, tossSelectSchema, tossTable } from "./toss.table.ts";

type TossInsert = z.infer<typeof tossInsertSchema>;
const tossSelectSingleSchema = tossSelectSchema.pick({ id: true });
type TossSelectSingle = z.infer<typeof tossSelectSingleSchema>;
const tossSelectMultipleSchema = z.object({
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
});
type TossSelectMultiple = z.infer<typeof tossSelectMultipleSchema>;

const isDeleted = sql`${tossTable.deleted_at} is null`;

export const create = async (db: Database, input: TossInsert) => {
  const values = tossInsertSchema.parse(input);
  const tosses = await db.insert(tossTable).values(values).returning();
  return tosses[0];
};
export const read = async (db: Database, input: TossSelectSingle) => {
  const { id } = tossSelectSingleSchema.parse(input);
  const tosses = await db.select().from(tossTable).where(
    and(
      eq(tossTable.id, id),
      isDeleted,
    ),
  );
  if (tosses.length < 1) {
    throw new Error("Toss not found");
  }
  return tosses[0];
};
export const list = async (db: Database, input: TossSelectMultiple) => {
  const { limit, offset } = tossSelectMultipleSchema.parse(input);
  const tosses = await db.select().from(tossTable).where(
    isDeleted,
  ).orderBy(desc(tossTable.created_at)).limit(limit).offset(offset);
  return tosses;
};
