import {
  create as createToss,
  list as listToss,
  read as readToss,
} from "@dodarts/database/toss";

import { os } from "../contract.ts";
import type { Toss } from "./toss.schema.ts";

const mapToss = (value: Awaited<ReturnType<typeof readToss>>): Toss => {
  return {
    id: value.id,
    sessionId: value.session_id,
    name: value.name,
    segment: value.segment,
    value: value.value,
    multiplier: value.multiplier,
    coords: {
      x: value.coords_x,
      y: value.coords_y,
    },
    meta: {
      updated_at: value.updated_at.getTime(),
      created_at: value.created_at.getTime(),
    },
  };
};

export const tossCreate = os.toss.create.handler(async (
  { context, errors, input },
) => {
  try {
    const { db, emitter } = context;
    const entry = await createToss(db, {
      ...input,
      session_id: input.sessionId,
      coords_x: input.coords.x,
      coords_y: input.coords.y,
    });
    const toss = mapToss(entry);
    emitter.emit("toss:created", toss);
    return toss;
  } catch (err) {
    throw errors.SERVER_ISSUE({ message: `Failed to create Toss: ${err}` });
  }
});

export const tossRead = os.toss.read.handler(
  async ({ context: { db }, errors, input }) => {
    try {
      const entry = await readToss(db, input);
      return mapToss(entry);
    } catch (err) {
      throw errors.SERVER_ISSUE({ message: `Failed to read Toss: ${err}` });
    }
  },
);

export const tossList = os.toss.list.handler(
  async ({ context: { db }, input }) => {
    const { sessionId, ...rest } = input;
    const entries = await listToss(db, { ...rest, sessionId });
    return entries.map((entry) => mapToss(entry));
  },
);

export const tossSubscribe = os.toss.subscribe.handler(
  async function* ({ context }) {
    const { emitter } = context;
    const queue: Toss[] = [];
    let resolveWait: (() => void) | null = null;
    let waiting = new Promise<void>((r) => {
      resolveWait = r;
    });

    const onCreated = (t: Toss) => {
      queue.push(t);
      resolveWait?.();
    };

    emitter.on("toss:created", onCreated);

    try {
      while (true) {
        while (queue.length === 0) {
          await waiting;
          waiting = new Promise<void>((r) => {
            resolveWait = r;
          });
        }
        yield queue.shift()!;
      }
    } finally {
      emitter.off("toss:created", onCreated);
    }
  },
);
