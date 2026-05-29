import type { Database } from "@dodarts/database";
import { implement } from "@orpc/server";

import type { Emitter } from "./emitter.ts";
import {
  tossCreateContract,
  tossListContract,
  tossReadContract,
  tossSubscribeContract,
} from "./toss/toss.contract.ts";
import {
  sessionCreateContract,
  sessionCurrentContract,
  sessionEndContract,
  sessionListContract,
  sessionReadContract,
  sessionSubscribeContract,
} from "./session/session.contract.ts";

const contract = {
  toss: {
    create: tossCreateContract,
    read: tossReadContract,
    list: tossListContract,
    subscribe: tossSubscribeContract,
  },
  session: {
    create: sessionCreateContract,
    read: sessionReadContract,
    list: sessionListContract,
    end: sessionEndContract,
    active: sessionCurrentContract,
    subscribe: sessionSubscribeContract,
  },
};

export const os = implement(contract).$context<
  { db: Database; emitter: Emitter }
>();
