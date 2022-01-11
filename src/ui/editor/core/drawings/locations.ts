import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Location } from "../../../../lib/qmreader";
import { colors } from "../../colors";
import { JUMP_END_LOCATION_RADIUS, LOCATION_RADIUS } from "../../consts";
import { HoverZones } from "../hover";

export function drawLocation(
  ctx: CanvasRenderingContext2D,
  hoverZones: HoverZones,
  location: DeepImmutable<Location>,
  zoom: number,
) {
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  const color = location.isStarting
    ? colors.location.starting
    : location.isEmpty
    ? colors.location.empty
    : location.isSuccess
    ? colors.location.final
    : location.isFaily || location.isFailyDeadly
    ? colors.location.fail
    : colors.location.intermediate;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(location.locX * zoom, location.locY * zoom, LOCATION_RADIUS, 0, 2 * Math.PI);

  ctx.fill();

  hoverZones.push([
    location.locX * zoom,
    location.locY * zoom,
    Math.max(LOCATION_RADIUS, JUMP_END_LOCATION_RADIUS),
    location,
    null,
  ]);
}
