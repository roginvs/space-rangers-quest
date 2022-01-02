import { Quest } from "../../../lib/qmplayer/funcs";
import { LOCATION_RADIUS } from "../consts";

export function isDistanceLower(x1: number, y1: number, x2: number, y2: number, distance: number) {
  return (x1 - x2) ** 2 + (y1 - y2) ** 2 < distance ** 2;
}

export function snapToGrid(quest: Quest, x: number, y: number) {
  const gridX = Math.floor(quest.screenSizeX / quest.widthSize);
  const gridY = Math.floor(quest.screenSizeY / quest.heightSize);
  const grixXoffset = Math.floor(gridX / 2);
  const grixYoffset = Math.floor(gridY / 2);
  return {
    x: Math.round((x - grixXoffset) / gridX) * gridX + grixXoffset,
    y: Math.round((y - grixYoffset) / gridY) * gridY + grixYoffset,
  };
}

export function isLocationAtThisPosition(quest: Quest, x: number, y: number) {
  return quest.locations.find((location) =>
    isDistanceLower(x, y, location.locX, location.locY, LOCATION_RADIUS),
  );
}

export function range(n: number) {
  return new Array(n).fill(0).map((zero, index) => index);
}
