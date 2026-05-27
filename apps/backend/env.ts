// deno-coverage-ignore-file
import { loadSync } from "@std/dotenv";
import { join } from "@std/path";
import z from "zod";

loadSync({ envPath: join(import.meta.dirname!, ".env"), export: true });

const environmentSchema = z.object({
  DATABASE_URL: z.url(),
});

export const env = environmentSchema.parse(Deno.env.toObject());
