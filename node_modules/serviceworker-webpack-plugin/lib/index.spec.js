'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; //  weak
/* eslint-env mocha */

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _chai = require('chai');

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function trim(str) {
  return str.replace(/^\s+|\s+$/, '');
}

var filename = 'sw.js';
var webpackOutputPath = _path2.default.resolve('./tmp-build');
var makeWebpackConfig = function makeWebpackConfig(options) {
  return {
    entry: _path2.default.join(__dirname, '../test/test-build-entry'),
    mode: 'development',
    devtool: false,
    plugins: [new _index2.default(_extends({
      entry: _path2.default.join(__dirname, '../test/test-build-sw')
    }, options))],
    resolve: {
      alias: {
        'serviceworker-webpack-plugin/lib/runtime': _path2.default.join(__dirname, 'runtime.js')
      }
    },
    output: {
      path: webpackOutputPath
    }
  };
};

describe('ServiceWorkerPlugin', function () {
  beforeEach(function (done) {
    return (0, _rimraf2.default)(webpackOutputPath, done);
  });
  describe('options: filename', function () {
    it('should throw if trying to hash the filename', function () {
      _chai.assert.throws(function () {
        // eslint-disable-next-line no-new
        new _index2.default({
          filename: 'sw-[hash:7].js'
        });
      }, /The name of the/);
    });
    it('should strip double slashes', function (done) {
      var options = makeWebpackConfig({
        filename: '//sw.js'
      });
      return (0, _webpack2.default)(options, function (err, stats) {
        (0, _chai.expect)(err).to.equal(null);

        var _stats$toJson = stats.toJson(),
            assetsByChunkName = _stats$toJson.assetsByChunkName,
            errors = _stats$toJson.errors,
            warnings = _stats$toJson.warnings;

        (0, _chai.expect)(errors).to.have.length(0);
        (0, _chai.expect)(warnings).to.have.length(0);

        var mainFile = _fs2.default.readFileSync(_path2.default.join(webpackOutputPath, assetsByChunkName.main), 'utf8');
        (0, _chai.expect)(mainFile).to.include('var serviceWorkerOption = {"scriptURL":"/sw.js"}');
        done();
      });
    });
  });

  it('should correctly generate a service worker', function () {
    var options = makeWebpackConfig({
      filename: '//sw.js'
    });
    return (0, _webpack2.default)(options, function (err, stats) {
      (0, _chai.expect)(err).to.equal(null);

      var _stats$toJson2 = stats.toJson(),
          assetsByChunkName = _stats$toJson2.assetsByChunkName,
          errors = _stats$toJson2.errors,
          warnings = _stats$toJson2.warnings;

      (0, _chai.expect)(errors).to.have.length(0);
      (0, _chai.expect)(warnings).to.have.length(0);

      var swFile = _fs2.default.readFileSync(_path2.default.join(webpackOutputPath, 'sw.js'), 'utf8').replace(/\s+/g, ' ');

      // sw.js should reference main.js
      (0, _chai.expect)(swFile).to.include('var serviceWorkerOption = { "assets": [ "/main.js" ] }');
      // sw.js should include the webpack require code
      (0, _chai.expect)(swFile).to.include('function __webpack_require__(moduleId)');
    });
  });

  describe('options: includes', function () {
    it('should allow to have a white list parameter', function () {
      var _assets;

      var serviceWorkerPlugin = new _index2.default({
        filename: filename,
        includes: ['bar.*']
      });

      var compilation = {
        assets: (_assets = {}, _defineProperty(_assets, filename, {
          source: function source() {
            return '';
          }
        }), _defineProperty(_assets, 'bar.js', {}), _defineProperty(_assets, 'foo.js', {}), _assets),
        getStats: function getStats() {
          return {
            toJson: function toJson() {
              return {};
            }
          };
        }
      };

      return serviceWorkerPlugin.handleEmit(compilation, {
        options: {}
      }, function () {
        _chai.assert.strictEqual(compilation.assets[filename].source(), trim('\nvar serviceWorkerOption = {\n  "assets": [\n    "/bar.js"\n  ]\n};'));
      });
    });

    describe('options: transformOptions', function () {
      it('should be used', function () {
        var transformOptions = function transformOptions(serviceWorkerOption) {
          return {
            bar: 'foo',
            jsonStats: serviceWorkerOption.jsonStats
          };
        };

        var serviceWorkerPlugin = new _index2.default({
          filename: filename,
          transformOptions: transformOptions
        });

        var compilation = {
          assets: _defineProperty({}, filename, {
            source: function source() {
              return '';
            }
          }),
          getStats: function getStats() {
            return {
              toJson: function toJson() {
                return {
                  foo: 'bar'
                };
              }
            };
          }
        };

        return serviceWorkerPlugin.handleEmit(compilation, {
          options: {}
        }, function () {
          _chai.assert.strictEqual(compilation.assets[filename].source(), trim('\nvar serviceWorkerOption = {\n  "bar": "foo",\n  "jsonStats": {\n    "foo": "bar"\n  }\n};'));
        });
      });
    });
  });
});