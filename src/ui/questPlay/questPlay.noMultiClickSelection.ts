import * as React from "react";

/**
 * Double/triple clicks in the player (for example, quickly clicking choices)
 * make the browser select a word/line of text. This hook prevents that
 * selection while keeping normal drag-to-select text working.
 *
 * How: the browser starts a word/line selection on the mousedown of the
 * second/third click (`event.detail > 1`). Cancelling that mousedown cancels
 * the selection, but `click` events still fire, so choices and links keep
 * working. The first mousedown (`detail === 1`) is untouched, so dragging
 * selects text as usual. `user-select` is not changed.
 *
 * Only mouse clicks inside `.game-root` are affected. Form fields
 * (debug textarea/input) keep their native double-click behaviour.
 * Keyboard and touch (long-press selection) are not affected.
 */
export function useNoMultiClickSelection() {
  React.useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.detail <= 1) {
        return;
      }
      const target = e.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (!target.closest(".game-root")) {
        return;
      }
      if (target.closest("input, textarea, select, [contenteditable]")) {
        return;
      }
      e.preventDefault();
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);
}
