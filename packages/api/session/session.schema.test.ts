import { describe, it } from "@std/testing/bdd";
import { assertEquals, assertThrows } from "@std/assert";

import {
  SESSION_LIST_LIMIT_DEFAULT,
  SESSION_LIST_OFFSET_DEFAULT,
  sessionCreateSchema,
  sessionCurrentSchema,
  sessionEndSchema,
  sessionListSchema,
  sessionReadSchema,
  sessionSchema,
} from "./session.schema.ts";

const uuid = "550e8400-e29b-41d4-a716-446655440000";

const validSession = {
  id: uuid,
  ended_at: null as number | null,
  meta: { updated_at: 1000000, created_at: 999000 },
};

describe("sessionSchema", () => {
  it("accepts a valid session with null endedAt", () => {
    const result = sessionSchema.parse(validSession);

    assertEquals(result.id, uuid);
    assertEquals(result.ended_at, null);
  });

  it("accepts a valid session with endedAt timestamp", () => {
    const result = sessionSchema.parse({
      ...validSession,
      ended_at: 1000000,
    });

    assertEquals(result.ended_at, 1000000);
  });

  it("rejects a session without id", () => {
    assertThrows(() =>
      sessionSchema.parse({
        ended_at: null,
        meta: { updated_at: 1000000, created_at: 999000 },
      })
    );
  });

  it("rejects a session with non-UUID id", () => {
    assertThrows(() =>
      sessionSchema.parse({
        ...validSession,
        id: "not-a-uuid",
      })
    );
  });
});

describe("sessionCreateSchema", () => {
  it("accepts void input", () => {
    const result = sessionCreateSchema.parse(undefined);

    assertEquals(result, undefined);
  });
});

describe("sessionReadSchema", () => {
  it("accepts a valid UUID id", () => {
    const result = sessionReadSchema.parse({ id: uuid });

    assertEquals(result.id, uuid);
  });

  it("rejects a non-UUID id", () => {
    assertThrows(() => sessionReadSchema.parse({ id: "abc" }));
  });

  it("rejects an empty string id", () => {
    assertThrows(() => sessionReadSchema.parse({ id: "" }));
  });
});

describe("sessionListSchema", () => {
  it("applies default limit and offset when not provided", () => {
    const result = sessionListSchema.parse(undefined);

    assertEquals(result.limit, SESSION_LIST_LIMIT_DEFAULT);
    assertEquals(result.offset, SESSION_LIST_OFFSET_DEFAULT);
  });

  it("accepts explicit limit and offset", () => {
    const result = sessionListSchema.parse({ limit: 10, offset: 5 });

    assertEquals(result.limit, 10);
    assertEquals(result.offset, 5);
  });

  it("rejects limit less than 1", () => {
    assertThrows(() => sessionListSchema.parse({ limit: 0, offset: 0 }));
  });

  it("rejects negative offset", () => {
    assertThrows(() => sessionListSchema.parse({ limit: 10, offset: -1 }));
  });
});

describe("sessionEndSchema", () => {
  it("accepts a valid UUID id", () => {
    const result = sessionEndSchema.parse({ id: uuid });

    assertEquals(result.id, uuid);
  });

  it("rejects a non-UUID id", () => {
    assertThrows(() => sessionEndSchema.parse({ id: "abc" }));
  });
});

describe("sessionCurrentSchema", () => {
  it("accepts void input", () => {
    const result = sessionCurrentSchema.parse(undefined);

    assertEquals(result, undefined);
  });
});
