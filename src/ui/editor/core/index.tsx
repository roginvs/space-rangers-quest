import classNames from "classnames";
import * as React from "react";
import { assertNever } from "../../../lib/formula/calculator";
import { DeepImmutable } from "../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../lib/qmplayer/funcs";
import { Jump, Location } from "../../../lib/qmreader";
import { colors } from "../colors";
import {
  CANVAS_PADDING,
  JUMPS_CONTROL_POINT_DISTANCE,
  JUMPS_LOOP_CONTROL_POINT_DISTANCE,
  LOCATION_RADIUS,
} from "../consts";

export interface EditorCoreProps {
  quest: Quest;
  onChange: (newQuest: Quest) => void;
  //onExit: () => void,
}

export const EDITOR_MODES = ["select", "move", "newLocation", "newJump", "remove"] as const;
export type EditorMode = typeof EDITOR_MODES[number];

function isDistanceLower(x1: number, y1: number, x2: number, y2: number, distance: number) {
  return (x1 - x2) ** 2 + (y1 - y2) ** 2 < distance ** 2;
}

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

  return [controlPoint1, controlPoint2] as const;
}

type Hovered = null | DeepImmutable<Location> | DeepImmutable<Jump>;
export function EditorCore({ quest, onChange }: EditorCoreProps) {
  const [mode, setMode] = React.useState<EditorMode>("select");

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const contextRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const mouseXref = React.useRef(0);
  const mouseYref = React.useRef(0);
  const hoveredRef = React.useRef<Hovered>(null);

  const canvasWidth = Math.max(...quest.locations.map(l => l.locX)) + CANVAS_PADDING;
  const canvasHeight = Math.max(...quest.locations.map(l => l.locY)) + CANVAS_PADDING;

  const drawOnCanvas = React.useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx) {
      return;
    }
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    //console.info("draw");
    const mouseX = mouseXref.current;
    const mouseY = mouseYref.current;

    let newHovered: Hovered = null;

    // Locations
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    quest.locations.forEach(location => {
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
      //ctx.stroke();

      if (!newHovered) {
        if (isDistanceLower(location.locX, location.locY, mouseX, mouseY, LOCATION_RADIUS)) {
          newHovered = location;
          ctx.stroke();
        }
      }

      ctx.fill();
    });

    // Jumps
    ctx.strokeStyle = colors.jump.line;
    ctx.lineWidth = 1;
    quest.jumps.forEach(jump => {
      const startLoc = quest.locations.find(loc => loc.id === jump.fromLocationId);
      const endLoc = quest.locations.find(loc => loc.id === jump.toLocationId);
      if (!endLoc || !startLoc) {
        console.warn(`No loc from jump id=${jump.id}`);
        return;
      }

      const allJumpsBetweenThisLocations = quest.jumps
        .filter(
          candidate =>
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

      const [controlPoint1, controlPoint2] = getControlPoints(
        startLoc,
        endLoc,
        myIndex,
        allJumpsCount,
      );

      ctx.moveTo(startLoc.locX, startLoc.locY);
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
    });

    if (canvasRef.current) {
      canvasRef.current.style.cursor = newHovered ? "pointer" : "";
    }
    hoveredRef.current = newHovered;
  }, [quest, canvasWidth, canvasHeight]);

  React.useEffect(() => drawOnCanvas(), [drawOnCanvas]);

  React.useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    const onMove = (e: MouseEvent) => {
      mouseXref.current = e.pageX - canvas.offsetLeft;
      mouseYref.current = e.pageY - canvas.offsetTop;
      drawOnCanvas();
    };
    document.addEventListener("mousemove", onMove);

    return () => {
      document.removeEventListener("mousemove", onMove);
    };
  }, []);

  React.useEffect(() => {
    if (!contextRef.current) {
      return;
    }
    const context = contextRef.current;
  }, [quest]);

  console.info(`Editor re-render`);

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div>
        {EDITOR_MODES.map(candidateMode => (
          <button
            key={candidateMode}
            className={classNames("btn", mode === candidateMode ? "btn-info" : "btn-light")}
            onClick={() => setMode(candidateMode)}
          >
            {candidateMode === "move" ? (
              <i className="fa fa-arrows" title="Двигать (2)" />
            ) : candidateMode === "select" ? (
              <i className="fa fa-mouse-pointer" title="Выделять (1)" />
            ) : candidateMode === "newJump" ? (
              <i className="fa fa-arrows-h" title="Новый переход (4)" />
            ) : candidateMode === "newLocation" ? (
              <i className="fa fa-circle" title="Новая локация (3)" />
            ) : candidateMode === "remove" ? (
              <i className="fa fa-remove" title="Удалить (5)" />
            ) : (
              assertNever(candidateMode)
            )}
          </button>
        ))}
        <span className="mx-2" />
        {/*
    <button className="btn btn-light" disabled={!store.canUndo} onClick={() => store.undo()}>
      <i className="fa fa-undo" />
    </button>
    <button className="btn btn-light" disabled={!store.canRedo} onClick={() => store.redo()}>
      <i className="fa fa-undo fa-flip-horizontal" />
    </button>
    */}
      </div>
      <div
        style={{
          flexGrow: 1,
          alignSelf: "stretch",
          overflow: "scroll",
        }}
      >
        <canvas
          width={canvasWidth}
          height={canvasHeight}
          ref={element => {
            canvasRef.current = element;
            if (element && !contextRef.current) {
              const context = element.getContext("2d");
              contextRef.current = context;
            }
            if (!element && contextRef.current) {
              contextRef.current = null;
            }
          }}
        />
      </div>
    </div>
  );
}
