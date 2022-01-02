import { Quest } from "../../../../lib/qmplayer/funcs";
import { colors } from "../../colors";
import { CANVAS_PADDING } from "../../consts";
import { HoverZones } from "../hover";
import { drawJumpArrow } from "./jumps";
import { drawLocation } from "./locations";

export function getCanvasSize(quest: Quest) {
  const canvasWidth = Math.max(...quest.locations.map((l) => l.locX)) + CANVAS_PADDING;
  const canvasHeight = Math.max(...quest.locations.map((l) => l.locY)) + CANVAS_PADDING;
  return { canvasWidth, canvasHeight };
}
export function updateMainCanvas(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  quest: Quest,
) {
  const hoverZones: HoverZones = [];

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Locations
  quest.locations.forEach((location) => {
    drawLocation(ctx, hoverZones, location);
  });

  // Jumps
  quest.jumps.forEach((jump) => {
    const startLoc = quest.locations.find((loc) => loc.id === jump.fromLocationId);
    const endLoc = quest.locations.find((loc) => loc.id === jump.toLocationId);
    if (!endLoc || !startLoc) {
      console.warn(`No loc from jump id=${jump.id}`);
      return;
    }

    const allJumpsBetweenThisLocations = quest.jumps
      .filter(
        (candidate) =>
          (candidate.fromLocationId === jump.fromLocationId &&
            candidate.toLocationId === jump.toLocationId) ||
          (candidate.fromLocationId === jump.toLocationId &&
            candidate.toLocationId === jump.fromLocationId),
      )
      .sort((a, b) => {
        return a.fromLocationId > b.fromLocationId
          ? 1
          : a.fromLocationId < b.fromLocationId
          ? -1
          : a.showingOrder - b.showingOrder;
      });
    const allJumpsCount = allJumpsBetweenThisLocations.length;
    const myIndex = allJumpsBetweenThisLocations.indexOf(jump);
    const haveOtherJumpsWithSameText =
      allJumpsBetweenThisLocations.filter((candidate) => jump.text === candidate.text).length > 1;

    drawJumpArrow(
      ctx,
      hoverZones,
      jump,
      startLoc,
      endLoc,
      myIndex,
      allJumpsCount,
      haveOtherJumpsWithSameText,
    );
  });

  const DRAW_DEBUG_HOVER_ZONES = false;
  if (DRAW_DEBUG_HOVER_ZONES) {
    for (const hoverZone of hoverZones) {
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.fillStyle = "none";
      ctx.beginPath();
      ctx.arc(hoverZone[0], hoverZone[1], hoverZone[2], 0, 2 * Math.PI);
      ctx.stroke();
    }
    console.info(`hoverZones: ${hoverZones.length}`);
  }

  return hoverZones;
}
