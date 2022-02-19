/**
 * true - go fullscreen
 * false - exit fullscreen
 * undefined - toggle fullscreen
 */
export function toggleFullscreen(forceFullscreenState?: boolean) {
  if (!document.fullscreenElement && forceFullscreenState !== false) {
    document.documentElement.requestFullscreen().catch((e) => console.warn(e));
  } else {
    if (document.exitFullscreen && forceFullscreenState !== true) {
      document.exitFullscreen().catch((e) => console.warn(e));
    }
  }
}
