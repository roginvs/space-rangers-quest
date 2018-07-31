import * as pako from 'pako';

import { TextDecoder } from 'text-encoding';

import { INDEX_JSON, DATA_DIR } from "./consts";

export function getJson(url: string, inflate = false) {
    return getBinary(url, inflate).then(data => {
        return JSON.parse(new TextDecoder("utf-8").decode(data))
    })
}

export function getBinary(url: string, inflate = false) {
    return new Promise<Uint8Array>((resolv, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = e => {
            if (xhr.status == 200) {
                if (inflate) {
                    const unpacked = pako.ungzip(xhr.response);
                    resolv(unpacked)
                } else {
                    resolv(xhr.response);
                }
            } else {
                reject(new Error(`Url '${url}' status is ${xhr.status}`))
            }
        };

	xhr.onerror = e => {
	    reject(new Error(e.message))
	}

        xhr.send();
    })
}
