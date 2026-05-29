import type { Database } from "@dodarts/database";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { RPCLink as WebsocketRPCLink } from "@orpc/client/websocket";
import type { RouterClient } from "@orpc/server";
import { createRouterClient as createORPCRouterClient } from "@orpc/server";
import { WebSocket } from "partysocket";

import type { Emitter } from "./emitter.ts";
import router from "./router.ts";

interface ClientOptions {
  fetchUrl?: string;
  websocketUrl?: string;
}

function createClient(options: { fetchUrl: string }): {
  fetch: RouterClient<typeof router>;
};
function createClient(options: { websocketUrl: string }): {
  websocket: RouterClient<typeof router>;
};
function createClient(options: { fetchUrl: string; websocketUrl: string }): {
  fetch: RouterClient<typeof router>;
  websocket: RouterClient<typeof router>;
};
function createClient(
  options: ClientOptions,
): Partial<Record<"fetch" | "websocket", RouterClient<typeof router>>>;
function createClient(options: ClientOptions) {
  const { fetchUrl, websocketUrl } = options;
  if (!fetchUrl && !websocketUrl) {
    throw new Error(
      "At least one of fetchUrl or websocketUrl must be provided",
    );
  }

  const result: Partial<
    Record<"fetch" | "websocket", RouterClient<typeof router>>
  > = {};

  if (fetchUrl) {
    const link = new RPCLink({ url: fetchUrl });
    result.fetch = createORPCClient(link) as unknown as RouterClient<
      typeof router
    >;
  }

  if (websocketUrl) {
    const websocket = new WebSocket(websocketUrl, [], {
      maxRetries: 5,
      minReconnectionDelay: 1000,
    });
    const link = new WebsocketRPCLink({ websocket });
    result.websocket = createORPCClient(link) as unknown as RouterClient<
      typeof router
    >;
  }

  return result;
}

const createRouterClient = (options: { db: Database; emitter: Emitter }) => {
  return createORPCRouterClient(router, { context: options });
};

export { createClient, createRouterClient };
