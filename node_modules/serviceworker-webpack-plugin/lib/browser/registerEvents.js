'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
//  weak

function registerEvents(registration, callbacks) {
  var sendEvent = function sendEvent(event) {
    if (typeof callbacks[event] === 'function') {
      callbacks[event]();
    }
  };

  var handleUpdating = function handleUpdating(registration2) {
    var serviceworker = registration2.installing || registration2.waiting;
    var ignoreWaiting = void 0;

    // No SW or already handled
    if (!serviceworker || serviceworker.onstatechange) {
      return;
    }

    if (registration2.waiting) {
      ignoreWaiting = true;
    }

    function onUpdateStateChange() {
      switch (serviceworker.state) {
        case 'redundant':
          sendEvent('onUpdateFailed');
          serviceworker.onstatechange = null;
          break;

        case 'installing':
          sendEvent('onUpdating');
          break;

        case 'installed':
          if (!ignoreWaiting) {
            sendEvent('onUpdateReady');
          }
          break;

        case 'activated':
          sendEvent('onUpdated');
          serviceworker.onstatechange = null;
          break;

        default:
          break;
      }
    }

    function onInstallStateChange() {
      switch (serviceworker.state) {
        case 'redundant':
          // Failed to install, ignore
          serviceworker.onstatechange = null;
          break;

        case 'activated':
          sendEvent('onInstalled');
          serviceworker.onstatechange = null;
          break;

        default:
          break;
      }
    }

    var stateChangeHandler = void 0;

    // Already has a SW
    if (registration2.active) {
      onUpdateStateChange();
      stateChangeHandler = onUpdateStateChange;
    } else {
      onInstallStateChange();
      stateChangeHandler = onInstallStateChange;
    }

    serviceworker.onstatechange = stateChangeHandler;
  };

  registration.then(function (registration2) {
    handleUpdating(registration2);
    registration2.onupdatefound = function () {
      handleUpdating(registration2);
    };
  }).catch(function (err) {
    sendEvent('onError');
    return Promise.reject(err);
  });
}

exports.default = registerEvents;
module.exports = exports['default'];