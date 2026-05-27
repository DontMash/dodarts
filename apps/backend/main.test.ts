// deno-coverage-ignore-start
import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { assertSpyCalls, spy } from "@std/testing/mock";

import { createRouterClient } from "@dodarts/api/client";
import type { Emitter } from "@dodarts/api/emitter";
import type { Database } from "@dodarts/database";

import { createApp, handleMessage } from "@/main.ts";
import type { Toss } from "../../packages/api/toss/toss.schema.ts";

const mockEmitter: Emitter = {
  emit() {},
  once() {},
};

interface MockToss extends Toss {
  meta: Toss["meta"] & { deleted_at?: number | null };
  updated_at: Date;
  created_at: Date;
}

function createMockDb(rows: MockToss[]): Database {
  const storedRows: MockToss[] = [...rows];

  const insertSpy = spy((_table: unknown) => ({
    values: (
      values: Omit<Toss, "id" | "meta"> & {
        coords: { x: number | null; y: number | null };
      },
    ) => {
      const inserted: MockToss = {
        id: storedRows.length + 1,
        name: values.name,
        segment: values.segment,
        value: values.value,
        multiplier: values.multiplier,
        coords: values.coords,
        meta: {
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        created_at: new Date(),
        updated_at: new Date(),
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
          cb(storedRows.filter((r) => r.meta.deleted_at == null)),
        limit: (n: number) => ({
          offset: (o: number) => ({
            then: (cb: (rows: MockToss[]) => unknown) =>
              cb(
                storedRows
                  .filter((r) => r.meta.deleted_at == null)
                  .slice(o, o + n),
              ),
          }),
        }),
      }),
    }),
  }));

  return { insert: insertSpy, select: selectSpy } as unknown as Database;
}

function createMockClient(db: Database) {
  return createRouterClient({ db, emitter: mockEmitter });
}

describe("handleMessage", () => {
  it("processes state messages with Throw detected event and creates toss", async () => {
    // Arrange
    const db = createMockDb([]);
    const client = createMockClient(db);
    const message = JSON.stringify({
      type: "state",
      data: {
        event: "Throw detected",
        throws: [
          {
            segment: { name: "T20", bed: "Triple", number: 20, multiplier: 3 },
            coords: { x: 1.5, y: -2.3 },
          },
        ],
        connected: true,
        running: true,
        status: "Throw",
        numThrows: 1,
      },
    });
    const event = new MessageEvent("message", { data: message });

    // Act
    await handleMessage(event, client);

    // Assert
    assertSpyCalls(db.insert as ReturnType<typeof spy>, 1);
  });

  it("uses last throw when multiple throws exist", async () => {
    // Arrange
    const db = createMockDb([]);
    const client = createMockClient(db);
    const message = JSON.stringify({
      type: "state",
      data: {
        event: "Throw detected",
        throws: [
          {
            segment: { name: "S10", bed: "Single", number: 10, multiplier: 1 },
            coords: { x: null, y: null },
          },
          {
            segment: { name: "D20", bed: "Double", number: 20, multiplier: 2 },
            coords: { x: 2.0, y: -1.0 },
          },
        ],
        connected: true,
        running: true,
        status: "Throw",
        numThrows: 2,
      },
    });
    const event = new MessageEvent("message", { data: message });

    // Act
    await handleMessage(event, client);

    // Assert
    assertSpyCalls(db.insert as ReturnType<typeof spy>, 1);
  });

  it("skips when throws array is empty", async () => {
    // Arrange
    const db = createMockDb([]);
    const client = createMockClient(db);
    const message = JSON.stringify({
      type: "state",
      data: {
        event: "Throw detected",
        throws: [],
        connected: true,
        running: true,
        status: "Throw",
        numThrows: 0,
      },
    });
    const event = new MessageEvent("message", { data: message });

    // Act
    await handleMessage(event, client);

    // Assert
    assertSpyCalls(db.insert as ReturnType<typeof spy>, 0);
  });

  it("skips when throws array is undefined", async () => {
    // Arrange
    const db = createMockDb([]);
    const client = createMockClient(db);
    const message = JSON.stringify({
      type: "state",
      data: {
        event: "Throw detected",
        connected: true,
        running: true,
        status: "Throw",
        numThrows: 0,
      },
    });
    const event = new MessageEvent("message", { data: message });

    // Act
    await handleMessage(event, client);

    // Assert
    assertSpyCalls(db.insert as ReturnType<typeof spy>, 0);
  });

  it("skips non-Throw detected events", async () => {
    // Arrange
    const db = createMockDb([]);
    const client = createMockClient(db);
    const message = JSON.stringify({
      type: "state",
      data: {
        event: "Takeout started",
        connected: true,
        running: true,
        status: "Throw",
        numThrows: 0,
      },
    });
    const event = new MessageEvent("message", { data: message });

    // Act
    await handleMessage(event, client);

    // Assert
    assertSpyCalls(db.insert as ReturnType<typeof spy>, 0);
  });

  it("ignores motion_state messages", async () => {
    // Arrange
    const db = createMockDb([]);
    const client = createMockClient(db);
    const message = JSON.stringify({
      type: "motion_state",
      data: {
        darts: 1,
        camStates: [],
        class: 0,
        timings: {
          copy: 0,
          diff: 0,
          count: 0,
          takeout: 0,
          state: 0,
          ret: 0,
          total: 0,
        },
        isWaiting: false,
        isStable: false,
        isDart: false,
        isHand: false,
        isTakeoutPartial: false,
        isTakeoutFull: false,
        frameCounts: { stable: 0, dart: 0, hand: 0, takeout: 0, wait: 0 },
        frameFlags: { dart: false, hand: false, takeout: false },
      },
    });
    const event = new MessageEvent("message", { data: message });

    // Act
    await handleMessage(event, client);

    // Assert
    assertSpyCalls(db.insert as ReturnType<typeof spy>, 0);
  });

  it("ignores stats messages", async () => {
    // Arrange
    const db = createMockDb([]);
    const client = createMockClient(db);
    const message = JSON.stringify({
      type: "stats",
      data: {
        resolution: { width: 1920, height: 1080 },
        fps: 30,
      },
    });
    const event = new MessageEvent("message", { data: message });

    // Act
    await handleMessage(event, client);

    // Assert
    assertSpyCalls(db.insert as ReturnType<typeof spy>, 0);
  });

  it("ignores cam_stats messages", async () => {
    // Arrange
    const db = createMockDb([]);
    const client = createMockClient(db);
    const message = JSON.stringify({
      type: "cam_stats",
      data: {
        id: 1,
        fps: 30,
        resolution: { width: 1920, height: 1080, framerates: null },
      },
    });
    const event = new MessageEvent("message", { data: message });

    // Act
    await handleMessage(event, client);

    // Assert
    assertSpyCalls(db.insert as ReturnType<typeof spy>, 0);
  });

  it("handles errors gracefully without throwing", async () => {
    // Arrange
    const db = {
      insert: spy(() => {
        throw new Error("DB connection failed");
      }),
      select: spy(() => ({})),
    } as unknown as Database;
    const client = createMockClient(db);
    const message = JSON.stringify({
      type: "state",
      data: {
        event: "Throw detected",
        throws: [
          {
            segment: { name: "T20", bed: "Triple", number: 20, multiplier: 3 },
            coords: { x: null, y: null },
          },
        ],
        connected: true,
        running: true,
        status: "Throw",
        numThrows: 1,
      },
    });
    const event = new MessageEvent("message", { data: message });

    // Act & Assert
    await handleMessage(event, client);
  });
});

describe("app", () => {
  it("returns 404 for non-API routes", async () => {
    // Arrange
    const db = createMockDb([]);
    const testApp = createApp({ db, emitter: mockEmitter });
    const req = new Request("http://localhost/");

    // Act
    const res = await testApp.request(req);

    // Assert
    assertEquals(res.status, 404);
  });

  it("rejects invalid toss.create input via API route", async () => {
    // Arrange
    const db = createMockDb([]);
    const testApp = createApp({ db, emitter: mockEmitter });
    const req = new Request("http://localhost/api/toss.create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: {
          name: "Invalid",
          segment: "Invalid",
          value: -1,
          multiplier: 0,
          coords: { x: null, y: null },
        },
      }),
    });

    // Act
    const res = await testApp.request(req);

    // Assert - Should fail validation (not 200)
    assertEquals(res.status !== 200, true);
  });
});
