'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
//  weak

function applyUpdate() {
  return new Promise(function (resolve, reject) {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistration().then(function (registration) {
        if (!registration || !registration.waiting) {
          reject();
          return;
        }

        registration.waiting.postMessage({
          action: 'skipWaiting'
        });

        resolve();
      });
    } else {
      reject();
    }
  });
}

exports.default = applyUpdate;
module.exports = exports['default'];