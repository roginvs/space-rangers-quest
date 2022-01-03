import { parseHexRgb } from "./core/color";

export const colors = {
  background: "#aaaaaa",
  location: {
    starting: "#5555ff",
    final: "#00ff00",
    intermediate: "#ffffff",
    empty: "#004101",
    fail: "#d20000",
  },
  jump: {
    withDescription: {
      begin: parseHexRgb("#ffffff"),
      end: parseHexRgb("#0000ff"),
    },
    withoutDescription: {
      begin: parseHexRgb("#00ddff"),
      end: parseHexRgb("#00aaaa"),
    },
    sameTextWithDescription: {
      begin: parseHexRgb("#ffffff"),
      end: parseHexRgb("#800000"),
    },
    sameTextWithoutDescription: {
      begin: parseHexRgb("#f5c896"),
      end: parseHexRgb("#800000"),
    },
    empty: {
      begin: parseHexRgb("#ffffff"),
      end: parseHexRgb("#004000"),
    },
    /* what's this? sometimes jump arrow is painted so */
    arrow: "#0000ff",
  },

  backgroundJumpsStats: "#e7e298",
  unlimitedPassingJump: "#0000ff",
  limitedPassingJump: "#ff0000",
  selectionOutbound: "#000000",
  selectionInbound: "#ff8040",
} as const;
