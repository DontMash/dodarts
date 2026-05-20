import { tossCreateSchema } from "../../../packages/api/toss/toss.schema.ts";

export type AutodartsMessage =
  | AutodartsStateMessage
  | AutodartsMotionStateMessage
  | AutodartsStatsMessage
  | AutodartsCamStatsMessage;
type AutodartsStateMessage = {
  data: {
    connected: boolean;
    running: boolean;
    status:
      | "Throw"
      | "Takeout"
      | "Takeout in progress"
      | "Calibration"
      | "Starting"
      | "Stopping"
      | "Stopped";
    event:
      | "Throw detected"
      | "Takeout started"
      | "Takeout finished"
      | "Calibration started"
      | "Calibration finished"
      | "Starting"
      | "Started"
      | "Stopping"
      | "Stopped"
      | "Manual reset";
    numThrows: number;
    throws?: Array<AutodartsToss>;
  };
  type: "state";
};
type AutodartsMotionStateMessage = {
  data: {
    darts: number;
    camStates: Array<AutodartsCamState>;
    class: number;
    timings: {
      copy: number;
      diff: number;
      count: number;
      takeout: number;
      state: number;
      ret: number;
      total: number;
    };
    isWaiting: boolean;
    isStable: boolean;
    isDart: boolean;
    isHand: boolean;
    isTakeoutPartial: boolean;
    isTakeoutFull: boolean;
    frameCounts: {
      stable: number;
      dart: number;
      hand: number;
      takeout: number;
      wait: number;
    };
    frameFlags: { dart: boolean; hand: boolean; takeout: boolean };
  };
  type: "motion_state";
};
type AutodartsStatsMessage = {
  data: {
    resolution: { width: number; height: number };
    fps: number;
  };
  type: "stats";
};
type AutodartsCamStatsMessage = {
  data: {
    id: number;
    fps: number;
    resolution: { width: number; height: number; framerates: number | null };
  };
  type: "cam_stats";
};

type AutodartsToss = {
  segment: AutodartsSegment;
  coords: AutodartsCoords;
};
type AutodartsSegment = {
  name: string;
  number: number;
  bed: string;
  multiplier: number;
};
type AutodartsCoords = {
  x: number | null;
  y: number | null;
};
type AutodartsCamState = {
  backgroundPixels: number;
  boardPixels: number;
  dartBackgroundPixels: number;
  dartPixels: number;
  takeoutBackgroundPixels: number;
  takeoutPixels: number;
  isStable: boolean;
  isHand: boolean;
  isDart: boolean;
  isTakeout: boolean;
};

export function mapAutodartsToss(toss: AutodartsToss) {
  return tossCreateSchema.parse({
    name: toss.segment.name,
    segment: toss.segment.bed,
    value: toss.segment.number,
    multiplier: toss.segment.multiplier,
    coords_x: toss.coords.x,
    coords_y: toss.coords.y,
  });
}
