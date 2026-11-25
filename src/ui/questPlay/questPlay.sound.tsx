import * as React from "react";

export function Sound({ url, playId }: { url: string | null; playId: number }) {
  const audioElement = React.useRef<HTMLAudioElement | null>(null);
  React.useEffect(() => {
    const el = audioElement.current;
    if (!el || !url) {
      return;
    }
    el.currentTime = 0;
    void el.play();
  }, [url, playId]);

  if (!url) {
    return null;
  }
  return (
    <audio
      autoPlay={true}
      controls={false}
      onEnded={() => {
        // Do nothing
      }}
      src={url}
      ref={audioElement}
    />
  );
}
