import * as React from "react";

export function QuestPlayImageMobile({
  src,
  allImagesUrls,
}: {
  src: string | null;
  allImagesUrls: (string | null)[];
}) {
  if (src && allImagesUrls.indexOf(src) < 0) {
    console.warn(`Image ${src} is not found in allImagesUrls`, allImagesUrls);
  }

  return (
    <>
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
              // This is needed to force the image to be over frame background
              position: "relative",
              display: imageUrl === src ? undefined : "none",
            }}
          />
        );
      })}
    </>
  );
}

export function QuestPlayImageDesktop({
  src,
  allImagesUrls,
}: {
  src: string | null;
  allImagesUrls: (string | null)[];
}) {
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {allImagesUrls.map((imageUrl) => {
        if (!imageUrl) {
          return null;
        }
        return (
          <div
            key={imageUrl}
            style={{
              width: "100%",
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              opacity: imageUrl === src ? 1 : 0,
              transition: "opacity 0.5s linear",
              backgroundImage: `url("${imageUrl}"`,
              backgroundSize: "cover",
              backgroundPosition: "center center",
            }}
          />
        );
      })}
    </div>
  );
}
