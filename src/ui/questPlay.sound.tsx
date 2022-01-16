import * as React from "react";

export function Sound({ url }: { url: string | null }) {
  const audioElement = React.useRef<HTMLAudioElement | null>(null);
  React.useEffect(() => {
    const play = () => {
      if (!audioElement.current) {
        return;
      }
      void audioElement.current.play();
    };
    play();
  }, [url]);

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
