import { eventIterator, oc } from "@orpc/contract";

import {
  tossCreateSchema,
  tossListSchema,
  tossReadSchema,
  tossSchema,
} from "./toss.schema.ts";

export const tossCreateContract = oc.input(tossCreateSchema).output(tossSchema)
  .errors(
    { "SERVER_ISSUE": {} },
  );
export const tossReadContract = oc.input(tossReadSchema).output(tossSchema)
  .errors({
    "SERVER_ISSUE": {},
  });
export const tossListContract = oc
  .input(tossListSchema)
  .output(tossSchema.array());
export const tossSubscribeContract = oc.output(eventIterator(tossSchema));
