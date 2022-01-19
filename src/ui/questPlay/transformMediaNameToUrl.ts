import { DATA_DIR } from "../consts";

export function transformMedianameToUrl(
  mediaName: string | null,
  kind: "img" | "track" | "sound",
): string | null {
  if (!mediaName) {
    return null;
  }

  const filename = mediaName.toLowerCase();
  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    // No transformation for absolute urls
    return mediaName;
  }
  const extensionKind = {
    img: ".jpg",
    track: ".mp3",
    sound: ".mp3",
  }[kind];

  const folderKind = {
    img: "img",
    track: "track",
    sound: "sound",
  }[kind];
  const extension = !filename.endsWith(extensionKind) ? extensionKind : "";
  return DATA_DIR + folderKind + "/" + filename + extension;
}
