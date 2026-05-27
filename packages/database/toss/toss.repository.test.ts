// deno-coverage-ignore-start
import { describe, it } from "@std/testing/bdd";
import { assertSpyCalls, spy } from "@std/testing/mock";
import { assertEquals, assertRejects } from "@std/assert";

import type { Database } from "../mod.ts";
import { create, list, read } from "./toss.repository.ts";

interface MockToss {
  id: number;
  name: string;
  segment: string;
  value: number;
  multiplier: number;
  updated_at: number;
  created_at: number;
  coords_x?: number;
  coords_y?: number;
  deleted_at?: number | null;
}

function createMockDb(rows: MockToss[]): Database {
  const storedRows: MockToss[] = [...rows];

  const insertSpy = spy((_table: unknown) => ({
    values: (values: MockToss) => {
      const inserted = { ...values } as MockToss;
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
        then: (cb: (rows: MockToss[]) => unknown) => {
          const filtered = storedRows.filter(
            (row) => row.deleted_at === undefined || row.deleted_at === null,
          );
          cb(filtered);
        },
        orderBy: () => ({
          then: (cb: (rows: MockToss[]) => unknown) => {
            const filtered = storedRows.filter(
              (row) => row.deleted_at === undefined || row.deleted_at === null,
            );
            cb(filtered);
          },
          limit: (limit: number) => ({
            offset: (offset: number) => ({
              then: (cb: (rows: MockToss[]) => unknown) => {
                const filtered = storedRows.filter(
                  (row) =>
                    row.deleted_at === undefined || row.deleted_at === null,
                );
                cb(filtered.slice(offset, offset + limit));
              },
            }),
          }),
        }),
      }),
    }),
  }));

  return {
    insert: insertSpy,
    select: selectSpy,
  } as unknown as Database;
}

const mockTosses: MockToss[] = [
  {
    id: 1,
    name: "M1",
    segment: "Single",
    value: 1,
    multiplier: 1,
    updated_at: Date.now(),
    created_at: Date.now(),
  },
  {
    id: 2,
    name: "S10",
    segment: "Single",
    value: 10,
    multiplier: 1,
    coords_x: 5.0,
    coords_y: -3.0,
    updated_at: Date.now(),
    created_at: Date.now(),
  },
  {
    id: 3,
    name: "D20",
    segment: "Double",
    value: 20,
    multiplier: 2,
    updated_at: Date.now(),
    created_at: Date.now(),
  },
];

describe("create", () => {
  it("inserts a toss and returns it", async () => {
    const db = createMockDb(mockTosses);
    const input = {
      name: "T20" as const,
      segment: "Triple" as const,
      value: 20,
      multiplier: 3,
    };

    const result = await create(db, input);

    assertEquals(result.name, "T20");
    assertEquals(result.segment, "Triple");
    assertEquals(result.value, 20);
    assertEquals(result.multiplier, 3);
  });

  it("returns inserted toss with all fields", async () => {
    const db = createMockDb([]);
    const input = {
      name: "S5" as const,
      segment: "Single" as const,
      value: 5,
      multiplier: 1,
      coords_x: 2.5,
      coords_y: 1.0,
    };

    const result = await create(db, input);

    assertEquals(result.name, "S5");
    assertEquals(result.segment, "Single");
    assertEquals(result.value, 5);
    assertEquals(result.multiplier, 1);
    assertEquals(result.coords_x, 2.5);
    assertEquals(result.coords_y, 1.0);
  });

  it("calls db.insert", async () => {
    const db = createMockDb(mockTosses);
    const input = {
      name: "M1" as const,
      segment: "Single" as const,
      value: 1,
      multiplier: 1,
    };

    await create(db, input);

    const insertSpy = db.insert as ReturnType<typeof spy>;
    assertSpyCalls(insertSpy, 1);
  });
});

describe("read", () => {
  it("returns toss by id", async () => {
    const db = createMockDb([{
      id: 1,
      name: "M1",
      segment: "Single",
      value: 1,
      multiplier: 1,
      updated_at: Date.now(),
      created_at: Date.now(),
    }]);

    const result = await read(db, { id: 1 });

    assertEquals(result.name, "M1");
    assertEquals(result.segment, "Single");
    assertEquals(result.value, 1);
  });

  it("returns toss with optional coords", async () => {
    const db = createMockDb([{
      id: 2,
      name: "S10",
      segment: "Single",
      value: 10,
      multiplier: 1,
      coords_x: 5.0,
      coords_y: -3.0,
      updated_at: Date.now(),
      created_at: Date.now(),
    }]);

    const result = await read(db, { id: 2 });

    assertEquals(result.name, "S10");
    assertEquals(result.coords_x, 5.0);
    assertEquals(result.coords_y, -3.0);
  });

  it("throws when toss not found", async () => {
    const db = createMockDb([]);

    await assertRejects(
      async () => await read(db, { id: 999 }),
      Error,
      "Toss not found",
    );
  });

  it("filters out soft-deleted tosses", async () => {
    const db = createMockDb([{
      id: 4,
      name: "M5",
      segment: "Single",
      value: 5,
      multiplier: 1,
      deleted_at: Date.now(),
      updated_at: Date.now(),
      created_at: Date.now(),
    }]);

    await assertRejects(
      async () => await read(db, { id: 4 }),
      Error,
      "Toss not found",
    );
  });

  it("calls db.select", async () => {
    const db = createMockDb([{
      id: 1,
      name: "M1",
      segment: "Single",
      value: 1,
      multiplier: 1,
      updated_at: Date.now(),
      created_at: Date.now(),
    }]);

    await read(db, { id: 1 });

    const selectSpy = db.select as ReturnType<typeof spy>;
    assertSpyCalls(selectSpy, 1);
  });
});

describe("list", () => {
  it("returns paginated tosses", async () => {
    const db = createMockDb(mockTosses);

    const result = await list(db, { limit: 2, offset: 0 });

    assertEquals(result.length, 2);
    assertEquals(result[0].name, "M1");
    assertEquals(result[1].name, "S10");
  });

  it("respects offset", async () => {
    const db = createMockDb(mockTosses);

    const result = await list(db, { limit: 2, offset: 1 });

    assertEquals(result.length, 2);
    assertEquals(result[0].name, "S10");
    assertEquals(result[1].name, "D20");
  });

  it("returns fewer results when near end", async () => {
    const db = createMockDb(mockTosses);

    const result = await list(db, { limit: 10, offset: 2 });

    assertEquals(result.length, 1);
    assertEquals(result[0].name, "D20");
  });

  it("filters out soft-deleted tosses", async () => {
    const db = createMockDb([
      ...mockTosses,
      {
        id: 4,
        name: "M5",
        segment: "Single",
        value: 5,
        multiplier: 1,
        deleted_at: Date.now(),
        updated_at: Date.now(),
        created_at: Date.now(),
      },
    ]);
    const result = await list(db, { limit: 10, offset: 0 });
    assertEquals(result.length, 3);
    for (const toss of result) {
      assertEquals(toss.deleted_at, undefined);
    }
  });

  it("returns empty array when no tosses match", async () => {
    const db = createMockDb([]);

    const result = await list(db, { limit: 10, offset: 0 });

    assertEquals(result.length, 0);
  });

  it("with zero offset returns from beginning", async () => {
    const db = createMockDb(mockTosses);

    const result = await list(db, { limit: 1, offset: 0 });

    assertEquals(result.length, 1);
    assertEquals(result[0].name, "M1");
  });

  it("calls db.select", async () => {
    const db = createMockDb(mockTosses);

    await list(db, { limit: 10, offset: 0 });

    const selectSpy = db.select as ReturnType<typeof spy>;
    assertSpyCalls(selectSpy, 1);
  });
});
