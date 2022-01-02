import { Bezier } from "bezier-js";
import {
  JUMPS_CONTROL_POINT_DISTANCE,
  JUMPS_LOOP_CONTROL_POINT_DISTANCE,
  JUMP_ARROW_LENGTH,
  JUMP_END_LOCATION_RADIUS,
} from "../consts";

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
  console.info(
    backVectorNotNormalizedX,
    backVectorNotNormalizedY,
    JUMP_ARROW_LENGTH,
    backVectorLength,
  );
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
  startColor: Color,
  endColor: Color,
  startLoc: LocationLocationOnly,
  endLoc: LocationLocationOnly,
  myIndex: number,
  allJumpsCount: number,
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

  //const length = bezier.length();
  const STEPS = 15;
  const LUT = bezier.getLUT(STEPS);
  //console.info(LUT);
  //  ctx.moveTo(startLoc.locX, startLoc.locY);
  //ctx.moveTo(LUT[0].x, LUT[0].y);
  for (let i = 1; i < LUT.length; i++) {
    ctx.beginPath();
    ctx.moveTo(LUT[i - 1].x, LUT[i - 1].y);
    ctx.strokeStyle = colorToString(interpolateColor(startColor, endColor, i / LUT.length));
    ctx.lineTo(LUT[i].x, LUT[i].y);
    //
    // ctx.strokeStyle = i < STEPS / 2 ? colorToString(startColor) : colorToString(endColor);
    ctx.stroke();

    ctx.fillStyle = colorToString(interpolateColor(startColor, endColor, i / LUT.length));
    // ctx.fillRect(LUT[i].x, LUT[i].y, 4, 4);
  }

  drawArrowEnding(ctx, LUT[LUT.length - 1].x, LUT[LUT.length - 1].y, endLoc.locX, endLoc.locY);

  /*
  ctx.strokeStyle = colorToString(startColor);

  ctx.moveTo(startLoc.locX, startLoc.locY);
  const grd = ctx.createLinearGradient(startLoc.locX, startLoc.locY, endLoc.locX, endLoc.locY);
  grd.addColorStop(0, "red");
  //grd.addColorStop(0.5, "blue");
  grd.addColorStop(1, "green");
  ///ctx.strokeStyle = grd;

  if (!controlPoint2) {
    ctx.quadraticCurveTo(controlPoint1.x, controlPoint1.y, endLoc.locX, endLoc.locY);
  } else {
    ctx.bezierCurveTo(
      controlPoint1.x,
      controlPoint1.y,
      controlPoint2.x,
      controlPoint2.y,
      endLoc.locX,
      endLoc.locY,
    );
  }
  ctx.stroke();

   */
}
