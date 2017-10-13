import * as pako from 'pako';

export const CACHE_NAME = 'SpaceRangersCache';

export const DATA_DIR = 'data/';
export const INDEX_JSON = DATA_DIR + 'index.json.gz';

export function getJson(url: string, inflate = false) {
    return getBinary(url, inflate).then(data => {
        return JSON.parse(data.toString())
    })
}

export function getBinary(url: string, inflate = false) {
    return new Promise<Buffer>((resolv, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';

        xhr.onload = e => {
            if (xhr.status == 200) {
                const fileReader = new FileReader();
                fileReader.onload = () => {
                    if (inflate) {
                        const data = fileReader.result;
                        try {
                            const unpacked = pako.ungzip(data);
                            resolv(new Buffer(unpacked));
                        } catch (e) {
                            reject(new Error(e))
                        }
                    } else {
                        resolv(new Buffer(fileReader.result));
                    }
                };
                fileReader.readAsArrayBuffer(xhr.response);
            } else {
                reject(new Error(`Url '${url}' status is ${xhr.status}`))
            }
        };

        xhr.send();
    })
}