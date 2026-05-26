// deno-coverage-ignore-start
import { describe, it } from "@std/testing/bdd";
import { assertSpyCalls, spy } from "@std/testing/mock";
import { assertEquals, assertRejects } from "@std/assert";

import { createRouterClient } from "@orpc/server";
import type { Database } from "@dodarts/database";

import router from "@/router.ts";
import type { Toss } from "./toss.schema.ts";

interface MockToss {
  id: number;
  name: string;
  segment: string;
  value: number;
  multiplier: number;
  updated_at: Date;
  created_at: Date;
  coords_x?: number | null;
  coords_y?: number | null;
  deleted_at?: number | null;
}

function createMockDb(rows: MockToss[]): Database {
  const storedRows: MockToss[] = [...rows];

  const insertSpy = spy((_table: unknown) => ({
    values: (values: Omit<MockToss, "id" | "updated_at" | "created_at">) => {
      const inserted: MockToss = {
        id: storedRows.length + 1,
        updated_at: now,
        created_at: now,
        ...values,
      };
      storedRows.push(inserted);
      return {
        returning: () => ({
          then: (cb: (rows: MockToss[]) => unknown) => cb([inserted]),
        }),
      };
    },
  }));

  const selectSpy = spy(() => ({
    from: () => ({
      where: () => ({
        then: (cb: (rows: MockToss[]) => unknown) =>
          cb(storedRows.filter((r) => r.deleted_at == null)),
        limit: (n: number) => ({
          offset: (o: number) => ({
            then: (cb: (rows: MockToss[]) => unknown) =>
              cb(
                storedRows
                  .filter((r) => r.deleted_at == null)
                  .slice(o, o + n),
              ),
          }),
        }),
      }),
    }),
  }));

  return { insert: insertSpy, select: selectSpy } as unknown as Database;
}

const now = new Date(1000000);
const earlier = new Date(999000);

const mockTosses: MockToss[] = [
  {
    id: 1,
    name: "M1",
    segment: "Single",
    value: 1,
    multiplier: 1,
    coords_x: null,
    coords_y: null,
    updated_at: now,
    created_at: earlier,
  },
  {
    id: 2,
    name: "S10",
    segment: "Single",
    value: 10,
    multiplier: 1,
    coords_x: 5.0,
    coords_y: -3.0,
    updated_at: now,
    created_at: earlier,
  },
  {
    id: 3,
    name: "D20",
    segment: "Double",
    value: 20,
    multiplier: 2,
    coords_x: null,
    coords_y: null,
    updated_at: now,
    created_at: earlier,
  },
];

describe("toss.create", () => {
  it("creates a toss and returns it in API shape", async () => {
    // Arrange
    const db = createMockDb([]);
    const client = createRouterClient(router, { context: { db } });

    // Act
    const result = await client.toss.create({
      name: "T20",
      segment: "Triple",
      value: 20,
      multiplier: 3,
      coords: { x: null, y: null },
    });

    // Assert
    assertEquals(result.name, "T20");
    assertEquals(result.segment, "Triple");
    assertEquals(result.value, 20);
    assertEquals(result.multiplier, 3);
    assertEquals(result.coords, { x: null, y: null });
    assertEquals(typeof result.id, "number");
    assertEquals(typeof result.meta.created_at, "number");
    assertEquals(typeof result.meta.updated_at, "number");
  });

  it("returns toss with optional coords", async () => {
    // Arrange
    const db = createMockDb([]);
    const client = createRouterClient(router, { context: { db } });

    // Act
    const result = await client.toss.create({
      name: "S5",
      segment: "Single",
      value: 5,
      multiplier: 1,
      coords: { x: 1.5, y: -2.3 },
    });

    // Assert
    assertEquals(result.coords.x, 1.5);
    assertEquals(result.coords.y, -2.3);
  });

  it("calls db.insert once", async () => {
    // Arrange
    const db = createMockDb([]);
    const client = createRouterClient(router, { context: { db } });

    // Act
    await client.toss.create({
      name: "Bull",
      segment: "Double",
      value: 50,
      multiplier: 2,
      coords: { x: null, y: null },
    });

    // Assert
    assertSpyCalls(db.insert as ReturnType<typeof spy>, 1);
  });

  it("throws SERVER_ISSUE when db throws", async () => {
    // Arrange
    const db = {
      insert: spy(() => {
        throw new Error("DB connection failed");
      }),
      select: spy(() => ({})),
    } as unknown as Database;
    const client = createRouterClient(router, { context: { db } });

    // Act & Assert
    await assertRejects(
      () =>
        client.toss.create({
          name: "Miss",
          segment: "Outside",
          value: 0,
          multiplier: 1,
          coords: { x: null, y: null },
        }),
    );
  });
});

describe("toss.read", () => {
  it("returns a toss by id", async () => {
    // Arrange
    const db = createMockDb(mockTosses);
    const client = createRouterClient(router, { context: { db } });

    // Act
    const result = await client.toss.read({ id: 1 });

    // Assert
    assertEquals(result.id, 1);
    assertEquals(result.name, "M1");
    assertEquals(result.segment, "Single");
    assertEquals(result.value, 1);
  });

  it("returns toss with optional coords", async () => {
    // Arrange
    const tossWithCoords: MockToss = {
      id: 2,
      name: "S10",
      segment: "Single",
      value: 10,
      multiplier: 1,
      coords_x: 5.0,
      coords_y: -3.0,
      updated_at: now,
      created_at: earlier,
    };
    const db = createMockDb([tossWithCoords]);
    const client = createRouterClient(router, { context: { db } });

    // Act
    const result = await client.toss.read({ id: 2 });

    // Assert
    assertEquals(result.coords.x, 5.0);
    assertEquals(result.coords.y, -3.0);
  });

  it("throws SERVER_ISSUE when toss not found", async () => {
    // Arrange
    const db = createMockDb([]);
    const client = createRouterClient(router, { context: { db } });

    // Act & Assert
    await assertRejects(() => client.toss.read({ id: 999 }));
  });

  it("filters out soft-deleted tosses", async () => {
    // Arrange
    const deletedToss: MockToss = {
      ...mockTosses[0],
      id: 99,
      deleted_at: Date.now(),
    };
    const db = createMockDb([deletedToss]);
    const client = createRouterClient(router, { context: { db } });

    // Act & Assert
    await assertRejects(() => client.toss.read({ id: 99 }));
  });

  it("calls db.select once", async () => {
    // Arrange
    const db = createMockDb(mockTosses);
    const client = createRouterClient(router, { context: { db } });

    // Act
    await client.toss.read({ id: 1 });

    // Assert
    assertSpyCalls(db.select as ReturnType<typeof spy>, 1);
  });
});

describe("toss.list", () => {
  it("returns paginated tosses in API shape", async () => {
    // Arrange
    const db = createMockDb(mockTosses);
    const client = createRouterClient(router, { context: { db } });

    // Act
    const result = await client.toss.list({ limit: 2, offset: 0 });

    // Assert
    assertEquals(result.length, 2);
    assertEquals(result[0].name, "M1");
    assertEquals(result[1].name, "S10");
    assertEquals(typeof result[0].meta.created_at, "number");
    assertEquals(typeof result[0].meta.updated_at, "number");
  });

  it("respects limit and offset", async () => {
    // Arrange
    const db = createMockDb(mockTosses);
    const client = createRouterClient(router, { context: { db } });

    // Act
    const result = await client.toss.list({ limit: 2, offset: 1 });

    // Assert
    assertEquals(result.length, 2);
    assertEquals(result[0].name, "S10");
    assertEquals(result[1].name, "D20");
  });

  it("returns empty array when no tosses", async () => {
    // Arrange
    const db = createMockDb([]);
    const client = createRouterClient(router, { context: { db } });

    // Act
    const result = await client.toss.list({ limit: 10, offset: 0 });

    // Assert
    assertEquals(result.length, 0);
  });

  it("filters out soft-deleted tosses", async () => {
    // Arrange
    const tosses: MockToss[] = [
      ...mockTosses,
      { ...mockTosses[0], id: 99, deleted_at: Date.now() },
    ];
    const db = createMockDb(tosses);
    const client = createRouterClient(router, { context: { db } });

    // Act
    const result = await client.toss.list({ limit: 10, offset: 0 });

    // Assert
    assertEquals(result.length, 3);
    assertEquals(result.every((t) => t.id !== 99), true);
  });

  it("calls db.select once", async () => {
    // Arrange
    const db = createMockDb(mockTosses);
    const client = createRouterClient(router, { context: { db } });

    // Act
    await client.toss.list({ limit: 10, offset: 0 });

    // Assert
    assertSpyCalls(db.select as ReturnType<typeof spy>, 1);
  });
});

describe("toss.subscribe", () => {
  it("yields a toss when create is called", async () => {
    // Arrange
    const db = createMockDb([]);
    const client = createRouterClient(router, { context: { db } });

    // Act
    const iterator = await client.toss.subscribe();
    const createPromise = client.toss.create({
      name: "Bull",
      segment: "Double",
      value: 50,
      multiplier: 2,
      coords: { x: null, y: null },
    });
    const [yielded] = await Promise.all([
      iterator.next(),
      createPromise,
    ]);

    // Assert
    const value = yielded.value as Toss;
    assertEquals(yielded.done, false);
    assertEquals(value.name, "Bull");
    assertEquals(value.segment, "Double");
  });
});
