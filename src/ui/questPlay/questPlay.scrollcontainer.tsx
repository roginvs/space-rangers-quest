import * as React from "react";
import "./questPlay.scrollcontainer.css";

function getDefaultScrollBarWidth() {
  // https://stackoverflow.com/a/13382873
  const outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.width = "100px";
  (outer.style as any).msOverflowStyle = "scrollbar"; // needed for WinJS apps

  document.body.appendChild(outer);

  const widthNoScroll = outer.offsetWidth;
  // force scrollbars
  outer.style.overflow = "scroll";

  // add innerdiv
  const inner = document.createElement("div");
  inner.style.width = "100%";
  outer.appendChild(inner);

  const widthWithScroll = inner.offsetWidth;

  // remove divs
  document.body.removeChild(outer);

  return widthNoScroll - widthWithScroll;
}

const MY_SCROLL_WIDTH = 15;

const WORKAROUND_GAP = 5;

/**
 * This component is a container with own scrollbar
 * It takes 100% height
 *
 * Currently it is not using resize observer so use key prop to force rerender
 * Same applies to scrollToTop - just use key prop
 */
export const ScrollableContainer: React.FC<{
  forceMeRecalculateHeight?: unknown;
}> = ({ children, forceMeRecalculateHeight }) => {
  const browserScrollWidth = React.useMemo(() => getDefaultScrollBarWidth() + WORKAROUND_GAP, []);

  const ref = React.useRef<HTMLDivElement>(null);

  const [barTop, setBarTop] = React.useState<null | number>(null);
  const [barHeight, setBarHeight] = React.useState<null | number>(null);

  const updateBarHeight = React.useCallback(() => {
    const div = ref.current;
    if (!div) {
      return;
    }
    const ratio = div.clientHeight / div.scrollHeight;

    if (ratio < 1) {
      setBarHeight(Math.round(div.clientHeight * ratio));
    } else {
      setBarHeight(null);
    }
  }, [forceMeRecalculateHeight]);

  // TODO: Maybe add mutation or resize observer?
  React.useEffect(() => updateBarHeight(), [updateBarHeight]);

  const updateBarTop = React.useCallback(() => {
    const div = ref.current;
    if (!div) {
      return;
    }
    //const ratio = div.scrollTop / (div.scrollHeight - div.clientHeight);
    const ratio = div.scrollTop / div.scrollHeight;
    setBarTop(Math.round(div.clientHeight * ratio));
  }, []);

  React.useEffect(() => updateBarTop(), [updateBarTop]);

  //console.info("render", barHeight, barTop);

  React.useEffect(() => {
    const onResize = () => {
      updateBarHeight();
      updateBarTop();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [updateBarHeight, updateBarTop]);

  const isMouseDown = React.useRef(false);

  React.useEffect(() => {
    const onMouseUp = () => {
      isMouseDown.current = false;
    };
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  React.useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // console.info("kek", isMouseDown.current, ref.current);
      if (!isMouseDown.current) {
        return;
      }
      const div = ref.current;
      if (!div) {
        return;
      }

      const scrollTopChange = (e.movementY * div.scrollHeight) / div.clientHeight;
      div.scrollTop += scrollTopChange;
    };
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  });

  // A workaround with small overflow to hide browser scrollbar
  return (
    <div style={{ height: "100%", overflow: "hidden", position: "relative" }}>
      <div
        style={{
          height: "100%",
          width: `calc(100% + ${browserScrollWidth}px)`,
          paddingRight:
            browserScrollWidth + (barTop !== null && barHeight !== null ? MY_SCROLL_WIDTH : 0),

          overflowY: "scroll",
        }}
        onScroll={updateBarTop}
        ref={ref}
      >
        {children}
      </div>

      {barTop !== null && barHeight !== null && (
        <div
          style={{
            position: "absolute",
            right: 0,
            width: MY_SCROLL_WIDTH,
            top: barTop,
            height: barHeight,
            userSelect: "none",
          }}
          className="rcs-inner-handle"
          onMouseDown={(e) => {
            isMouseDown.current = true;
          }}
        />
      )}
    </div>
  );
};
