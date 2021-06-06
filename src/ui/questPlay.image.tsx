import * as React from "react";
import { DivFadeinCss } from "./common";

export function QuestPlayImage({ src }: { src: string | null }) {
  const prevSrc = React.useRef<string | null>();

  React.useEffect(() => {
    return () => {
      prevSrc.current = src;
    };
  }, [src]);

  if (!src) {
    return null;
  }

  return (
    <DivFadeinCss key={src}>
      <img src={src} style={{ width: "100%" }} />
    </DivFadeinCss>
  );

  /*
  return (
    <div style={{ width: "100%", position: "relative" }}>
      <CurrentImage src={src} key={src} />
    </div>
  );
  */
}

/*
function PreviousImage({ src }: { src: string }) {
  const [left, setLeft] = React.useState(false);
  React.useEffect(() => {
    const timerId = setTimeout(() => setLeft(true), 1000);

    return () => {
      clearTimeout(timerId);
    };
  });

  return <img style={{ width: "100%", position: "absolute", left: 0, top: 0 }} src={src} />;
}
*/

/*
function CurrentImage({ src }: { src: string }) {
  const [entered, setEntered] = React.useState(false);
  React.useEffect(() => {
    const timerId = setTimeout(() => setEntered(true), 10);

    return () => {
      clearTimeout(timerId);
    };
  });

  return (
    <img
      key={src}
      style={{
        width: "100%",
        opacity: entered ? 1 : 0,
        position: "relative",
        transition: "opacity 250ms ease-in",
      }}
      src={src}
    />
  );
}
*/
