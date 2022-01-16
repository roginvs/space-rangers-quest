import * as React from "react";
import { DivFadeinCss } from "./common";

export function QuestPlayImage({
  src,
  allImagesUrls,
}: {
  src: string | null;
  allImagesUrls: (string | null)[];
}) {
  const [height, setHeight] = React.useState(0);

  return (
    <div
      style={{
        position: "relative",
        height,
      }}
    >
      {allImagesUrls.map((imageUrl) => {
        if (!imageUrl) {
          return null;
        }
        return (
          <img
            key={imageUrl}
            src={imageUrl}
            style={{
              width: "100%",
              position: "absolute",
              left: 0,
              right: 0,

              opacity: imageUrl === src ? 1 : 0,
              transition: "opacity 0.5s linear",
            }}
            onLoad={(e) => {
              if (e.currentTarget.height > height) {
                setHeight(e.currentTarget.height);
              }
            }}
          />
        );
      })}
    </div>
  );
}
