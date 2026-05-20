import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { RPCLink as WebsocketRPCLink } from "@orpc/client/websocket";
import type { RouterClient } from "@orpc/server";
import { createRouterClient as createORPCRouterClient } from "@orpc/server";

import router from "@/router.ts";

export const createClient = (url: string) => {
  const link = new RPCLink({
    url,
  });
  const fetchClient: RouterClient<typeof router> = createORPCClient(link);

  const websocket = new WebSocket("ws://localhost:8000/api");
  const websocketLink = new WebsocketRPCLink({
    websocket,
  });
  const websocketClient: RouterClient<typeof router> = createORPCClient(
    websocketLink,
  );

  return { fetch: fetchClient, websocket: websocketClient };
};

export const createRouterClient = () => {
  return createORPCRouterClient(router);
};
