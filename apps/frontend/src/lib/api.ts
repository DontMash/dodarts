import { createClient } from "@dodarts/api/client";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/api";

export const api = createClient({ websocketUrl: WS_URL }).websocket;

export type Toss = Awaited<ReturnType<typeof api.toss.read>>;
