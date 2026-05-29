import type { Session } from "./session.schema.ts";

export type SessionEventMap = {
  "session:started": Session;
  "session:ended": Session;
};
