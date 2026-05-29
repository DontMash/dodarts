import { describe, it } from "@std/testing/bdd";
import { assertSpyCalls, spy } from "@std/testing/mock";
import { assertEquals, assertRejects } from "@std/assert";

import type { Database } from "../mod.ts";
import { create, end, findActive, list, read } from "./session.repository.ts";

interface MockSession {
  id: string;
  ended_at: Date | null;
  updated_at: Date;
  created_at: Date;
  deleted_at?: number | null;
}

function createMockDb(rows: MockSession[]): Database {
  const storedRows: MockSession[] = [...rows];

  const insertSpy = spy((_table: unknown) => ({
    values: (values: Omit<MockSession, "id"> & { id?: string }) => {
      const inserted: MockSession = {
        id: values.id ?? crypto.randomUUID(),
        ...values,
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

describe("create", () => {
  it("inserts a session and returns it", async () => {
    const db = createMockDb([]);
    const result = await create(db, {});
    assertEquals(typeof result.id, "string");
  });

  it("calls db.insert once", async () => {
    const db = createMockDb([]);
    await create(db, {});
    assertSpyCalls(db.insert as ReturnType<typeof spy>, 1);
  });
});

describe("read", () => {
  it("returns session by id", async () => {
    const db = createMockDb(mockSessions);
    const result = await read(db, { id: sessionId1 });
    assertEquals(result.id, sessionId1);
  });

  it("throws when session not found", async () => {
    const db = createMockDb([]);
    await assertRejects(
      async () =>
        await read(db, { id: "99999999-0000-0000-0000-000000000000" }),
      Error,
      "Session not found",
    );
  });

  it("calls db.select once", async () => {
    const db = createMockDb(mockSessions);
    await read(db, { id: sessionId1 });
    assertSpyCalls(db.select as ReturnType<typeof spy>, 1);
  });
});

describe("list", () => {
  it("returns paginated sessions", async () => {
    const db = createMockDb(mockSessions);
    const result = await list(db, { limit: 10, offset: 0 });
    assertEquals(result.length, 2);
  });

  it("returns empty array when no sessions", async () => {
    const db = createMockDb([]);
    const result = await list(db, { limit: 10, offset: 0 });
    assertEquals(result.length, 0);
  });

  it("calls db.select once", async () => {
    const db = createMockDb(mockSessions);
    await list(db, { limit: 10, offset: 0 });
    assertSpyCalls(db.select as ReturnType<typeof spy>, 1);
  });
});

describe("end", () => {
  it("ends an active session", async () => {
    const db = createMockDb(mockSessions);
    const result = await end(db, { id: sessionId1 });
    assertEquals(result.id, sessionId1);
  });

  it("throws when session not found or already ended", async () => {
    const db = createMockDb([]);
    await assertRejects(
      async () => await end(db, { id: "99999999-0000-0000-0000-000000000000" }),
      Error,
      "Session not found or already ended",
    );
  });
});

describe("findActive", () => {
  it("returns the active session when one exists", async () => {
    const db = createMockDb(mockSessions);
    const result = await findActive(db);
    assertEquals(result?.id, sessionId1);
    assertEquals(result?.ended_at, null);
  });

  it("returns null when no active session exists", async () => {
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
    const result = await findActive(db);
    assertEquals(result, null);
  });

  it("returns null when no sessions exist", async () => {
    const db = createMockDb([]);
    const result = await findActive(db);
    assertEquals(result, null);
  });
});
