import classNames from "classnames";
import * as React from "react";
import { assertNever } from "../../../assertNever";
import { DeepImmutable } from "../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../lib/qmplayer/funcs";
import { LOCATION_DROP_RADIUS, LOCATION_RADIUS } from "../consts";
import { createJump, createLocation, updateJump, updateLocation } from "./actions";
import { colorToString, interpolateColor } from "./color";
import { drawHovers, getCanvasSize, updateMainCanvas } from "./drawings/index";
import { HoverZone, HoverZones } from "./hover";
import { HoverPopup } from "./hoverPopup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  isDistanceLower,
  isLocationAtThisPosition as whatLocationIsAlreadyAtThisPosition,
  snapToGrid,
} from "./utils";
import { Jump, Location } from "../../../lib/qmreader";
import { LocationHover } from "./hovers/location";
import { Overlay } from "./overlay";
import { LocationOverlayContent } from "./overlays/location";

export interface EditorCoreProps {
  quest: Quest;
  onChange: (newQuest: Quest) => void;
  //onExit: () => void,
}

// tslint:disable-next-line:no-useless-cast
export const EDITOR_MOUSE_MODES = ["select", "move", "newLocation", "newJump", "remove"] as const;
export type EditorMouseMode = typeof EDITOR_MOUSE_MODES[number];

type EditorOverlay =
  | {
      kind: "location";
      location: DeepImmutable<Location>;
    }
  | {
      kind: "jump";
      jump: DeepImmutable<Jump>;
    }
  | {
      kind: "questsettings";
    };

export function EditorCore({ quest, onChange }: EditorCoreProps) {
  const [mouseMode, setMouseMode] = React.useState<EditorMouseMode>("newJump");

  const [overlayMode, setOverlayMode] = React.useState<EditorOverlay | undefined>(undefined);

  // DEBUGGING
  /*
  React.useEffect(() => {
    setOverlayMode({
      kind: "location",
      location: quest.locations.find((l) => l.isStarting)!,
    });
  }, []);
*/

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
    if (overlayMode) {
      return;
    }

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
  }, [hoverZones, isDragging, overlayMode]);

  const notifyUser = React.useCallback((msg: string) => {
    toast(msg);
  }, []);

  React.useEffect(() => {
    if (overlayMode) {
      return;
    }
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        const mouseCoords = getMouseCoordsInCanvas(e);
        if (mouseMode === "move") {
          setIsDragging(mouseCoords);
        } else if (mouseMode === "newJump") {
          if (hoverZone) {
            const location = hoverZone.zone[3];
            if (location) {
              const newJump = createJump(quest, location.id, location.id);
              setHoverZone({
                zone: [
                  hoverZone.zone[0],
                  hoverZone.zone[1],
                  hoverZone.zone[2],
                  null,
                  [
                    newJump,
                    false,
                    {
                      LUT: [],
                      startLoc: {
                        locX: location.locX,
                        locY: location.locY,
                      },
                      endLoc: {
                        locX: location.locX,
                        locY: location.locY,
                      },
                      startColor: [255, 255, 255],
                      endColor: [0, 0, 255],
                    },
                  ],
                ],
                clientX: e.clientX,
                clientY: e.clientY,
              });
              setIsDragging(mouseCoords);
            }
          }
        }
      }
    };
    document.addEventListener("mousedown", onMouseDown);

    const onMouseUp = (e: MouseEvent) => {
      const mouseInCanvas = getMouseCoordsInCanvas(e);

      if (e.button === 2 /* Right click*/ || mouseMode === "select") {
        if (hoverZone) {
          if (hoverZone.zone[3]) {
            setOverlayMode({
              kind: "location",
              location: hoverZone.zone[3],
            });
          }
        }
      } else {
        // Left click
        if (mouseMode === "move") {
          if (hoverZone) {
            const location = hoverZone.zone[3];
            if (location) {
              const griddedLocation = snapToGrid(quest, mouseInCanvas.x, mouseInCanvas.y);
              const locationAtThisPosition = whatLocationIsAlreadyAtThisPosition(
                quest,
                griddedLocation.x,
                griddedLocation.y,
              );
              if (locationAtThisPosition) {
                if (locationAtThisPosition.id !== location.id) {
                  notifyUser("This position is busy");
                }
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
        } else if (mouseMode === "newJump") {
          if (hoverZone && hoverZone.zone[4]) {
            const toLocation = quest.locations.find((loc) =>
              isDistanceLower(
                mouseInCanvas.x,
                mouseInCanvas.y,
                loc.locX,
                loc.locY,
                LOCATION_DROP_RADIUS,
              ),
            );

            if (toLocation) {
              const jump: DeepImmutable<Jump> = {
                ...hoverZone.zone[4][0],
                toLocationId: toLocation.id,
              };
              setOverlayMode({
                kind: "jump",
                jump,
              });
            } else {
              notifyUser("No location here");
            }
          }
          setHoverZone(undefined);
        } else if (mouseMode === "newLocation") {
          const griddedLocation = snapToGrid(quest, mouseInCanvas.x, mouseInCanvas.y);
          const locationAtThisPosition = whatLocationIsAlreadyAtThisPosition(
            quest,
            griddedLocation.x,
            griddedLocation.y,
          );
          if (locationAtThisPosition) {
            notifyUser("There is already location at this position");
          } else {
            const newPossibleLocation = createLocation(quest, griddedLocation.x, griddedLocation.y);
            setOverlayMode({
              kind: "location",
              location: newPossibleLocation,
            });
          }
        }
      }

      setIsDragging(undefined);
    };
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [mouseMode, hoverZone, overlayMode, getMouseCoordsInCanvas]);

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
        {EDITOR_MOUSE_MODES.map((candidateMode) => (
          <button
            key={candidateMode}
            className={classNames("btn", mouseMode === candidateMode ? "btn-info" : "btn-light")}
            onClick={() => setMouseMode(candidateMode)}
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
          position: "relative",
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
                mouseMode === "move"
                  ? "move"
                  : mouseMode === "select"
                  ? "default"
                  : mouseMode === "newLocation"
                  ? "crosshair"
                  : mouseMode === "newJump"
                  ? "e-resize"
                  : mouseMode === "remove"
                  ? "url('/fa/remove.svg') 12 12, pointer"
                  : assertNever(mouseMode),
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

          {hoverZone && !isDragging && !overlayMode && (
            <HoverPopup clientX={hoverZone.clientX} clientY={hoverZone.clientY}>
              {hoverZone.zone[3] ? <LocationHover location={hoverZone.zone[3]} /> : "TODO"}
            </HoverPopup>
          )}
        </div>

        {overlayMode ? (
          <Overlay>
            {overlayMode.kind === "location" ? (
              <LocationOverlayContent
                location={overlayMode.location}
                setLocation={(location) => {
                  setOverlayMode(undefined);
                  if (location) {
                    onChange(updateLocation(quest, location));
                  }
                }}
              />
            ) : (
              "TODO"
            )}
          </Overlay>
        ) : null}
      </div>

      <ToastContainer />
    </div>
  );
}
