import { Quest } from "../../../../lib/qmplayer/funcs";
import { colors } from "../../colors";
import { CANVAS_PADDING, JUMP_ARROW_LENGTH, LOCATION_RADIUS } from "../../consts";
import { colorToString, interpolateColor } from "../color";
import { HoverZone, HoverZones } from "../hover";
import { drawArrowEnding, drawJumpArrow } from "./jumps";
import { drawLocation } from "./locations";

interface CanvasSize {
  width: number;
  height: number;
}
export function getCanvasSize(quest: Quest): CanvasSize {
  const width = Math.max(quest.screenSizeX, ...quest.locations.map((l) => l.locX)) + CANVAS_PADDING;
  const height =
    Math.max(quest.screenSizeY, ...quest.locations.map((l) => l.locY)) + CANVAS_PADDING;
  return { width, height };
}
export function updateMainCanvas(ctx: CanvasRenderingContext2D, quest: Quest, zoom: number) {
  const hoverZones: HoverZones = [];

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Locations
  quest.locations.forEach((location) => {
    drawLocation(ctx, hoverZones, location, zoom);
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
      zoom,
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

export function drawHovers(
  context: CanvasRenderingContext2D,
  hoverZone:
    | {
        zone: HoverZone;
        clientX: number;
        clientY: number;
      }
    | undefined,
  isDragging: { x: number; y: number } | undefined,
  zoom: number,
) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  if (hoverZone) {
    const location = hoverZone.zone[3];
    if (location) {
      context.setLineDash(isDragging ? [2, 2] : []);

      context.strokeStyle = "black";
      context.lineWidth = 2;
      context.fillStyle = "none";
      context.beginPath();
      context.arc(location.locX * zoom, location.locY * zoom, LOCATION_RADIUS, 0, 2 * Math.PI);
      context.stroke();
      context.setLineDash([]);

      if (isDragging) {
        context.strokeStyle = "black";
        context.lineWidth = 2;
        context.fillStyle = "none";
        context.beginPath();

        context.arc(isDragging.x, isDragging.y, LOCATION_RADIUS, 0, 2 * Math.PI);
        context.stroke();
      }
    }
    const jumpHover = hoverZone.zone[4];
    if (jumpHover) {
      context.setLineDash(isDragging ? [5, 2] : []);
      const LUT = jumpHover[2].LUT;
      const startColor = jumpHover[2].startColor;
      const endColor = jumpHover[2].endColor;
      context.lineWidth = 4;
      for (let i = 1; i < LUT.length; i++) {
        context.beginPath();
        context.moveTo(LUT[i - 1].x, LUT[i - 1].y);
        context.strokeStyle = colorToString(interpolateColor(startColor, endColor, i / LUT.length));
        context.lineTo(LUT[i].x, LUT[i].y);
        context.stroke();
      }
      context.setLineDash([]);

      context.lineWidth = 4;
      context.strokeStyle = colorToString(endColor);
      if (LUT.length > 0) {
        // This might happen if distance between locations is too short
        drawArrowEnding(
          context,
          LUT[LUT.length - 1].x,
          LUT[LUT.length - 1].y,
          jumpHover[2].endLoc.locX,
          jumpHover[2].endLoc.locY,
          JUMP_ARROW_LENGTH * 3,
        );
      }

      if (isDragging) {
        context.strokeStyle = "black";
        context.lineWidth = 1;
        context.fillStyle = "none";
        context.beginPath();

        const isBegining = jumpHover[1];

        const startX = isBegining ? isDragging.x : jumpHover[2].startLoc.locX;
        const startY = isBegining ? isDragging.y : jumpHover[2].startLoc.locY;
        context.moveTo(startX, startY);

        const endX = isBegining ? jumpHover[2].endLoc.locX : isDragging.x;
        const endY = isBegining ? jumpHover[2].endLoc.locY : isDragging.y;

        context.lineTo(endX, endY);
        context.stroke();

        drawArrowEnding(
          context,
          endX,
          endY,
          endX - startX + endX,
          endY - startY + endY,
          JUMP_ARROW_LENGTH * 3,
        );
      }
    }
  }
}
