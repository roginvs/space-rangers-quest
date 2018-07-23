"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var pako = __importStar(require("pako"));
var text_encoding_1 = require("text-encoding");
function getJson(url, inflate) {
    if (inflate === void 0) { inflate = false; }
    return getBinary(url, inflate).then(function (data) {
        return JSON.parse(new text_encoding_1.TextDecoder("utf-8").decode(data));
    });
}
exports.getJson = getJson;
function getBinary(url, inflate) {
    if (inflate === void 0) { inflate = false; }
    return new Promise(function (resolv, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function (e) {
            if (xhr.status == 200) {
                if (inflate) {
                    var unpacked = pako.ungzip(xhr.response);
                    resolv(unpacked);
                }
                else {
                    resolv(xhr.response);
                }
            }
            else {
                reject(new Error("Url '" + url + "' status is " + xhr.status));
            }
        };
        xhr.onerror = function (e) {
            reject(new Error(e.message));
        };
        xhr.send();
    });
}
exports.getBinary = getBinary;
