import * as React from "react";
import { IMAGE_SIZE_X, IMAGE_SIZE_Y } from "./questPlay.consts";

/**
 * @deprecated
 */
export function QuestPlayImageFixed({
  src,
  allImagesUrls,
}: {
  src: string | null;
  allImagesUrls: (string | null)[];
}) {
  return (
    <div
      style={{
        width: IMAGE_SIZE_X,
        height: IMAGE_SIZE_Y,
        overflow: "hidden",
        position: "relative",
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

export function QuestPlayImageMobile({
  src,
  allImagesUrls,
}: {
  src: string | null;
  allImagesUrls: (string | null)[];
}) {
  if (allImagesUrls.indexOf(src) < 0) {
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
