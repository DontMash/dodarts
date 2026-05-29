import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { RPCHandler as WebsocketRPCHandler } from "@orpc/server/websocket";

import type { Toss } from "./toss/toss.schema.ts";
import type { Session } from "./session/session.schema.ts";
import router from "./router.ts";

const handler = new RPCHandler(router);
const websocketHandler = new WebsocketRPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export { handler, websocketHandler };
export type { Session, Toss };
