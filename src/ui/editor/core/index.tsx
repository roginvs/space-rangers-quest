import classNames from "classnames";
import * as React from "react";
import { assertNever } from "../../../lib/formula/calculator";
import { DeepImmutable } from "../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../lib/qmplayer/funcs";
import { Jump, Location } from "../../../lib/qmreader";
import { colors } from "../colors";
import { CANVAS_PADDING, LOCATION_RADIUS } from "../consts";
import { updateLocation } from "./actions";
import { colorToString, interpolateColor } from "./color";
import { drawArrowEnding, drawLocation, getCanvasSize, updateMainCanvas } from "./drawings";
import { HoverZone, HoverZones } from "./hover";
import { HoverPopup } from "./hoverPopup";
import { ToastContainer, toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

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

export function EditorCore({ quest, onChange }: EditorCoreProps) {
  const [mode, setMode] = React.useState<EditorMode>("move");

  const mainCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const mainContextRef = React.useRef<CanvasRenderingContext2D | null>(null);

  const interactiveCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const interactiveContextRef = React.useRef<CanvasRenderingContext2D | null>(null);

  const canvasSize = React.useMemo(() => getCanvasSize(quest), [quest]);
  const [hoverZones, setHoverZones] = React.useState<HoverZones>([]);
  const [hoverZone, setHoverZone] = React.useState<
    | {
        zone: HoverZone;
        clientX: number;
        clientY: number;
      }
    | undefined
  >(undefined);

  const [isDragging, setIsDragging] = React.useState<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    const ctx = mainContextRef.current;
    if (!ctx) {
      return;
    }
    const hoverZones = updateMainCanvas(
      ctx,
      canvasSize.canvasWidth,
      canvasSize.canvasHeight,
      quest,
    );
    setHoverZones(hoverZones);
    console.info(`Main canvas re-render`);
  }, [quest, canvasSize]);

  const getMouseCoordsInCanvas = React.useCallback((e: MouseEvent) => {
    const canvas = interactiveCanvasRef.current;
    if (!canvas) {
      throw new Error("Canvas is not defined");
    }
    const canvasRect = canvas.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    return { x, y };
  }, []);

  React.useEffect(() => {
    // TODO: This do not work well when scrolling
    const onMove = (e: MouseEvent) => {
      const mouseCoords = getMouseCoordsInCanvas(e);

      if (isDragging) {
        setIsDragging(mouseCoords);
        return;
      }

      const hoverZone = hoverZones.find((hoverCandidate) =>
        isDistanceLower(
          mouseCoords.x,
          mouseCoords.y,
          hoverCandidate[0],
          hoverCandidate[1],
          hoverCandidate[2],
        ),
      );
      setHoverZone(
        hoverZone ? { zone: hoverZone, clientX: e.clientX, clientY: e.clientY } : undefined,
      );
    };
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
    };
  }, [hoverZones, isDragging]);

  const snapToGrid = React.useCallback(
    (x: number, y: number) => {
      const gridX = Math.floor(quest.screenSizeX / quest.widthSize);
      const gridY = Math.floor(quest.screenSizeY / quest.heightSize);
      const grixXoffset = Math.floor(gridX / 2);
      const grixYoffset = Math.floor(gridY / 2);
      return {
        x: Math.round((x - grixXoffset) / gridX) * gridX + grixXoffset,
        y: Math.round((y - grixYoffset) / gridY) * gridY + grixYoffset,
      };
    },
    [quest],
  );

  const isPlaceBusy = React.useCallback(
    (x: number, y: number) => {
      return quest.locations.some((location) =>
        isDistanceLower(x, y, location.locX, location.locY, LOCATION_RADIUS),
      );
    },
    [quest],
  );

  const notifyUser = React.useCallback((msg: string) => {
    toast(msg);
  }, []);

  React.useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (mode === "move") {
        const mouseCoords = getMouseCoordsInCanvas(e);
        setIsDragging(mouseCoords);
      } else if (mode === "newJump") {
        // TODO
      }
    };
    document.addEventListener("mousedown", onMouseDown);

    const onMouseUp = (e: MouseEvent) => {
      setIsDragging(null);

      const mouseInCanvas = getMouseCoordsInCanvas(e);

      if (mode === "move") {
        if (hoverZone) {
          const location = hoverZone.zone[3];
          if (location) {
            const griddedLocation = snapToGrid(mouseInCanvas.x, mouseInCanvas.y);
            if (isPlaceBusy(griddedLocation.x, griddedLocation.y)) {
              notifyUser("Location is busy");
            } else {
              onChange(
                updateLocation(quest, {
                  ...location,
                  locX: griddedLocation.x,
                  locY: griddedLocation.y,
                }),
              );
            }
          }
        }
        setHoverZone(undefined);
        // aasdasd
      } else if (mode === "select" || e.button === 2 /* Right click*/) {
        // TODO
      } else if (mode === "newJump") {
        // TODO
      } else if (mode === "newLocation") {
        // TODO
      }
    };
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [mode, hoverZone, getMouseCoordsInCanvas]);

  React.useEffect(() => {
    const context = interactiveContextRef.current;
    if (!context) {
      return;
    }
    // TODO: This is part of Drawings.tsx
    context.clearRect(0, 0, canvasSize.canvasWidth, canvasSize.canvasHeight);
    context.setLineDash(isDragging ? [5, 5] : []);
    if (hoverZone) {
      const location = hoverZone.zone[3];
      if (location) {
        context.strokeStyle = "black";
        context.lineWidth = 2;
        context.fillStyle = "none";
        context.beginPath();
        context.arc(location.locX, location.locY, LOCATION_RADIUS, 0, 2 * Math.PI);
        context.stroke();

        if (isDragging) {
          context.strokeStyle = "black";
          context.lineWidth = 2;
          context.fillStyle = "none";
          context.beginPath();
          context.setLineDash([]);
          context.arc(isDragging.x, isDragging.y, LOCATION_RADIUS, 0, 2 * Math.PI);
          context.stroke();
        }
      }
      const jumpHover = hoverZone.zone[4];
      if (jumpHover) {
        const LUT = jumpHover[2].LUT;
        const startColor = jumpHover[2].startColor;
        const endColor = jumpHover[2].endColor;
        context.lineWidth = 2;
        for (let i = 1; i < LUT.length; i++) {
          context.beginPath();
          context.moveTo(LUT[i - 1].x, LUT[i - 1].y);
          context.strokeStyle = colorToString(
            interpolateColor(startColor, endColor, i / LUT.length),
          );
          context.lineTo(LUT[i].x, LUT[i].y);
          // context.setLineDash([5, 15]);
          // TODO: Dash if moving
          context.stroke();
        }

        if (isDragging) {
          context.strokeStyle = "black";
          context.lineWidth = 1;
          context.fillStyle = "none";
          context.beginPath();

          context.setLineDash([]);

          const isBegining = jumpHover[1];

          const startX = isBegining ? isDragging.x : jumpHover[2].startLoc.locX;
          const startY = isBegining ? isDragging.y : jumpHover[2].startLoc.locY;
          context.moveTo(startX, startY);

          const endX = isBegining ? jumpHover[2].endLoc.locX : isDragging.x;
          const endY = isBegining ? jumpHover[2].endLoc.locY : isDragging.y;

          context.lineTo(endX, endY);
          context.stroke();

          drawArrowEnding(context, endX, endY, endX - startX + endX, endY - startY + endY);
        }
      }
    }
    context.setLineDash([]);
  }, [hoverZone, canvasSize, isDragging]);

  // console.info(`Editor re-render`);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
        <div
          style={{
            position: "relative",
          }}
        >
          <canvas
            style={{ position: "absolute" }}
            width={canvasSize.canvasWidth}
            height={canvasSize.canvasHeight}
            ref={(element) => {
              mainCanvasRef.current = element;
              if (element && !mainContextRef.current) {
                const context = element.getContext("2d");
                mainContextRef.current = context;
              }
              if (!element && mainContextRef.current) {
                mainContextRef.current = null;
              }
            }}
          />

          <canvas
            style={{ position: "absolute" }}
            width={canvasSize.canvasWidth}
            height={canvasSize.canvasHeight}
            ref={(element) => {
              interactiveCanvasRef.current = element;
              if (element && !interactiveContextRef.current) {
                const context = element.getContext("2d");
                interactiveContextRef.current = context;
              }
              if (!element && interactiveCanvasRef.current) {
                interactiveCanvasRef.current = null;
              }
            }}
            onContextMenu={(e) => e.preventDefault()}
          />

          {hoverZone && (
            <HoverPopup clientX={hoverZone.clientX} clientY={hoverZone.clientY}>
              todoto
            </HoverPopup>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
