import * as React from "react";

export function useDarkTheme() {
  React.useEffect(() => {
    const meta = document.createElement("meta");
    meta.setAttribute("content", "#000000");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);
}
