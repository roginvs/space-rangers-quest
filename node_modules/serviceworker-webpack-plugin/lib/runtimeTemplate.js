"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/* eslint-disable flowtype/require-valid-file-annotation */
/* global serviceWorkerOption */

exports.default = {
  register: function register() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (navigator.serviceWorker) {
      return navigator.serviceWorker.register(serviceWorkerOption.scriptURL, options);
    }

    return false;
  }
};
module.exports = exports["default"];