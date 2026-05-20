import { loadSync } from "@std/dotenv";
import z from "zod";

loadSync({ envPath: "../../.env", export: true });

const environmentSchema = z.object({
  DATABASE_URL: z.url(),
});

export const env = environmentSchema.parse(Deno.env.toObject());
