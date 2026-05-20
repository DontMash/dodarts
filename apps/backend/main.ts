import { handler, websocketHandler } from "@dodarts/api";
import { createRouterClient } from "@dodarts/api/client";
import { Hono } from "hono";

import { AutodartsMessage } from "@/utils/autodarts.ts";

const client = createRouterClient();
const socket = new WebSocket("ws://autodarts.local:3180/api/events");
socket.addEventListener("message", async (event) => {
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
});

const app = new Hono();

app.use("/api/*", async (c, next) => {
  const context = {};

  if (c.req.header("Upgrade") === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(c.req.raw);
    socket.addEventListener("open", () => console.log("Hello"));
    socket.addEventListener("close", () => console.log("Bye"));

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

Deno.serve(app.fetch);
