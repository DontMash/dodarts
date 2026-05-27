import type { TossEventMap } from "./toss/toss.event.ts";

export type EventMap = TossEventMap;

export interface Emitter {
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void;
  once<K extends keyof EventMap>(
    event: K,
    listener: (payload: EventMap[K]) => void,
  ): void;
}

export type { TossEventMap };
