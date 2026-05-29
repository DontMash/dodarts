import { eventIterator, oc } from "@orpc/contract";
import {
  sessionCreateSchema,
  sessionCurrentSchema,
  sessionEndSchema,
  sessionListSchema,
  sessionReadSchema,
  sessionSchema,
} from "./session.schema.ts";

export const sessionCreateContract = oc.input(sessionCreateSchema).output(
  sessionSchema,
).errors({ "SERVER_ISSUE": {} });
export const sessionReadContract = oc.input(sessionReadSchema).output(
  sessionSchema,
).errors({ "SERVER_ISSUE": {} });
export const sessionListContract = oc
  .input(sessionListSchema)
  .output(sessionSchema.array());
export const sessionEndContract = oc.input(sessionEndSchema).output(
  sessionSchema,
).errors({ "SERVER_ISSUE": {} });
export const sessionCurrentContract = oc.input(sessionCurrentSchema).output(
  sessionSchema.nullable(),
);
export const sessionSubscribeContract = oc.output(eventIterator(sessionSchema));
