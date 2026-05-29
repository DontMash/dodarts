import { describe, it } from "@std/testing/bdd";
import { assertSpyCalls, spy } from "@std/testing/mock";
import { assertEquals, assertRejects } from "@std/assert";

import { createRouterClient } from "@orpc/server";
import type { Database } from "@dodarts/database";

import type { Emitter, EventMap } from "../emitter.ts";
import router from "../router.ts";
import type { Session } from "./session.schema.ts";

class MockEmitter implements Emitter {
  #listeners = new Map<string, ((payload: unknown) => void)[]>();

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const key = event as string;
    const handlers = this.#listeners.get(key) ?? [];
    this.#listeners.set(key, []);
    for (const handler of handlers) handler(payload);
  }

  once<K extends keyof EventMap>(
    event: K,
    listener: (payload: EventMap[K]) => void,
  ): void {
    const key = event as string;
    const existing = this.#listeners.get(key) ?? [];
    existing.push(listener as (payload: unknown) => void);
    this.#listeners.set(key, existing);
  }
}

interface MockSession {
  id: string;
  ended_at: Date | null;
  updated_at: Date;
  created_at: Date;
  deleted_at?: number | null;
}

function createMockDb(rows: MockSession[] = []): Database {
  const storedRows: MockSession[] = [...rows];

  const insertSpy = spy((_table: unknown) => ({
    values: (values: Partial<MockSession> & { id?: string }) => {
      const inserted: MockSession = {
        id: values.id ?? crypto.randomUUID(),
        ended_at: values.ended_at ?? null,
        updated_at: values.updated_at ?? now,
        created_at: values.created_at ?? now,
        deleted_at: values.deleted_at ?? null,
      };
      storedRows.push(inserted);
      return {
        returning: () => ({
          then: (cb: (rows: MockSession[]) => unknown) => cb([inserted]),
        }),
      };
    },
  }));

  const updateSpy = spy(() => ({
    set: (_values: unknown) => ({
      where: () => ({
        returning: () => ({
          then: (cb: (rows: MockSession[]) => unknown) => {
            const active = storedRows.filter(
              (r) => r.deleted_at == null && r.ended_at == null,
            );
            cb(active.length > 0 ? [active[0]] : []);
          },
        }),
      }),
    }),
  }));

  const selectSpy = spy(() => ({
    from: () => ({
      where: () => ({
        then: (cb: (rows: MockSession[]) => unknown) =>
          cb(storedRows.filter((r) => r.deleted_at == null)),
        orderBy: () => ({
          then: (cb: (rows: MockSession[]) => unknown) =>
            cb(storedRows.filter((r) => r.deleted_at == null)),
          limit: (n: number) => ({
            offset: (o: number) => ({
              then: (cb: (rows: MockSession[]) => unknown) =>
                cb(
                  storedRows
                    .filter((r) => r.deleted_at == null)
                    .slice(o, o + n),
                ),
            }),
          }),
        }),
        limit: (n: number) => ({
          then: (cb: (rows: MockSession[]) => unknown) =>
            cb(
              storedRows
                .filter((r) => r.deleted_at == null && r.ended_at == null)
                .slice(0, n),
            ),
        }),
      }),
    }),
  }));

  return {
    insert: insertSpy,
    update: updateSpy,
    select: selectSpy,
  } as unknown as Database;
}

const now = new Date(1000000);
const earlier = new Date(999000);

const sessionId1 = "550e8400-e29b-41d4-a716-446655440000";
const sessionId2 = "660e8400-e29b-41d4-a716-446655440001";

const mockSessions: MockSession[] = [
  {
    id: sessionId1,
    ended_at: null,
    updated_at: now,
    created_at: earlier,
  },
  {
    id: sessionId2,
    ended_at: new Date(1000001),
    updated_at: now,
    created_at: earlier,
  },
];

describe("session.create", () => {
  it("creates a session and returns it in API shape", async () => {
    const db = createMockDb([]);
    const emitter = new MockEmitter();
    const client = createRouterClient(router, { context: { db, emitter } });

    const result = await client.session.create();

    assertEquals(typeof result.id, "string");
    assertEquals(result.ended_at, null);
    assertEquals(typeof result.meta.created_at, "number");
    assertEquals(typeof result.meta.updated_at, "number");
  });

  it("calls db.insert once", async () => {
    const db = createMockDb([]);
    const emitter = new MockEmitter();
    const client = createRouterClient(router, { context: { db, emitter } });

    await client.session.create();

    assertSpyCalls(db.insert as ReturnType<typeof spy>, 1);
  });

  it("throws SERVER_ISSUE when db throws", async () => {
    const db = {
      insert: spy(() => {
        throw new Error("DB connection failed");
      }),
      select: spy(() => ({})),
      update: spy(() => ({})),
    } as unknown as Database;
    const emitter = new MockEmitter();
    const client = createRouterClient(router, { context: { db, emitter } });

    await assertRejects(() => client.session.create());
  });

  it("auto-ends active session before creating a new one", async () => {
    const db = createMockDb([{
      id: sessionId1,
      ended_at: null,
      updated_at: now,
      created_at: earlier,
    }]);
    const emitter = new MockEmitter();
    const client = createRouterClient(router, { context: { db, emitter } });

    const result = await client.session.create();

    assertEquals(typeof result.id, "string");
    assertSpyCalls(db.update as ReturnType<typeof spy>, 1);
  });
});

describe("session.read", () => {
  it("returns a session by id", async () => {
    const db = createMockDb(mockSessions);
    const emitter = new MockEmitter();
    const client = createRouterClient(router, { context: { db, emitter } });

    const result = await client.session.read({ id: sessionId1 });

    assertEquals(result.id, sessionId1);
  });

  it("throws SERVER_ISSUE when session not found", async () => {
    const db = createMockDb([]);
    const emitter = new MockEmitter();
    const client = createRouterClient(router, { context: { db, emitter } });

    await assertRejects(() =>
      client.session.read({ id: "99999999-0000-0000-0000-000000000000" })
    );
  });
});

describe("session.list", () => {
  it("returns paginated sessions in API shape", async () => {
    const db = createMockDb(mockSessions);
    const emitter = new MockEmitter();
    const client = createRouterClient(router, { context: { db, emitter } });

    const result = await client.session.list({ limit: 10, offset: 0 });

    assertEquals(result.length, 2);
    assertEquals(typeof result[0].meta.created_at, "number");
    assertEquals(typeof result[0].meta.updated_at, "number");
  });

  it("returns empty array when no sessions", async () => {
    const db = createMockDb([]);
    const emitter = new MockEmitter();
    const client = createRouterClient(router, { context: { db, emitter } });

    const result = await client.session.list({ limit: 10, offset: 0 });

    assertEquals(result.length, 0);
  });
});

describe("session.end", () => {
  it("ends an active session", async () => {
    const db = createMockDb(mockSessions);
    const emitter = new MockEmitter();
    const client = createRouterClient(router, { context: { db, emitter } });

    const result = await client.session.end({ id: sessionId1 });

    assertEquals(result.id, sessionId1);
  });

  it("throws SERVER_ISSUE when session not found", async () => {
    const db = createMockDb([]);
    const emitter = new MockEmitter();
    const client = createRouterClient(router, { context: { db, emitter } });

    await assertRejects(() =>
      client.session.end({ id: "99999999-0000-0000-0000-000000000000" })
    );
  });
});

describe("session.current", () => {
  it("returns the active session when one exists", async () => {
    const db = createMockDb(mockSessions);
    const emitter = new MockEmitter();
    const client = createRouterClient(router, { context: { db, emitter } });

    const result = await client.session.active();

    assertEquals(result?.id, sessionId1);
    assertEquals(result?.ended_at, null);
  });

  it("returns null when no active session", async () => {
    const endedSessions: MockSession[] = [
      {
        id: sessionId1,
        ended_at: new Date(1000000),
        updated_at: now,
        created_at: earlier,
        deleted_at: null,
      },
    ];
    const db = createMockDb(endedSessions);
    const emitter = new MockEmitter();
    const client = createRouterClient(router, { context: { db, emitter } });

    const result = await client.session.active();

    assertEquals(result, null);
  });
});

describe("session.subscribe", () => {
  it("yields a session when created", async () => {
    const db = createMockDb([]);
    const emitter = new MockEmitter();
    const client = createRouterClient(router, { context: { db, emitter } });

    const iterator = await client.session.subscribe();
    const createPromise = client.session.create();
    const [yielded] = await Promise.all([
      iterator.next(),
      createPromise,
    ]);

    const value = yielded.value as Session;
    assertEquals(yielded.done, false);
    assertEquals(typeof value.id, "string");
  });

  it("yields a session when ended", async () => {
    const db = createMockDb(mockSessions);
    const emitter = new MockEmitter();
    const client = createRouterClient(router, { context: { db, emitter } });

    const iterator = await client.session.subscribe();
    const endPromise = client.session.end({ id: sessionId1 });
    const [yielded] = await Promise.all([
      iterator.next(),
      endPromise,
    ]);

    const value = yielded.value as Session;
    assertEquals(yielded.done, false);
    assertEquals(typeof value.id, "string");
  });
});
