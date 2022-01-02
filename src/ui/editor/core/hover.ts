import { DeepImmutable } from "../../../lib/qmplayer/deepImmutable";
import { Jump, JumpId, Location, LocationId } from "../../../lib/qmreader";
import { Color } from "./color";

/**
 For some reasons I thought that using arrays might be more performant than using objects.
 */

export interface LocationLocationOnly {
  locX: number;
  locY: number;
}
export interface HoverDrawJump {
  LUT: { x: number; y: number }[];
  startColor: Color;
  endColor: Color;
  startLoc: LocationLocationOnly;
  endLoc: LocationLocationOnly;
}

export type HoverZone = [
  x: number,
  y: number,
  radius: number,
  location: DeepImmutable<Location> | null,
  jump: [jump: DeepImmutable<Jump>, isBeginning: boolean, hoverDraw: HoverDrawJump] | null,
];

export type HoverZones = HoverZone[];
