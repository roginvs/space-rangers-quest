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
  const isHidden = useDocumentHidden();

  const audioElementSavedCurrentTimeBeforeDocumentBecomeHidden = React.useRef(0);

  React.useEffect(() => {
    audioElementSavedCurrentTimeBeforeDocumentBecomeHidden.current = 0;
  }, [src]);

  React.useEffect(() => {
    if (isHidden) {
      return;
    }

    const audio = document.createElement("audio");
    audio.src = src;
    audio.controls = false;
    audio.style.display = "none";
    audio.autoplay = true;
    audio.onended = onEnded;
    audio.currentTime = audioElementSavedCurrentTimeBeforeDocumentBecomeHidden.current;
    document.body.appendChild(audio);

    const play = () => {
      void audio.play();
    };
    document.addEventListener("click", play);
    document.addEventListener("touchstart", play);
    play();

    return () => {
      document.removeEventListener("click", play);
      document.removeEventListener("touchstart", play);
      audioElementSavedCurrentTimeBeforeDocumentBecomeHidden.current = audio.currentTime;
      document.body.removeChild(audio);
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
    };
  }, [src, onEnded, isHidden]);

  return null;
}

function getRandom<T>(list: T[]): T {
  const i = Math.floor(Math.random() * list.length);
  return list[i];
}
export function Music({ urls }: { urls: string[] }) {
  const [url, setUrl] = React.useState(getRandom(urls));

  // Ignore dependencies to avoid audio pause-play
  // Array contains same elements, but it is new array each time
  const onEnded = React.useCallback(() => setUrl(getRandom(urls)), []);
  return <AudioPauseInBackground src={url} onEnded={onEnded} />;
}
