import {
  create as createToss,
  list as listToss,
  read as readToss,
} from "@dodarts/database/toss";
import { eventIterator, implement, ORPCError } from "@orpc/server";
import { oc } from "@orpc/contract";

import dbMiddleware from "@/database.middleware.ts";

import {
  type Toss,
  tossCreateSchema,
  tossListSchema,
  tossReadSchema,
  tossSchema,
} from "./toss.schema.ts";

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

class TossEvent extends CustomEvent<Toss> {
  static NAME = "toss-create" as const;

  constructor(toss: Toss) {
    super(TossEvent.NAME, { detail: toss });
  }
}

const createContract = oc.input(tossCreateSchema).output(tossSchema);
const readContract = oc.input(tossReadSchema).output(tossSchema);
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

const os = implement(contract).use(dbMiddleware);

const create = os.toss.create.handler(async (
  { context, input },
) => {
  try {
    const { db } = context;
    const entry = await createToss(db, {
      ...input,
      coords_x: input.coords.x,
      coords_y: input.coords.y,
    });
    const toss = map(entry);
    dispatchEvent(new TossEvent(toss));
    return toss;
  } catch (err) {
    throw new ORPCError(`Failed to create Toss: ${err}`);
  }
}).callable();
const read = os.toss.read.handler(async ({ context, input }) => {
  try {
    const { db } = context;
    const entry = await readToss(db, input);
    return map(entry);
  } catch (err) {
    throw new ORPCError(`Failed to read Toss: ${err}`);
  }
}).callable();
const list = os.toss.list.handler(async ({ context, input }) => {
  const { db } = context;
  const entries = await listToss(db, input);
  return entries.map((entry) => map(entry));
}).callable();
const subscribe = os.toss.subscribe.handler(
  async function* () {
    while (true) {
      const toss = await new Promise<Toss>((resolve) =>
        addEventListener(TossEvent.NAME, (ev) => {
          const event = ev as TossEvent;
          resolve(event.detail);
        }, { once: true })
      );
      yield toss;
    }
  },
).callable();

const router = os.router({
  toss: {
    create,
    read,
    list,
    subscribe,
  },
});
export default router;
