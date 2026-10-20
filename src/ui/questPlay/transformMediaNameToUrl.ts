import { DATA_DIR } from "../consts";
import { audioMediaNameToMp3FileName } from "../../lib/mediaNames";

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

  if (kind === "img") {
    const extension = !filename.endsWith(".jpg") ? ".jpg" : "";
    return DATA_DIR + "img/" + filename + extension;
  }

  // Audible media is always served as mp3, even when quest references it as ogg
  return DATA_DIR + kind + "/" + audioMediaNameToMp3FileName(mediaName);
}
