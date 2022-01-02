import { DeepImmutable } from "../../../lib/qmplayer/deepImmutable";
import { Jump, JumpId, Location, LocationId } from "../../../lib/qmreader";

export type HoverZone = [
  x: number,
  y: number,
  radius: number,
  location: DeepImmutable<Location> | null,
  jump: [jump: DeepImmutable<Jump>, isBeginning: boolean] | null,
];

export type HoverZones = HoverZone[];
