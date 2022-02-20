/**
 * true - go fullscreen
 * false - exit fullscreen
 * undefined - toggle fullscreen
 */
export function toggleFullscreen(forceFullscreenState?: boolean) {
  if (!document.fullscreenElement && forceFullscreenState !== false) {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((e) => console.warn(e));
    } else {
      const browserPrefixes = ["webkit", "moz", "ms", "o"];
      const unknownElem = elem as unknown as Record<string, unknown>;
      for (const key of browserPrefixes.map((prefix) => `${prefix}RequestFullScreen`)) {
        if (typeof unknownElem[key] === "function") {
          (unknownElem[key] as any)();
        }
      }
    }
  } else {
    if (document.exitFullscreen && forceFullscreenState !== true) {
      document.exitFullscreen().catch((e) => console.warn(e));
    }
  }
}
