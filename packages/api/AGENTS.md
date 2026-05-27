# packages/api (@dodarts/api)

ORPC router, HTTP/WebSocket handlers, typed client factory.

## Architecture notes

- ORPC (`@orpc/server`) over Hono.
- HTTP fetch and WebSocket upgrade handlers exported from `mod.ts`.
- The `subscribe` procedure uses event iterators over WebSocket.
