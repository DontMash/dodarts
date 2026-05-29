import { handler, websocketHandler } from "@dodarts/api";
import { createRouterClient } from "@dodarts/api/client";
import type { Emitter } from "@dodarts/api/emitter";
import type { Session } from "@dodarts/api";
import { create as createDb, type Database, migrate } from "@dodarts/database";
import { Hono } from "hono";
import EventEmitter from "node:events";
import { WebSocket } from "partysocket";

import { env } from "@/env.ts";
import { AutodartsMessage } from "@/utils/autodarts.ts";

type Client = ReturnType<typeof createRouterClient>;

let activeSessionId: string | null = null;
let autodartsSocket: WebSocket | null = null;

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

      if (activeSessionId === null) {
        console.warn(
          "[Autodarts] Received throw but no active session — skipping",
        );
        break;
      }

      try {
        await client.toss.create({
          sessionId: activeSessionId,
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

export function connectAutodarts(
  client: Client,
  maxRetries = 5,
) {
  const options = {
    connectionTimeout: 1000,
    maxRetries,
  };
  autodartsSocket = new WebSocket(
    "ws://autodarts.local:3180/api/events",
    [],
    options,
  );

  autodartsSocket.addEventListener("open", async () => {
    console.info("[Autodarts] Connection opened");

    await fetch("http://autodarts.local:3180/api/start", { method: "PUT" });
    await fetch("http://autodarts.local:3180/api/reset", { method: "POST" });
  });
  autodartsSocket.addEventListener(
    "message",
    (event) => handleMessage(event, client),
  );
  autodartsSocket.addEventListener("error", () => {
    console.error("[Autodarts] Connection error");
  });
  autodartsSocket.addEventListener("close", async () => {
    console.info("[Autodarts] Connection closed");

    await fetch("http://autodarts.local:3180/api/stop", { method: "PUT" });
    autodartsSocket = null;
  });
}

export function disconnectAutodarts() {
  if (autodartsSocket) {
    autodartsSocket.close();
    autodartsSocket = null;
  }
}

export function setActiveSession(session: Session | null) {
  activeSessionId = session?.id ?? null;
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

  console.info("[Database] Running migrations...");
  await migrate(db, env.MIGRATIONS_PATH);
  console.info("[Database] Migrations complete");

  const emitter: Emitter = new EventEmitter();
  const client = createRouterClient({ db, emitter });
  const app = createApp({ db, emitter });

  emitter.once("session:started", (session: Session) => {
    setActiveSession(session);
    connectAutodarts(client);
  });

  emitter.once("session:ended", (_session: Session) => {
    setActiveSession(null);
    disconnectAutodarts();
  });

  (async () => {
    const session = await client.session.active();
    if (session) {
      setActiveSession(session);
      connectAutodarts(client);
    }
  })();

  Deno.serve(app.fetch);
}
