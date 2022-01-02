import { Bezier } from "bezier-js";
import { DeepImmutable } from "../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../lib/qmplayer/funcs";
import { JumpId, Location } from "../../../lib/qmreader";
import { colors } from "../colors";
import {
  CANVAS_PADDING,
  JUMPS_CONTROL_POINT_DISTANCE,
  JUMPS_LOOP_CONTROL_POINT_DISTANCE,
  JUMP_ARROW_LENGTH,
  JUMP_END_LOCATION_RADIUS,
  JUMP_HOVER_ZONE_WIDTH,
  LOCATION_RADIUS,
} from "../consts";
import { HoverZones } from "./hover";

interface LocationLocationOnly {
  locX: number;
  locY: number;
}
function getControlPoints(
  startLoc: LocationLocationOnly,
  endLoc: LocationLocationOnly,
  myIndex: number,
  allJumpsCount: number,
) {
  const orientationIsNormal =
    endLoc.locX !== startLoc.locX
      ? endLoc.locX - startLoc.locX > 0
      : endLoc.locY - startLoc.locY > 0;
  const startX = orientationIsNormal ? startLoc.locX : endLoc.locX;
  const endX = orientationIsNormal ? endLoc.locX : startLoc.locX;
  const startY = orientationIsNormal ? startLoc.locY : endLoc.locY;
  const endY = orientationIsNormal ? endLoc.locY : startLoc.locY;

  const middleVectorX = (endX - startX) / 2;
  const middleVectorY = (endY - startY) / 2;
  const middleX = startX + middleVectorX;
  const middleY = startY + middleVectorY;
  const offsetVectorUnnormalizedX = middleVectorY;
  const offsetVectorUnnormalizedY = -middleVectorX;
  const offsetVectorLength = Math.sqrt(
    offsetVectorUnnormalizedX * offsetVectorUnnormalizedX +
      offsetVectorUnnormalizedY * offsetVectorUnnormalizedY,
  );

  const isBetweenTwoPoints = offsetVectorLength > 0;
  const offsetVectorX = isBetweenTwoPoints
    ? (offsetVectorUnnormalizedX / offsetVectorLength) * JUMPS_CONTROL_POINT_DISTANCE
    : 0;
  const offsetVectorY = isBetweenTwoPoints
    ? (offsetVectorUnnormalizedY / offsetVectorLength) * JUMPS_CONTROL_POINT_DISTANCE
    : 0;

  const offsetVectorCount = myIndex;

  const shiftMultiplier = allJumpsCount > 1 ? (allJumpsCount - 1) / 2 : 0;
  const controlPointX =
    middleX + offsetVectorX * offsetVectorCount - offsetVectorX * shiftMultiplier;
  const controlPointY =
    middleY + offsetVectorY * offsetVectorCount - offsetVectorY * shiftMultiplier;
  const controlPoint1 = isBetweenTwoPoints
    ? {
        x: controlPointX,
        y: controlPointY,
      }
    : {
        x: startLoc.locX + JUMPS_LOOP_CONTROL_POINT_DISTANCE,
        y:
          startLoc.locY -
          JUMPS_LOOP_CONTROL_POINT_DISTANCE -
          (myIndex * JUMPS_CONTROL_POINT_DISTANCE) / 2,
      };
  const controlPoint2 = isBetweenTwoPoints
    ? undefined
    : {
        x: startLoc.locX - JUMPS_LOOP_CONTROL_POINT_DISTANCE,
        y:
          startLoc.locY -
          JUMPS_LOOP_CONTROL_POINT_DISTANCE -
          (myIndex * JUMPS_CONTROL_POINT_DISTANCE) / 2,
      };
  // tslint:disable-next-line:no-useless-cast
  return [controlPoint1, controlPoint2] as const;
}

export type Color = [r: number, g: number, b: number];

export function colorToString(color: Color) {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function interpolateColor(c1: Color, c2: Color, t: number): Color {
  return [
    Math.round(c1[0] * (1 - t) + c2[0] * t),
    Math.round(c1[1] * (1 - t) + c2[1] * t),
    Math.round(c1[2] * (1 - t) + c2[2] * t),
  ];
}

function rotateVector(x: number, y: number, radians: number) {
  return {
    x: x * Math.cos(radians) - y * Math.sin(radians),
    y: x * Math.sin(radians) + y * Math.cos(radians),
  };
}

function drawArrowEnding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pointToX: number,
  pointToY: number,
) {
  ctx.strokeStyle = "red";

  const backVectorNotNormalizedX = x - pointToX;
  const backVectorNotNormalizedY = y - pointToY;

  const backVectorLength = Math.hypot(backVectorNotNormalizedX, backVectorNotNormalizedY);

  const backVectorX = (backVectorNotNormalizedX * JUMP_ARROW_LENGTH) / backVectorLength;
  const backVectorY = (backVectorNotNormalizedY * JUMP_ARROW_LENGTH) / backVectorLength;

  const arrow1 = rotateVector(backVectorX, backVectorY, -Math.PI / 8);
  const arrow2 = rotateVector(backVectorX, backVectorY, +Math.PI / 8);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + arrow1.x, y + arrow1.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + arrow2.x, y + arrow2.y);
  ctx.stroke();
}

export function drawJumpArrow(
  ctx: CanvasRenderingContext2D,
  hoverZones: HoverZones,
  startColor: Color,
  endColor: Color,
  startLoc: LocationLocationOnly,
  endLoc: LocationLocationOnly,
  myIndex: number,
  allJumpsCount: number,
  jumpId: JumpId,
) {
  const [controlPoint1, controlPoint2] = getControlPoints(startLoc, endLoc, myIndex, allJumpsCount);

  const bezierOriginal = controlPoint2
    ? new Bezier(
        startLoc.locX,
        startLoc.locY,
        controlPoint1.x,
        controlPoint1.y,
        controlPoint2.x,
        controlPoint2.y,
        endLoc.locX,
        endLoc.locY,
      )
    : new Bezier(
        startLoc.locX,
        startLoc.locY,
        controlPoint1.x,
        controlPoint1.y,
        endLoc.locX,
        endLoc.locY,
      );
  const originalLength = bezierOriginal.length();
  const bezier = bezierOriginal.split(
    (originalLength - JUMP_END_LOCATION_RADIUS) / originalLength,
  ).left;

  const STEPS = Math.round(originalLength / JUMP_HOVER_ZONE_WIDTH);
  const LUT = bezier.getLUT(STEPS);

  for (let i = 1; i < LUT.length; i++) {
    ctx.beginPath();
    ctx.moveTo(LUT[i - 1].x, LUT[i - 1].y);
    ctx.strokeStyle = colorToString(interpolateColor(startColor, endColor, i / LUT.length));
    ctx.lineTo(LUT[i].x, LUT[i].y);
    ctx.stroke();
    ctx.fillStyle = colorToString(interpolateColor(startColor, endColor, i / LUT.length));
    // ctx.fillRect(LUT[i].x, LUT[i].y, 4, 4);

    hoverZones.push([LUT[i].x, LUT[i].y, JUMP_HOVER_ZONE_WIDTH, null, jumpId]);
  }

  drawArrowEnding(ctx, LUT[LUT.length - 1].x, LUT[LUT.length - 1].y, endLoc.locX, endLoc.locY);
}

export function drawLocation(
  ctx: CanvasRenderingContext2D,
  hoverZones: HoverZones,
  location: DeepImmutable<Location>,
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
  ctx.arc(location.locX, location.locY, LOCATION_RADIUS, 0, 2 * Math.PI);

  ctx.fill();

  hoverZones.push([location.locX, location.locY, LOCATION_RADIUS * 2, location.id, null]);
}

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
  ctx.lineWidth = 1;
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

    drawJumpArrow(
      ctx,
      hoverZones,
      [255, 255, 255],
      [0, 0, 255],
      startLoc,
      endLoc,
      myIndex,
      allJumpsCount,
      jump.id,
    );
  });

  const DRAW_DEBUG_HOVER_ZONES = true;
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
