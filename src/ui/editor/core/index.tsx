import classNames from "classnames";
import * as React from "react";
import { assertNever } from "../../../assertNever";
import { DeepImmutable } from "../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../lib/qmplayer/funcs";
import { GameState } from "../../../lib/qmplayer";
import { LOCATION_DROP_RADIUS, LOCATION_RADIUS } from "../consts";
import {
  createJump,
  createLocation,
  duplicateLocation,
  duplicateJump,
  removeJump,
  removeLocation,
  updateJump,
  updateLocation,
} from "./actions";
import { colorToString, interpolateColor } from "./color";
import { drawHovers, getCanvasSize, updateMainCanvas } from "./drawings/index";
import { HoverZone, HoverZones } from "./hover";
import { HoverPopup } from "./hoverPopup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  isDistanceLower,
  isLocationAtThisPosition as whatLocationIsAlreadyAtThisPosition,
  moveAllLocationsFromTopBottom,
  snapToGrid,
} from "./utils";
import { HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR, Jump, Location, parse } from "../../../lib/qmreader";
import { LocationHover } from "./hovers/location";
import { Overlay } from "./overlay";
import { LocationOverlay } from "./overlays/jumpsAndLocations/location";
import { JumpHover } from "./hovers/jump";
import { JumpOverlay } from "./overlays/jumpsAndLocations/jump";
import { useOnDocumentKeyUp, useWindowInnerSize } from "./hooks";
import { QuestSettings } from "./overlays/questSettings/questSettings";
import { QuestPlay } from "../../questPlay/questPlay";
import { getLang } from "../../lang";
import { QuestWithMetadata, useIdb } from "./idb";
import { emptyQmm } from "./emptyQmm";
import { Game } from "../../../packGameData/defs";
import { LoadOverlay } from "./overlays/load/loadOverlay";
import { writeQmm } from "../../../lib/qmwriter";
import { HelpOverlay } from "./overlays/helpOverlay";
import { downloadQuest } from "./download";
import { QuestName } from "./namechange";
import { CloudQuestsProps } from "../defs";
import { CloudQuestsOverlay } from "./overlays/cloudQuests";

// tslint:disable-next-line:no-useless-cast
export const EDITOR_MOUSE_MODES = ["select", "move", "newLocation", "newJump", "remove"] as const;
export type EditorMouseMode = typeof EDITOR_MOUSE_MODES[number];

type EditorOverlay =
  | {
      readonly kind: "location";
      readonly location: DeepImmutable<Location>;
      readonly enableSaveOnNoChanges: boolean;
    }
  | {
      readonly kind: "jump";
      readonly jump: DeepImmutable<Jump>;
      readonly enableSaveOnNoChanges: boolean;
    }
  | {
      readonly kind: "questsettings";
      readonly enableSaveOnNoChanges: boolean;
    }
  | {
      readonly kind: "load";
    }
  | {
      readonly kind: "help";
    }
  | {
      readonly kind: "cloudquest";
    };

export function EditorCore({
  questsToLoad,
  onExit,
  cloudQuestProps,
}: {
  questsToLoad: Game[];
  onExit: () => void;
  cloudQuestProps: CloudQuestsProps;
}) {
  const { quest, setQuest: saveQuestToIdb, undo, redo } = useIdb();

  // (window as any).quest = quest;

  const [mouseMode, setMouseMode] = React.useState<EditorMouseMode>("select");

  const [overlayMode, setOverlayMode] = React.useState<EditorOverlay | undefined>(undefined);

  const [isPlaying, setIsPlaying] = React.useState<{ gameState: GameState | null } | null>(null);

  // DEBUGGING
  /*
  React.useEffect(() => {
    setOverlayMode({
      kind: "location",
      //location: quest.locations.find((l) => l.isStarting)!,
      location: quest.locations.find((l) => l.id === 204)!,
    });
    setOverlayMode({
      kind: "jump",
      jump: quest.jumps.find((l) => l.id === 987)!,
    });
    setOverlayMode({ kind: "questsettings" });
  }, []);
  // */

  const mainCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const mainContextRef = React.useRef<CanvasRenderingContext2D | null>(null);

  const interactiveCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const interactiveContextRef = React.useRef<CanvasRenderingContext2D | null>(null);

  const mainScrollDivRef = React.useRef<HTMLDivElement | null>();

  const windowInnerSize = useWindowInnerSize();

  const [zoom, setZoom] = React.useState(1);

  const canvasSize = React.useMemo(() => {
    if (!quest) {
      return {
        width: windowInnerSize.width,
        height: windowInnerSize.height,
      };
    }
    const questCanvasSize = getCanvasSize(quest);
    return {
      width: Math.max(questCanvasSize.width * zoom, windowInnerSize.width),
      height: Math.max(questCanvasSize.height * zoom, windowInnerSize.height),
    };
  }, [quest, windowInnerSize, zoom]);

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

  const onChange = React.useCallback(
    (newQuest: QuestWithMetadata) => {
      setHoverZones([]);
      setHoverZone(undefined);
      setIsDragging(undefined);
      saveQuestToIdb(newQuest);
    },
    [saveQuestToIdb],
  );

  React.useEffect(() => {
    const ctx = mainContextRef.current;
    if (!ctx) {
      return;
    }
    if (isPlaying) {
      return;
    }
    if (!quest) {
      return;
    }
    const hoverZones = updateMainCanvas(ctx, quest, zoom);
    setHoverZones(hoverZones);
    console.info(`Main canvas re-render`);
  }, [quest, isPlaying, zoom, canvasSize]);

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
    if (isPlaying) {
      return;
    }
    if (!quest) {
      return;
    }

    // TODO: This do not work well when scrolling
    const onMouseMove = (e: MouseEvent) => {
      const mouseCoords = getMouseCoordsInCanvas(e);

      if (isDragging) {
        if (e.buttons !== 0) {
          setIsDragging(mouseCoords);
        } else {
          // This is a workaround if onMove event is triggered before we update onMove callback with new isDragging value
          setIsDragging(undefined);
        }
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

      if (e.buttons === 2 || e.buttons === 1) {
        if (mainScrollDivRef.current) {
          mainScrollDivRef.current.scrollBy(-e.movementX, -e.movementY);
        }
      }
    };
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [hoverZones, isDragging, overlayMode, isPlaying, quest]);

  React.useEffect(() => {
    if (overlayMode) {
      return;
    }
    if (isPlaying) {
      return;
    }
    const interactiveCanvas = interactiveCanvasRef.current;
    if (!interactiveCanvas) {
      return;
    }
    if (!quest) {
      return;
    }
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        const mouseCoords = getMouseCoordsInCanvas(e);
        if (mouseMode === "move") {
          if (hoverZone) {
            setIsDragging(mouseCoords);
          }
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
                        locX: location.locX * zoom,
                        locY: location.locY * zoom,
                      },
                      endLoc: {
                        locX: location.locX * zoom,
                        locY: location.locY * zoom,
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
    interactiveCanvas.addEventListener("mousedown", onMouseDown);

    const onMouseUp = (e: MouseEvent) => {
      const mouseInCanvas = getMouseCoordsInCanvas(e);

      if (e.button === 2 /* Right click*/ || mouseMode === "select") {
        if (hoverZone) {
          if (hoverZone.zone[3]) {
            setOverlayMode({
              kind: "location",
              location: hoverZone.zone[3],
              enableSaveOnNoChanges: false,
            });
          } else if (hoverZone.zone[4]) {
            setOverlayMode({
              kind: "jump",
              jump: hoverZone.zone[4][0],
              enableSaveOnNoChanges: false,
            });
          }
        }
      } else {
        // Left click
        if (mouseMode === "move") {
          if (hoverZone) {
            const location = hoverZone.zone[3];
            if (location) {
              const griddedLocation = snapToGrid(
                quest,
                mouseInCanvas.x / zoom,
                mouseInCanvas.y / zoom,
              );
              const locationAtThisPosition = whatLocationIsAlreadyAtThisPosition(
                quest,
                griddedLocation.x,
                griddedLocation.y,
              );
              if (locationAtThisPosition) {
                if (locationAtThisPosition.id !== location.id) {
                  toast("Тут уже есть локация!");
                }
              } else {
                if (e.ctrlKey) {
                  onChange(
                    duplicateLocation(quest, location, griddedLocation.x, griddedLocation.y),
                  );
                } else {
                  onChange(
                    moveAllLocationsFromTopBottom(
                      updateLocation(quest, {
                        ...location,
                        locX: griddedLocation.x,
                        locY: griddedLocation.y,
                      }),
                    ),
                  );
                }
              }
            }

            const jumpMoving = hoverZone.zone[4];
            if (jumpMoving) {
              const [jump, isBeginning] = jumpMoving;
              const newLocation = quest.locations.find((loc) =>
                isDistanceLower(
                  mouseInCanvas.x / zoom,
                  mouseInCanvas.y / zoom,
                  loc.locX,
                  loc.locY,
                  LOCATION_DROP_RADIUS,
                ),
              );
              if (!newLocation) {
                toast("Тут нет локации!");
              } else {
                const newFromLocationId = isBeginning ? newLocation.id : jump.fromLocationId;
                const newToLocationId = isBeginning ? jump.toLocationId : newLocation.id;
                if (e.ctrlKey) {
                  onChange(duplicateJump(quest, jump, newFromLocationId, newToLocationId));
                } else {
                  onChange(
                    updateJump(quest, {
                      ...jump,
                      fromLocationId: newFromLocationId,
                      toLocationId: newToLocationId,
                    }),
                  );
                }
              }
            }
          }
          setHoverZone(undefined);
        } else if (mouseMode === "newJump") {
          if (hoverZone && hoverZone.zone[4]) {
            const toLocation = quest.locations.find((loc) =>
              isDistanceLower(
                mouseInCanvas.x / zoom,
                mouseInCanvas.y / zoom,
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
                enableSaveOnNoChanges: true,
              });
            } else {
              toast("Тут нет локации!");
            }
          }
          setHoverZone(undefined);
        } else if (mouseMode === "newLocation") {
          const griddedLocation = snapToGrid(quest, mouseInCanvas.x / zoom, mouseInCanvas.y / zoom);
          const locationAtThisPosition = whatLocationIsAlreadyAtThisPosition(
            quest,
            griddedLocation.x,
            griddedLocation.y,
          );
          if (locationAtThisPosition) {
            toast("Тут уже есть локация!");
          } else {
            const isDefaultStarting = quest.locations.length === 0;
            const newPossibleLocation = createLocation(
              quest,
              griddedLocation.x,
              griddedLocation.y,
              isDefaultStarting,
            );
            setOverlayMode({
              kind: "location",
              location: newPossibleLocation,
              enableSaveOnNoChanges: true,
            });
          }
        } else if (mouseMode === "remove") {
          if (hoverZone && hoverZone.zone[3]) {
            const locationToRemove = hoverZone.zone[3];
            onChange(removeLocation(quest, locationToRemove.id));
          }
          if (hoverZone && hoverZone.zone[4]) {
            const jumpToRemove = hoverZone.zone[4][0];
            onChange(removeJump(quest, jumpToRemove.id));
          }
        }
      }

      setIsDragging(undefined);
    };
    interactiveCanvas.addEventListener("mouseup", onMouseUp);
    return () => {
      interactiveCanvas.removeEventListener("mouseup", onMouseUp);
      interactiveCanvas.removeEventListener("mousedown", onMouseDown);
    };
  }, [mouseMode, hoverZone, overlayMode, getMouseCoordsInCanvas, isPlaying, zoom]);

  React.useEffect(() => {
    const context = interactiveContextRef.current;
    if (!context) {
      return;
    }
    if (isPlaying) {
      return;
    }
    drawHovers(context, hoverZone, isDragging, zoom);
  }, [hoverZone, isDragging, isPlaying, zoom]);

  const onDocumentKeyUp = React.useCallback(
    (e: KeyboardEvent) => {
      if (overlayMode) {
        return;
      }
      if (isPlaying) {
        return;
      }

      if (e.key === "1") {
        setMouseMode("select");
      } else if (e.key === "2") {
        setMouseMode("move");
      } else if (e.key === "3") {
        setMouseMode("newLocation");
      } else if (e.key === "4") {
        setMouseMode("newJump");
      } else if (e.key === "5") {
        setMouseMode("remove");
      }

      if (e.key === "z" && (e.ctrlKey || e.metaKey) && undo) {
        undo();
      }
      if (e.key === "Z" && (e.ctrlKey || e.metaKey) && redo) {
        redo();
      }
    },
    [overlayMode, isPlaying, undo, redo],
  );
  useOnDocumentKeyUp(onDocumentKeyUp);

  // console.info(`Editor re-render`);

  if (!quest) {
    return <div>Loading latest save...</div>;
  }

  if (isPlaying) {
    return (
      <QuestPlay
        quest={quest}
        gameState={isPlaying.gameState}
        player={{
          ...quest.strings,
          lang: "rus",
          allowBackButton: "debug",
          Player: quest.strings.Ranger,
        }}
        setGameState={(newState) => setIsPlaying({ gameState: newState })}
        defaultMusicList={undefined}
        isMusic={true}
        setIsMusic={() => {}}
        onExit={() => setIsPlaying(null)}
        showTaskInfoOnQuestStart={true}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="d-flex align-items-center">
        <button
          className={classNames("mr-1", "btn", "btn-light")}
          onClick={() => {
            const emptyQuest = parse(emptyQmm);
            onChange({
              ...emptyQuest,
              filename: "newquest",
            });
            setOverlayMode({
              kind: "questsettings",
              enableSaveOnNoChanges: true,
            });
          }}
          aria-label="Создать новый"
        >
          <i className="fa fa-file-o fa-fw" title="Новый" />
        </button>
        <button
          className={classNames("mr-1", "btn", "btn-light")}
          onClick={() => {
            setOverlayMode({ kind: "load" });
          }}
          aria-label="Открыть"
        >
          <i className="fa fa-folder-open-o fa-fw" title="Открыть" />
        </button>

        <button
          className={classNames("mr-3", "btn", "btn-light")}
          aria-label="Скачать"
          onClick={() => {
            downloadQuest(quest);
            if (quest.header === HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR) {
              toast(
                `ВНИМАНИЕ: этот файл не будет читаться TGE! Чтобы это исправить зайдите в настройки квеста`,
              );
            }
          }}
        >
          <i className="fa fa-download fa-fw" title="Скачать" />
        </button>

        <button
          className={classNames("mr-3", "btn", "btn-light")}
          aria-label="Загрузка и выгрузка в облако"
          onClick={() => {
            if (cloudQuestProps.getMyUserId()) {
              setOverlayMode({ kind: "cloudquest" });
            } else {
              toast("Чтобы использовать облако нужно зайти в Firebase!");
            }
          }}
        >
          <i className="fa fa-cloud fa-fw" title="Загрузка и выгрузка в облако" />
        </button>

        {EDITOR_MOUSE_MODES.map((candidateMode) => (
          <button
            key={candidateMode}
            className={classNames("btn", mouseMode === candidateMode ? "btn-info" : "btn-light")}
            onClick={() => setMouseMode(candidateMode)}
            aria-label={
              candidateMode === "move"
                ? "Двигать (2) [Вместе с Ctrl - копировать]"
                : candidateMode === "select"
                ? "Выделять (1)"
                : candidateMode === "newJump"
                ? "Новый переход (4)"
                : candidateMode === "newLocation"
                ? "Новая локация (3)"
                : candidateMode === "remove"
                ? "Удалить (5)"
                : assertNever(candidateMode)
            }
          >
            {candidateMode === "move" ? (
              <i className="fa fa-arrows fa-fw" title="Двигать (2) [Вместе с Ctrl - копировать]" />
            ) : candidateMode === "select" ? (
              <i className="fa fa-mouse-pointer fa-fw" title="Выделять (1)" />
            ) : candidateMode === "newJump" ? (
              <i className="fa fa-arrow-right fa-fw" title="Новый переход (4)" />
            ) : candidateMode === "newLocation" ? (
              <i className="fa fa-circle fa-fw" title="Новая локация (3)" />
            ) : candidateMode === "remove" ? (
              <i className="fa fa-remove fa-fw" title="Удалить (5)" />
            ) : (
              assertNever(candidateMode)
            )}
          </button>
        ))}

        <button
          className={classNames("ml-3", "btn", "btn-light")}
          onClick={() => {
            setOverlayMode({ kind: "questsettings", enableSaveOnNoChanges: false });
          }}
          aria-label="Редактировать общую информацию по квесту"
        >
          <i className="fa fa-wrench fa-fw" title="Редактировать общую информацию по квесту" />
        </button>

        <button
          className={classNames("ml-3", "btn", "btn-light")}
          onClick={() => {
            setZoom(zoom / 1.2);
          }}
          aria-label="Масштаб уменьшить"
        >
          <i className="fa fa-search-minus fa-fw" title="Zoom out" />
        </button>
        <button
          className={classNames("btn", "btn-light")}
          onClick={() => {
            setZoom(zoom * 1.2);
          }}
          aria-label="Масштаб увеличить"
        >
          <i className="fa fa-search-plus fa-fw" title="Zoom in" />
        </button>

        <button
          className={classNames("ml-3", "btn", "btn-light")}
          onClick={undo || undefined}
          disabled={!undo}
          aria-label="Отменить (ctrl+z)"
        >
          <i className="fa fa-undo fa-fw" title="Отменить (ctrl+z)" />
        </button>
        <button
          className={classNames("btn", "btn-light")}
          onClick={redo || undefined}
          disabled={!redo}
          aria-label="Повторить (ctrl+shift+z)"
        >
          <i className="fa fa-repeat fa-fw" title="Повторить (ctrl+shift+z)" />
        </button>

        <button
          className={classNames("ml-3", "btn", "btn-light")}
          onClick={() => {
            setOverlayMode({ kind: "help" });
          }}
          aria-label="Справка"
        >
          <i className="fa fa-question-circle-o fa-fw" title="Справка" />
        </button>

        <button
          className={classNames("ml-3", "btn", "btn-light")}
          onClick={() => {
            if (quest.locations.find((loc) => loc.isStarting)) {
              setIsPlaying({ gameState: null });
            } else {
              toast("Нет начальной локации!");
            }
          }}
          aria-label="Играть"
        >
          <i className="fa fa-play-circle fa-fw" title="Играть" />
        </button>

        <QuestName
          quest={quest}
          setQuest={(newQuest) => onChange({ ...quest, filename: newQuest.filename })}
        />

        <button
          className={classNames("ml-auto", "btn", "btn-light")}
          onClick={onExit}
          aria-label="Выход"
        >
          <i className="fa fa-sign-out fa-fw" title="Выход" />
        </button>

        <span className="mx-2" />
      </div>
      <div
        style={{
          // Some flex magic, TODO make it better
          flexGrow: 100,
          flexShrink: 100,
          height: 100,
          alignSelf: "stretch",
          position: "relative",
        }}
      >
        <div
          style={{
            overflow: "scroll",
            height: "100%",
          }}
          ref={(element) => (mainScrollDivRef.current = element)}
        >
          <div
            style={{
              position: "relative",
              width: canvasSize.width,
              height: canvasSize.height,
            }}
          >
            <canvas
              style={{ position: "absolute" }}
              width={canvasSize.width}
              height={canvasSize.height}
              ref={(element) => {
                mainCanvasRef.current = element;
                if (element && !mainContextRef.current) {
                  const context = element.getContext("2d", { alpha: false });
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
                  mouseMode === "newLocation"
                    ? "url('/fontawesome_cursors/circle.svg') 12 12, crosshair"
                    : mouseMode === "select" || !hoverZone
                    ? "default"
                    : mouseMode === "move"
                    ? "move"
                    : mouseMode === "newJump"
                    ? "url('/fontawesome_cursors/arrow-right.svg') 12 12, e-resize"
                    : mouseMode === "remove"
                    ? "url('/fontawesome_cursors/remove.svg') 12 12, not-allowed"
                    : assertNever(mouseMode),
              }}
              width={canvasSize.width}
              height={canvasSize.height}
              ref={(element) => {
                interactiveCanvasRef.current = element;
                if (element && !interactiveContextRef.current) {
                  const context = element.getContext("2d", { alpha: true });
                  interactiveContextRef.current = context;
                }
                if (!element && interactiveContextRef.current) {
                  interactiveContextRef.current = null;
                }
              }}
              onContextMenu={(e) => e.preventDefault()}
            />

            {hoverZone && !isDragging && !overlayMode && (
              <HoverPopup clientX={hoverZone.clientX} clientY={hoverZone.clientY}>
                {hoverZone.zone[3] ? (
                  <LocationHover quest={quest} location={hoverZone.zone[3]} />
                ) : hoverZone.zone[4] ? (
                  <JumpHover quest={quest} jump={hoverZone.zone[4][0]} />
                ) : (
                  "Unknown state"
                )}
              </HoverPopup>
            )}
          </div>
        </div>
        {overlayMode ? (
          overlayMode.kind === "location" ? (
            <LocationOverlay
              quest={quest}
              initialLocation={overlayMode.location}
              onClose={(location) => {
                setOverlayMode(undefined);
                if (location) {
                  onChange(updateLocation(quest, location));
                }
              }}
              enableSaveOnNoChanges={overlayMode.enableSaveOnNoChanges}
            />
          ) : overlayMode.kind === "jump" ? (
            <JumpOverlay
              quest={quest}
              initialJump={overlayMode.jump}
              onClose={(jump) => {
                setOverlayMode(undefined);
                if (jump) {
                  onChange(updateJump(quest, jump));
                }
              }}
              enableSaveOnNoChanges={overlayMode.enableSaveOnNoChanges}
            />
          ) : overlayMode.kind === "questsettings" ? (
            <QuestSettings
              initialQuest={quest}
              onClose={(newQuest) => {
                setOverlayMode(undefined);
                if (newQuest) {
                  onChange(newQuest);
                }
              }}
              enableSaveOnNoChanges={overlayMode.enableSaveOnNoChanges}
            />
          ) : overlayMode.kind === "load" ? (
            <LoadOverlay
              onClose={(newQuest) => {
                setOverlayMode(undefined);
                if (newQuest) {
                  onChange(newQuest);
                }
              }}
              questsToLoad={questsToLoad}
            />
          ) : overlayMode.kind === "help" ? (
            <HelpOverlay onClose={() => setOverlayMode(undefined)} />
          ) : overlayMode.kind === "cloudquest" ? (
            <CloudQuestsOverlay
              quest={quest}
              onClose={(newQuest) => {
                setOverlayMode(undefined);
                if (newQuest) {
                  onChange(newQuest);
                }
              }}
              {...cloudQuestProps}
            />
          ) : (
            assertNever(overlayMode)
          )
        ) : null}
      </div>

      <ToastContainer />
    </div>
  );
}
