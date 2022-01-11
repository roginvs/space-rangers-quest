import { Bezier } from "bezier-js";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../../lib/qmplayer/funcs";
import { Jump, JumpId, Location } from "../../../../lib/qmreader";
import { colors } from "../../colors";
import {
  CANVAS_PADDING,
  JUMPS_CONTROL_POINT_DISTANCE,
  JUMPS_LOOP_CONTROL_POINT_DISTANCE,
  JUMP_ARROW_LENGTH,
  JUMP_END_LOCATION_RADIUS,
  JUMP_HOVER_ZONE_WIDTH,
  LOCATION_RADIUS,
} from "../../consts";
import { Color, colorToString, interpolateColor } from "../color";
import { HoverDrawJump, HoverZones, LocationLocationOnly } from "../hover";

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

function rotateVector(x: number, y: number, radians: number) {
  return {
    x: x * Math.cos(radians) - y * Math.sin(radians),
    y: x * Math.sin(radians) + y * Math.cos(radians),
  };
}

export function drawArrowEnding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pointToX: number,
  pointToY: number,
  size: number,
) {
  const backVectorNotNormalizedX = x - pointToX;
  const backVectorNotNormalizedY = y - pointToY;

  const backVectorLength = Math.hypot(backVectorNotNormalizedX, backVectorNotNormalizedY);

  const backVectorX = (backVectorNotNormalizedX * size) / backVectorLength;
  const backVectorY = (backVectorNotNormalizedY * size) / backVectorLength;

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

function getJumpLookupTable(
  startLoc: LocationLocationOnly,
  endLoc: LocationLocationOnly,
  myIndex: number,
  allJumpsCount: number,
) {
  const controlPoints = getControlPoints(startLoc, endLoc, myIndex, allJumpsCount);
  const controlPoint1 = controlPoints[0];
  const controlPoint2 = controlPoints[1];
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
  return LUT;
}

function getJumpArrowColors(
  jump: DeepImmutable<Jump>,
  myIndex: number,
  allJumpsCount: number,
  haveOtherJumpsWithSameText: boolean,
) {
  const jumpColors = !jump.text
    ? colors.jump.empty
    : haveOtherJumpsWithSameText
    ? jump.description
      ? colors.jump.sameTextWithDescription
      : colors.jump.sameTextWithoutDescription
    : jump.description
    ? colors.jump.withDescription
    : colors.jump.withoutDescription;

  return [jumpColors.begin, jumpColors.end];
}

export function drawJumpArrow(
  ctx: CanvasRenderingContext2D,
  hoverZones: HoverZones,
  jump: DeepImmutable<Jump>,
  startLoc: LocationLocationOnly,
  endLoc: LocationLocationOnly,
  myIndex: number,
  allJumpsCount: number,
  haveOtherJumpsWithSameText: boolean,
  zoom: number,
) {
  const [startColor, endColor] = getJumpArrowColors(
    jump,
    myIndex,
    allJumpsCount,
    haveOtherJumpsWithSameText,
  );

  const LUT = getJumpLookupTable(
    {
      locX: startLoc.locX * zoom,
      locY: startLoc.locY * zoom,
    },
    {
      locX: endLoc.locX * zoom,
      locY: endLoc.locY * zoom,
    },
    myIndex,
    allJumpsCount,
  );
  ctx.lineWidth = 1;

  const hoverDraw: HoverDrawJump = {
    LUT,
    startColor,
    endColor,
    startLoc: {
      locX: startLoc.locX * zoom,
      locY: startLoc.locY * zoom,
    },
    endLoc: {
      locX: endLoc.locX * zoom,
      locY: endLoc.locY * zoom,
    },
  };

  for (let i = 1; i < LUT.length; i++) {
    ctx.beginPath();
    ctx.moveTo(LUT[i - 1].x, LUT[i - 1].y);
    ctx.strokeStyle = colorToString(interpolateColor(startColor, endColor, i / LUT.length));
    ctx.lineTo(LUT[i].x, LUT[i].y);
    ctx.stroke();
    // ctx.fillStyle = colorToString(interpolateColor(startColor, endColor, i / LUT.length));
    // ctx.fillRect(LUT[i].x, LUT[i].y, 4, 4);

    hoverZones.push([
      LUT[i].x,
      LUT[i].y,
      JUMP_HOVER_ZONE_WIDTH,
      null,
      [jump, i < LUT.length / 2, hoverDraw],
    ]);
  }

  ctx.strokeStyle = colorToString(endColor);
  if (LUT.length > 0) {
    // This might happen if distance between locations is too short
    drawArrowEnding(
      ctx,
      LUT[LUT.length - 1].x,
      LUT[LUT.length - 1].y,
      endLoc.locX * zoom,
      endLoc.locY * zoom,
      JUMP_ARROW_LENGTH,
    );
  }
}
