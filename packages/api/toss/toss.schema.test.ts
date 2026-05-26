import { describe, it } from "@std/testing/bdd";
import { assertEquals, assertThrows } from "@std/assert";

import {
  TOSS_LIST_LIMIT_DEFAULT,
  TOSS_LIST_OFFSET_DEFAULT,
  tossCreateSchema,
  tossListSchema,
  tossReadSchema,
  tossSchema,
} from "./toss.schema.ts";

const validToss = {
  id: 1,
  name: "T20" as const,
  segment: "Triple" as const,
  value: 20,
  multiplier: 3,
  coords: { x: 1.5, y: -2.3 },
  meta: { updated_at: 1000000, created_at: 999000 },
};

describe("tossSchema", () => {
  it("accepts a valid toss", () => {
    const result = tossSchema.parse(validToss);

    assertEquals(result.id, 1);
    assertEquals(result.name, "T20");
    assertEquals(result.segment, "Triple");
    assertEquals(result.coords.x, 1.5);
    assertEquals(result.coords.y, -2.3);
  });

  it("accepts null coords", () => {
    const result = tossSchema.parse({
      ...validToss,
      coords: { x: null, y: null },
    });

    assertEquals(result.coords.x, null);
    assertEquals(result.coords.y, null);
  });

  it("rejects an unknown name", () => {
    assertThrows(() => tossSchema.parse({ ...validToss, name: "X99" }));
  });

  it("rejects an unknown segment", () => {
    assertThrows(() =>
      tossSchema.parse({ ...validToss, segment: "Quadruple" })
    );
  });
});

describe("tossCreateSchema", () => {
  it("accepts valid input without id and meta", () => {
    const input = {
      name: "S5" as const,
      segment: "Single" as const,
      value: 5,
      multiplier: 1,
      coords: { x: 0.0, y: 0.0 },
    };

    const result = tossCreateSchema.parse(input);

    assertEquals(result.name, "S5");
    assertEquals(result.segment, "Single");
    assertEquals(result.value, 5);
  });

  it("rejects input with unknown name", () => {
    assertThrows(() =>
      tossCreateSchema.parse({
        name: "Z1",
        segment: "Single",
        value: 1,
        multiplier: 1,
        coords: { x: null, y: null },
      })
    );
  });
});

describe("tossReadSchema", () => {
  it("accepts a valid id", () => {
    const result = tossReadSchema.parse({ id: 42 });

    assertEquals(result.id, 42);
  });

  it("coerces string id to number", () => {
    const result = tossReadSchema.parse({ id: "7" });

    assertEquals(result.id, 7);
  });

  it("rejects id less than 1", () => {
    assertThrows(() => tossReadSchema.parse({ id: 0 }));
  });
});

describe("tossListSchema", () => {
  it("applies default limit and offset when not provided", () => {
    const result = tossListSchema.parse(undefined);

    assertEquals(result.limit, TOSS_LIST_LIMIT_DEFAULT);
    assertEquals(result.offset, TOSS_LIST_OFFSET_DEFAULT);
  });

  it("accepts explicit limit and offset", () => {
    const result = tossListSchema.parse({ limit: 10, offset: 5 });

    assertEquals(result.limit, 10);
    assertEquals(result.offset, 5);
  });

  it("rejects limit less than 1", () => {
    assertThrows(() => tossListSchema.parse({ limit: 0, offset: 0 }));
  });

  it("rejects negative offset", () => {
    assertThrows(() => tossListSchema.parse({ limit: 10, offset: -1 }));
  });
});
