import { Bezier } from "bezier-js";
import { JUMPS_CONTROL_POINT_DISTANCE, JUMPS_LOOP_CONTROL_POINT_DISTANCE } from "../consts";

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

export function drawJumpArrow(
  ctx: CanvasRenderingContext2D,
  startColor: Color,
  endColor: Color,
  startLoc: LocationLocationOnly,
  endLoc: LocationLocationOnly,
  myIndex: number,
  allJumpsCount: number,
) {
  ctx.strokeStyle = colorToString(startColor);

  const [controlPoint1, controlPoint2] = getControlPoints(startLoc, endLoc, myIndex, allJumpsCount);

  ctx.moveTo(startLoc.locX, startLoc.locY);

  const b = new Bezier(
    controlPoint1.x,
    controlPoint1.y,
    controlPoint2 ? controlPoint2.x : endLoc.locX,
    controlPoint2 ? controlPoint2.y : endLoc.locY,
    endLoc.locX,
    endLoc.locY,
  );

  if (!controlPoint2) {
    // Let's use bezierCurveTo for this line
    // ctx.quadraticCurveTo(controlPoint1.x, controlPoint1.y, endLoc.locX, endLoc.locY);
    ctx.bezierCurveTo(
      controlPoint1.x,
      controlPoint1.y,
      endLoc.locX,
      endLoc.locY,
      endLoc.locX,
      endLoc.locY,
    );
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
}
