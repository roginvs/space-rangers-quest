import * as React from "react";

export function useOnDocumentKeyUp(onKeyPress: (e: KeyboardEvent) => void) {
  React.useEffect(() => {
    document.addEventListener("keyup", onKeyPress);
    return () => {
      document.removeEventListener("keyup", onKeyPress);
    };
  }, [onKeyPress]);
}
