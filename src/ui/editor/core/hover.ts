import { DeepImmutable } from "../../../lib/qmplayer/deepImmutable";
import { Jump, JumpId, Location, LocationId } from "../../../lib/qmreader";
import { Color } from "./color";

export interface HoverDrawJump {
  LUT: { x: number; y: number }[];
  startColor: Color;
  endColor: Color;
}

export type HoverZone = [
  x: number,
  y: number,
  radius: number,
  location: DeepImmutable<Location> | null,
  jump: [jump: DeepImmutable<Jump>, isBeginning: boolean, hoverDraw: HoverDrawJump] | null,
];

export type HoverZones = HoverZone[];
