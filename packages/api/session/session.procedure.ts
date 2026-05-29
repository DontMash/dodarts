import {
  create as createSession,
  end as endSession,
  findActive as findActiveSession,
  list as listSessions,
  read as readSession,
} from "@dodarts/database/session";

import { os } from "../contract.ts";
import type { Session } from "./session.schema.ts";

const mapSession = (
  value: Awaited<ReturnType<typeof readSession>>,
): Session => {
  return {
    id: value.id,
    ended_at: value.ended_at?.getTime() ?? null,
    meta: {
      updated_at: value.updated_at.getTime(),
      created_at: value.created_at.getTime(),
    },
  };
};

export const sessionCreate = os.session.create.handler(
  async ({ context: { db, emitter }, errors }) => {
    try {
      const active = await findActiveSession(db);
      if (active) {
        await endSession(db, { id: active.id });
        emitter.emit("session:ended", mapSession(active));
      }
      const entry = await createSession(db, {});
      const session = mapSession(entry);
      emitter.emit("session:started", session);
      return session;
    } catch (err) {
      throw errors.SERVER_ISSUE({
        message: `Failed to create session: ${err}`,
      });
    }
  },
);

export const sessionRead = os.session.read.handler(
  async ({ context: { db }, errors, input }) => {
    try {
      const entry = await readSession(db, input);
      return mapSession(entry);
    } catch (err) {
      throw errors.SERVER_ISSUE({ message: `Failed to read session: ${err}` });
    }
  },
);

export const sessionList = os.session.list.handler(
  async ({ context: { db }, input }) => {
    const entries = await listSessions(db, input);
    return entries.map((entry) => mapSession(entry));
  },
);

export const sessionEnd = os.session.end.handler(
  async ({ context: { db, emitter }, errors, input }) => {
    try {
      const entry = await endSession(db, input);
      const session = mapSession(entry);
      emitter.emit("session:ended", session);
      return session;
    } catch (err) {
      throw errors.SERVER_ISSUE({ message: `Failed to end session: ${err}` });
    }
  },
);

export const sessionActive = os.session.active.handler(
  async ({ context: { db } }) => {
    const entry = await findActiveSession(db);
    if (!entry) return null;
    return mapSession(entry);
  },
);

export const sessionSubscribe = os.session.subscribe.handler(
  async function* ({ context }) {
    const { emitter } = context;
    const queue: Session[] = [];
    let resolveWait: (() => void) | null = null;
    let waiting = new Promise<void>((r) => {
      resolveWait = r;
    });

    const onStarted = (s: Session) => {
      queue.push(s);
      resolveWait?.();
    };
    const onEnded = (s: Session) => {
      queue.push(s);
      resolveWait?.();
    };

    emitter.on("session:started", onStarted);
    emitter.on("session:ended", onEnded);

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
      emitter.off("session:started", onStarted);
      emitter.off("session:ended", onEnded);
    }
  },
);
