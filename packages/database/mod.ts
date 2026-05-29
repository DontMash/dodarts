import { drizzle } from "drizzle-orm/libsql";
import { migrate as drizzleMigrate } from "drizzle-orm/libsql/migrator";

export const create = (url: string) => {
  return drizzle({
    connection: {
      url,
    },
  });
};

export type Database = ReturnType<typeof create>;

export const migrate = (db: Database, migrationsPath: string) => {
  return drizzleMigrate(db, { migrationsFolder: migrationsPath });
};
