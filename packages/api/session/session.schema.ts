import z from "zod";

export const sessionSchema = z.object({
  id: z.string().uuid(),
  ended_at: z.number().int().nullable(),
  meta: z.object({
    updated_at: z.number().int(),
    created_at: z.number().int(),
  }),
});
export type Session = z.infer<typeof sessionSchema>;

export const sessionCreateSchema = z.void();

export const sessionReadSchema = z.object({
  id: z.string().uuid(),
});

export const SESSION_LIST_LIMIT_DEFAULT = 100 as const;
export const SESSION_LIST_OFFSET_DEFAULT = 0 as const;
export const sessionListSchema = z.object({
  limit: z.number().int().min(1).default(SESSION_LIST_LIMIT_DEFAULT),
  offset: z.number().int().min(0).default(SESSION_LIST_OFFSET_DEFAULT),
}).default({
  limit: SESSION_LIST_LIMIT_DEFAULT,
  offset: SESSION_LIST_OFFSET_DEFAULT,
});

export const sessionEndSchema = z.object({
  id: z.string().uuid(),
});

export const sessionCurrentSchema = z.void();
