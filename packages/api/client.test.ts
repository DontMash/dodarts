import { describe, it } from "@std/testing/bdd";
import { assertEquals, assertThrows } from "@std/assert";

import { createClient, createRouterClient } from "@/client.ts";
import type { Database } from "@dodarts/database";

function createMockDb(): Database {
  return {} as unknown as Database;
}

// WebSocket and RPCLink create timers internally; disable leak detection for those tests.
Deno.test({
  name: "createClient - returns a fetch client when only fetchUrl is provided",
  sanitizeResources: false,
  sanitizeOps: false,
  fn() {
    const client = createClient({
      fetchUrl: "http://localhost:3000/rpc",
    }) as Partial<Record<"fetch" | "websocket", unknown>>;

    assertEquals(client.fetch !== undefined, true);
    assertEquals(client.websocket, undefined);
  },
});

Deno.test({
  name:
    "createClient - returns a websocket client when only websocketUrl is provided",
  sanitizeResources: false,
  sanitizeOps: false,
  fn() {
    const client = createClient({
      websocketUrl: "ws://localhost:3000/rpc",
    }) as Partial<Record<"fetch" | "websocket", unknown>>;

    assertEquals(client.websocket !== undefined, true);
    assertEquals(client.fetch, undefined);
  },
});

Deno.test({
  name: "createClient - returns both clients when both URLs are provided",
  sanitizeResources: false,
  sanitizeOps: false,
  fn() {
    const client = createClient({
      fetchUrl: "http://localhost:3000/rpc",
      websocketUrl: "ws://localhost:3000/rpc",
    }) as Partial<Record<"fetch" | "websocket", unknown>>;

    assertEquals(client.fetch !== undefined, true);
    assertEquals(client.websocket !== undefined, true);
  },
});

describe("createClient", () => {
  it("throws when neither URL is provided", () => {
    assertThrows(
      () => createClient({}),
      Error,
      "At least one of fetchUrl or websocketUrl must be provided",
    );
  });
});

describe("createRouterClient", () => {
  it("returns an object with toss procedures", () => {
    const db = createMockDb();
    const client = createRouterClient(db);

    assertEquals(typeof client.toss, "object");
    assertEquals(typeof client.toss.create, "function");
    assertEquals(typeof client.toss.read, "function");
    assertEquals(typeof client.toss.list, "function");
    assertEquals(typeof client.toss.subscribe, "function");
  });
});
