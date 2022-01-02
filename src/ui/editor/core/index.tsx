import classNames from "classnames";
import * as React from "react";
import { assertNever } from "../../../lib/formula/calculator";
import { DeepImmutable } from "../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../lib/qmplayer/funcs";
import { Jump, Location } from "../../../lib/qmreader";
import { colors } from "../colors";
import { CANVAS_PADDING, LOCATION_RADIUS } from "../consts";
import { drawLocation, getCanvasSize, updateMainCanvas } from "./drawings";
import { HoverZone, HoverZones } from "./hover";

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

  const mainCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const mainContextRef = React.useRef<CanvasRenderingContext2D | null>(null);

  const hoverCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const hoverContextRef = React.useRef<CanvasRenderingContext2D | null>(null);

  const canvasSize = React.useMemo(() => getCanvasSize(quest), [quest]);
  const [hoverZones, setHoverZones] = React.useState<HoverZones>([]);
  const [hoverZone, setHoverZone] = React.useState<HoverZone | null>(null);

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
  }, [quest, canvasSize]);

  React.useEffect(() => {
    if (!hoverCanvasRef.current) {
      return;
    }
    const canvas = hoverCanvasRef.current;
    const context = hoverContextRef.current;
    if (!context) {
      return;
    }
    const onMove = (e: MouseEvent) => {
      const mouseX = e.pageX - canvas.offsetLeft;
      const mouseY = e.pageY - canvas.offsetTop;
      console.info(mouseX, mouseY);

      const hoverZone = hoverZones.find((hoverCandidate) =>
        isDistanceLower(mouseX, mouseY, hoverCandidate[0], hoverCandidate[1], hoverCandidate[2]),
      );
      if (hoverZone) {
        console.info(hoverZone);
        context.font = "12px serif";
        context.strokeText(`${mouseX}, ${mouseY}`, mouseX, mouseY);
      }
      console.info(mouseX, mouseY);
      // drawOnCanvas();
    };
    document.addEventListener("mousemove", onMove);

    return () => {
      document.removeEventListener("mousemove", onMove);
    };
  }, [hoverZones]);

  React.useEffect(() => {
    if (!mainContextRef.current) {
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
        <div
          style={{
            flexGrow: 1,
            alignSelf: "stretch",
            overflow: "scroll",
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
              hoverCanvasRef.current = element;
              if (element && !hoverContextRef.current) {
                const context = element.getContext("2d");
                hoverContextRef.current = context;
              }
              if (!element && hoverCanvasRef.current) {
                hoverCanvasRef.current = null;
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
