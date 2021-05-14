import * as React from "react";

function getRandom<T>(list: T[]): T {
  const i = Math.floor(Math.random() * list.length);
  return list[i];
}

export function Music({ urls }: { urls: string[] }) {
  const audioElement = React.useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = React.useState(getRandom(urls));

  React.useEffect(() => {
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
    };
  }, [url]);

  return (
    <audio
      autoPlay={true}
      controls={false}
      onEnded={() => {
        setUrl(getRandom(urls));
      }}
      src={url}
      ref={audioElement}
    />
  );
}
