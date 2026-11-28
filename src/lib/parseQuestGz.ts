import * as pako from "pako";
import { parse, QM } from "./qmreader";

export function parseQuestGz(buffer: ArrayBuffer | Uint8Array): QM {
  return parse(Buffer.from(pako.ungzip(Buffer.from(buffer))));
}

export function loadQuestFromUrl(
  url: string,
  onProgress?: (progress: number) => void,
): Promise<QM> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";

    xhr.onload = () => {
      if (xhr.status <= 299) {
        resolve(xhr.response);
      } else {
        reject(new Error(`Url ${url} ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error(`${xhr.statusText}`));
    };

    if (onProgress) {
      xhr.onprogress = (e) => {
        onProgress(e.loaded / e.total);
      };
    }

    xhr.send();
  }).then((questArrayBuffer) => parseQuestGz(questArrayBuffer));
}
