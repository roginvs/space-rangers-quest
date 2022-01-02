import classNames from "classnames";
import * as React from "react";
import { assertNever } from "../../../assertNever";
import { DeepImmutable } from "../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../lib/qmplayer/funcs";
import { LOCATION_DROP_RADIUS, LOCATION_RADIUS } from "../consts";
import { updateJump, updateLocation } from "./actions";
import { colorToString, interpolateColor } from "./color";
import { drawHovers, getCanvasSize, updateMainCanvas } from "./drawings/index";
import { HoverZone, HoverZones } from "./hover";
import { HoverPopup } from "./hoverPopup";
import { ToastContainer, toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import { isDistanceLower, isPlaceBusy, snapToGrid } from "./utils";

export interface EditorCoreProps {
  quest: Quest;
  onChange: (newQuest: Quest) => void;
  //onExit: () => void,
}

// tslint:disable-next-line:no-useless-cast
export const EDITOR_MODES = ["select", "move", "newLocation", "newJump", "remove"] as const;
export type EditorMode = typeof EDITOR_MODES[number];

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

  const [isDragging, setIsDragging] = React.useState<{ x: number; y: number } | undefined>(
    undefined,
  );

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

  const notifyUser = React.useCallback((msg: string) => {
    toast(msg);
  }, []);

  React.useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        if (mode === "move") {
          const mouseCoords = getMouseCoordsInCanvas(e);
          setIsDragging(mouseCoords);
        } else if (mode === "newJump") {
          // TODO
        }
      }
    };
    document.addEventListener("mousedown", onMouseDown);

    const onMouseUp = (e: MouseEvent) => {
      setIsDragging(undefined);

      const mouseInCanvas = getMouseCoordsInCanvas(e);

      if (mode === "move") {
        if (hoverZone) {
          const location = hoverZone.zone[3];
          if (location) {
            const griddedLocation = snapToGrid(quest, mouseInCanvas.x, mouseInCanvas.y);
            if (isPlaceBusy(quest, griddedLocation.x, griddedLocation.y)) {
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

          const jumpMoving = hoverZone.zone[4];
          if (jumpMoving) {
            const [jump, isBeginning] = jumpMoving;
            const newLocation = quest.locations.find((loc) =>
              isDistanceLower(
                mouseInCanvas.x,
                mouseInCanvas.y,
                loc.locX,
                loc.locY,
                LOCATION_DROP_RADIUS,
              ),
            );
            if (!newLocation) {
              notifyUser("No location here");
            } else {
              onChange(
                updateJump(quest, {
                  ...jump,
                  fromLocationId: isBeginning ? newLocation.id : jump.fromLocationId,
                  toLocationId: isBeginning ? jump.toLocationId : newLocation.id,
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
    drawHovers(context, canvasSize, hoverZone, isDragging);
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
            style={{
              position: "absolute",
              cursor:
                mode === "move"
                  ? "move"
                  : mode === "select"
                  ? "default"
                  : mode === "newLocation"
                  ? "crosshair"
                  : mode === "newJump"
                  ? "e-resize"
                  : mode === "remove"
                  ? "url('/fa/remove.svg') 12 12, pointer"
                  : assertNever(mode),
            }}
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

          {hoverZone && !isDragging && (
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
