import EventEmitter from "node:events";
import type { Database } from "@dodarts/database";
import {
  create as createToss,
  list as listToss,
  read as readToss,
} from "@dodarts/database/toss";
import { eventIterator, implement } from "@orpc/server";
import { oc } from "@orpc/contract";

import {
  type Toss,
  tossCreateSchema,
  tossListSchema,
  tossReadSchema,
  tossSchema,
} from "./toss.schema.ts";

const emitter = new EventEmitter<{
  created: [toss: Toss];
}>();

const map = (value: Awaited<ReturnType<typeof readToss>>): Toss => {
  return {
    id: value.id,
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

const createContract = oc.input(tossCreateSchema).output(tossSchema).errors({
  "SERVER_ISSUE": {},
});
const readContract = oc.input(tossReadSchema).output(tossSchema).errors({
  "SERVER_ISSUE": {},
});
const listContract = oc
  .input(tossListSchema)
  .output(tossSchema.array());
const subscribeContract = oc.output(eventIterator(tossSchema));
const contract = {
  toss: {
    create: createContract,
    read: readContract,
    list: listContract,
    subscribe: subscribeContract,
  },
};

const os = implement(contract).$context<{ db: Database }>();

const create = os.toss.create.handler(async (
  { context, errors, input },
) => {
  try {
    const { db } = context;
    const entry = await createToss(db, {
      ...input,
      coords_x: input.coords.x,
      coords_y: input.coords.y,
    });
    const toss = map(entry);
    emitter.emit("created", toss);
    return toss;
  } catch (err) {
    throw errors.SERVER_ISSUE({ message: `Failed to create Toss: ${err}` });
  }
});
const read = os.toss.read.handler(async ({ context, errors, input }) => {
  try {
    const { db } = context;
    const entry = await readToss(db, input);
    return map(entry);
  } catch (err) {
    throw errors.SERVER_ISSUE({ message: `Failed to read Toss: ${err}` });
  }
});
const list = os.toss.list.handler(async ({ context, input }) => {
  const { db } = context;
  const entries = await listToss(db, input);
  return entries.map((entry) => map(entry));
});
const subscribe = os.toss.subscribe.handler(
  async function* () {
    while (true) {
      const toss = await new Promise<Toss>((resolve) => {
        const listener = (detail: unknown) => resolve(detail as Toss);
        emitter.once("created", listener);
      });
      yield toss;
    }
  },
);

const router = os.router({
  toss: {
    create,
    read,
    list,
    subscribe,
  },
});
export default router;
