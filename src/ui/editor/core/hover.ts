import { JumpId, LocationId } from "../../../lib/qmreader";

export type HoverZone = [
  x: number,
  y: number,
  radius: number,
  locationId: LocationId | null,
  jumpId: JumpId | null,
];

export type HoverZones = HoverZone[];
