import type { SessionEventMap } from "./session/session.event.ts";
import type { TossEventMap } from "./toss/toss.event.ts";

export type EventMap = TossEventMap & SessionEventMap;

export interface Emitter {
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void;
  once<K extends keyof EventMap>(
    event: K,
    listener: (payload: EventMap[K]) => void,
  ): void;
  on<K extends keyof EventMap>(
    event: K,
    listener: (payload: EventMap[K]) => void,
  ): void;
  off<K extends keyof EventMap>(
    event: K,
    listener: (payload: EventMap[K]) => void,
  ): void;
}

export type { TossEventMap };
export type { SessionEventMap };
