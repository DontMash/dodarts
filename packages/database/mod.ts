import { drizzle } from "drizzle-orm/libsql";

export const create = (url: string) => {
  return drizzle({
    connection: {
      url,
    },
  });
};

export type Database = ReturnType<typeof create>;
