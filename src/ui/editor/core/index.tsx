import classNames from "classnames";
import * as React from "react";
import { assertNever } from "../../../lib/formula/calculator";
import { DeepImmutable } from "../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../lib/qmplayer/funcs";
import { Jump, Location } from "../../../lib/qmreader";
import { colors } from "../colors";
import { CANVAS_PADDING, LOCATION_RADIUS } from "../consts";
import { drawJumpArrow, drawLocation } from "./drawings";

export interface EditorCoreProps {
  quest: Quest;
  onChange: (newQuest: Quest) => void;
  //onExit: () => void,
}

// tslint:disable-next-line:no-useless-cast
export const EDITOR_MODES = ["select", "move", "newLocation", "newJump", "remove"] as const;
export type EditorMode = typeof EDITOR_MODES[number];

function isDistanceLower(x1: number, y1: number, x2: number, y2: number, distance: number) {
  return (x1 - x2) ** 2 + (y1 - y2) ** 2 < distance ** 2;
}

type Hovered = null | DeepImmutable<Location> | DeepImmutable<Jump>;
export function EditorCore({ quest, onChange }: EditorCoreProps) {
  const [mode, setMode] = React.useState<EditorMode>("select");

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const contextRef = React.useRef<CanvasRenderingContext2D | null>(null);

  const canvasWidth = Math.max(...quest.locations.map((l) => l.locX)) + CANVAS_PADDING;
  const canvasHeight = Math.max(...quest.locations.map((l) => l.locY)) + CANVAS_PADDING;

  const drawOnCanvas = React.useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx) {
      return;
    }
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Locations
    quest.locations.forEach((location) => {
      drawLocation(ctx, location);
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

      drawJumpArrow(ctx, [255, 255, 255], [0, 0, 255], startLoc, endLoc, myIndex, allJumpsCount);
    });
  }, [quest, canvasWidth, canvasHeight]);

  React.useEffect(() => drawOnCanvas(), [drawOnCanvas]);

  React.useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    //const canvas = canvasRef.current;
    const onMove = (e: MouseEvent) => {
      //const mouseX = e.pageX - canvas.offsetLeft;
      //const mouseX = e.pageY - canvas.offsetTop;
      // drawOnCanvas();
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
    // const context = contextRef.current;
  }, [quest]);

  console.info(`Editor re-render`);

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div>
        {EDITOR_MODES.map((candidateMode) => (
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
          ref={(element) => {
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
