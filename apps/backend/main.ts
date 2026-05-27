import { handler, websocketHandler } from "@dodarts/api";
import { createRouterClient } from "@dodarts/api/client";
import type { Emitter } from "@dodarts/api/emitter";
import { create as createDb, type Database } from "@dodarts/database";
import { Hono } from "hono";
import EventEmitter from "node:events";
import { WebSocket } from "partysocket";

import { env } from "@/env.ts";
import { AutodartsMessage } from "@/utils/autodarts.ts";

type Client = ReturnType<typeof createRouterClient>;

export async function handleMessage(
  event: MessageEvent,
  client: Client,
) {
  const value = JSON.parse(event.data) as AutodartsMessage;
  switch (value.type) {
    case "state": {
      if (value.data.event !== "Throw detected") {
        break;
      }
      const tosses = value.data.throws;
      if (!tosses || tosses.length < 1) {
        break;
      }
      const toss = tosses.at(-1);
      if (!toss) {
        break;
      }
      try {
        await client.toss.create({
          // deno-lint-ignore no-explicit-any
          name: toss.segment.name as any,
          // deno-lint-ignore no-explicit-any
          segment: toss.segment.bed as any,
          value: toss.segment.number,
          multiplier: toss.segment.multiplier,
          coords: toss.coords,
        });
      } catch (err) {
        console.error("Failed to insert toss:", err);
      }
      break;
    }

    case "motion_state":
    case "stats":
    case "cam_stats":
      break;
  }
}

function connectAutodarts(
  client: Client,
  maxRetries = 5,
) {
  const options = {
    connectionTimeout: 1000,
    maxRetries,
  };
  const socket = new WebSocket(
    "ws://autodarts.local:3180/api/events",
    [],
    options,
  );

  socket.addEventListener("open", () => {
    console.info("[Autodarts] Connection opened");
  });
  socket.addEventListener("message", (event) => handleMessage(event, client));
  socket.addEventListener("error", () => {
    console.error("[Autodarts] Connection error");
  });
  socket.addEventListener("close", () => {
    console.info("[Autodarts] Connection closed");
  });
}

export function createApp(context: { db: Database; emitter: Emitter }) {
  const hono = new Hono();

  hono.use("/api/*", async (c, next) => {
    if (c.req.header("Upgrade") === "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(c.req.raw);

      websocketHandler.upgrade(socket, {
        context,
      });

      return c.newResponse(response.body, response);
    }

    const { matched, response } = await handler.handle(c.req.raw, {
      prefix: "/api",
      context,
    });

    if (matched) {
      return c.newResponse(response.body, response);
    }

    await next();
  });

  return hono;
}

if (import.meta.main) {
  const db = createDb(env.DATABASE_URL);
  const emitter: Emitter = new EventEmitter();
  const client = createRouterClient({ db, emitter });
  const app = createApp({ db, emitter });

  connectAutodarts(client);
  Deno.serve(app.fetch);
}
