import * as React from "react";

function useDocumentHidden() {
  const [hidden, setHidden] = React.useState(document.visibilityState === "hidden");

  React.useEffect(() => {
    const update = () => {
      setHidden(document.visibilityState === "hidden");
    };
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  });

  return hidden;
}

function AudioPauseInBackground({ src, onEnded }: { src: string; onEnded: () => void }) {
  const audioElement = React.useRef<HTMLAudioElement | null>(null);
  const audioElementSavedCurrentTimeBeforeDocumentBecomeHidden = React.useRef(0);
  const isHidden = useDocumentHidden();

  React.useEffect(() => {
    audioElementSavedCurrentTimeBeforeDocumentBecomeHidden.current = 0;
  }, [src]);

  React.useEffect(() => {
    if (isHidden) {
      return;
    }

    if (audioElement.current) {
      audioElement.current.currentTime =
        audioElementSavedCurrentTimeBeforeDocumentBecomeHidden.current;
    }

    const play = () => {
      if (!audioElement.current) {
        return;
      }
      void audioElement.current.play();
    };
    document.addEventListener("click", play);
    document.addEventListener("touchstart", play);
    play();

    return () => {
      document.removeEventListener("click", play);
      document.removeEventListener("touchstart", play);
      audioElementSavedCurrentTimeBeforeDocumentBecomeHidden.current = audioElement.current
        ? audioElement.current.currentTime
        : 0;
      audioElement.current = null;
    };
  }, [isHidden]);

  if (isHidden) {
    return null;
  }
  return (
    <audio
      controls={false}
      autoPlay
      onEnded={onEnded}
      src={src}
      ref={element => {
        if (element) {
          // We need this element ref in side-effect which runs after render
          // So, we update ref only if element is mounted
          // We will clear this ref in side-effect
          audioElement.current = element;
        }
      }}
    />
  );
}

function getRandom<T>(list: T[]): T {
  const i = Math.floor(Math.random() * list.length);
  return list[i];
}
export function Music({ urls }: { urls: string[] }) {
  const [url, setUrl] = React.useState(getRandom(urls));

  return <AudioPauseInBackground src={url} onEnded={() => setUrl(getRandom(urls))} />;
}
