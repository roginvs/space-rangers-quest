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
    //line: "black",
    // arrow: "black",
    withDescription: {
      begin: "#ffffff",
      end: "#0000ff",
    },
    withoutDescription: {
      begin: "#00ddff",
      end: "#00aaaa",
    },
    sameTextWithDescription: {
      begin: "#ffffff",
      end: "#800000",
    },
    sameTextWithoutDescription: {
      begin: "#f5c896",
      end: "#800000",
    },
    empty: {
      begin: "#ffffff",
      end: "#004000",
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
