import { create } from "@/mod.ts";
import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";

describe("create", () => {
  it("returns a Drizzle database instance", () => {
    const db = create("file:test.db");

    assertEquals(typeof db, "object");
    assertEquals(typeof db.insert, "function");
    assertEquals(typeof db.select, "function");

    Deno.remove("test.db");
  });

  it("accepts different database URLs", () => {
    const db1 = create("file:test1.db");
    const db2 = create("file:test2.db");

    assertEquals(typeof db1, "object");
    assertEquals(typeof db2, "object");

    Deno.remove("test1.db");
    Deno.remove("test2.db");
  });
});
