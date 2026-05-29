import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";

import { create } from "./mod.ts";

describe("create", () => {
  it("returns a Drizzle database instance", async () => {
    const db = create("file:test.db");

    assertEquals(typeof db, "object");
    assertEquals(typeof db.insert, "function");
    assertEquals(typeof db.select, "function");

    await Deno.remove("test.db");
  });

  it("accepts different database URLs", async () => {
    const db1 = create("file:test1.db");
    const db2 = create("file:test2.db");

    assertEquals(typeof db1, "object");
    assertEquals(typeof db2, "object");

    await Deno.remove("test1.db");
    await Deno.remove("test2.db");
  });
});
