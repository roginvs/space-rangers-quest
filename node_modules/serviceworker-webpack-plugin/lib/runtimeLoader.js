'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//  weak

module.exports = function defaultExport() {};

// The loaders are called from right to left.
module.exports.pitch = function pitch() {
  var _this = this;

  // Makes the loader asyn.
  var callback = this.async();
  var templatePath = _path2.default.join(__dirname, './runtimeTemplate.js');

  // Make this loader cacheable.
  this.cacheable();
  // Explicit the cache dependency.
  this.addDependency(templatePath);

  _fs2.default.readFile(templatePath, 'utf-8', function (err, template) {
    if (err) {
      callback(err);
      return;
    }

    var source = ('\n      var serviceWorkerOption = ' + _this.query.slice(1) + ';\n      ' + template + '\n    ').trim();
    callback(null, source);
  });
};