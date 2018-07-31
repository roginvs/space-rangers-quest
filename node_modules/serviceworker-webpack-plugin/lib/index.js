'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); //  weak

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

var _SingleEntryPlugin2 = _interopRequireDefault(_SingleEntryPlugin);

var _minimatch = require('minimatch');

var _minimatch2 = _interopRequireDefault(_minimatch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function validatePaths(assets, options) {
  var depth = options.filename.replace(/^\//, '').split('/').length;
  var basePath = Array(depth).join('../') || './';

  return assets.filter(function (asset) {
    return !!asset;
  }).map(function (key) {
    // if absolute url, use it as is
    if (/^(?:\w+:)\/\//.test(key)) {
      return key;
    }

    key = key.replace(/^\//, '');

    if (options.publicPath !== '') {
      return options.publicPath + key;
    }

    return basePath + key;
  });
}

var COMPILER_NAME = 'serviceworker-plugin';

var ServiceWorkerPlugin = function () {
  function ServiceWorkerPlugin(options) {
    _classCallCheck(this, ServiceWorkerPlugin);

    this.options = [];
    this.warnings = [];

    this.options = Object.assign({
      publicPath: '/',
      excludes: ['**/.*', '**/*.map'],
      includes: ['**/*'],
      entry: null,
      filename: 'sw.js',
      template: function template() {
        return Promise.resolve('');
      },
      transformOptions: function transformOptions(serviceWorkerOption) {
        return {
          assets: serviceWorkerOption.assets
        };
      },
      minimize: process.env.NODE_ENV === 'production'
    }, options);

    if (this.options.filename.match(/\[hash/)) {
      throw new Error('The name of the service worker need to fixed across releases.\n        https://developers.google.com/web/fundamentals/instant-and-offline/service-worker/lifecycle#avoid_changing_the_url_of_your_service_worker_script');
    }
  }

  _createClass(ServiceWorkerPlugin, [{
    key: 'apply',
    value: function apply(compiler) {
      var _this = this;

      // compiler.hooks was introduced in webpack4, older versions are not supported
      if (compiler.hooks === undefined) {
        throw new Error('serviceworker-webpack-plugin requires webpack >= 4. Use serviceworker-webpack-plugin@0 on older versions of webpack');
      }

      var runtimePath = _path2.default.resolve(__dirname, './runtime.js');

      compiler.hooks.normalModuleFactory.tap('sw-plugin-nmf', function (nmf) {
        nmf.hooks.afterResolve.tapAsync('sw-plugin-after-resolve', function (result, callback) {
          // Hijack the original module
          if (result.resource === runtimePath) {
            var data = {
              scriptURL: _path2.default.join(_this.options.publicPath, _this.options.filename)
            };

            result.loaders.push(_path2.default.join(__dirname, 'runtimeLoader.js') + '?' + JSON.stringify(data));
          }

          callback(null, result);
        });
      });

      compiler.hooks.make.tapAsync('sw-plugin-make', function (compilation, callback) {
        if (_this.warnings.length) {
          var array = [];
          array.push.apply(compilation.warnings, _this.warnings);
        }

        _this.handleMake(compilation, compiler).then(function () {
          callback();
        }).catch(function () {
          callback(new Error('Something went wrong during the make event.'));
        });
      });

      compiler.hooks.emit.tapAsync('sw-plugin-emit', function (compilation, callback) {
        _this.handleEmit(compilation, compiler, callback);
      });
    }
  }, {
    key: 'handleMake',
    value: function handleMake(compilation, compiler) {
      var childCompiler = compilation.createChildCompiler(COMPILER_NAME, {
        filename: this.options.filename
      });

      var childEntryCompiler = new _SingleEntryPlugin2.default(compiler.context, this.options.entry);
      childEntryCompiler.apply(childCompiler);

      // Fix for "Uncaught TypeError: __webpack_require__(...) is not a function"
      // Hot module replacement requires that every child compiler has its own
      // cache. @see https://github.com/ampedandwired/html-webpack-plugin/pull/179
      childCompiler.hooks.compilation.tap('sw-plugin-compilation', function (compilation2) {
        if (compilation2.cache) {
          if (!compilation2.cache[COMPILER_NAME]) {
            compilation2.cache[COMPILER_NAME] = {};
          }
          compilation2.cache = compilation2.cache[COMPILER_NAME];
        }
      });

      // Compile and return a promise.
      return new Promise(function (resolve, reject) {
        childCompiler.runAsChild(function (err) {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        });
      });
    }
  }, {
    key: 'handleEmit',
    value: function handleEmit(compilation, compiler, callback) {
      var _this2 = this;

      var asset = compilation.assets[this.options.filename];

      if (!asset) {
        compilation.errors.push(new Error('ServiceWorkerPlugin: the `entry` option is incorrect.'));
        callback();
        return;
      }

      var jsonStats = compilation.getStats().toJson({
        hash: false,
        publicPath: false,
        assets: true,
        chunks: false,
        modules: true,
        source: false,
        errorDetails: false,
        timings: false
      });

      delete compilation.assets[this.options.filename];

      var assets = Object.keys(compilation.assets);
      var excludes = this.options.excludes;

      if (excludes.length > 0) {
        assets = assets.filter(function (assetCurrent) {
          return !excludes.some(function (glob) {
            return (0, _minimatch2.default)(assetCurrent, glob);
          });
        });
      }

      var includes = this.options.includes;

      if (includes.length > 0) {
        assets = assets.filter(function (assetCurrent) {
          return includes.some(function (glob) {
            return (0, _minimatch2.default)(assetCurrent, glob);
          });
        });
      }

      assets = validatePaths(assets, this.options);

      var serviceWorkerOption = this.options.transformOptions({
        assets: assets,
        jsonStats: jsonStats
      });

      var templatePromise = this.options.template(serviceWorkerOption);

      templatePromise.then(function (template) {
        var serviceWorkerOptionInline = JSON.stringify(serviceWorkerOption, null, _this2.options.minimize ? 0 : 2);

        var _source = ('\n        var serviceWorkerOption = ' + serviceWorkerOptionInline + ';\n        ' + template + '\n        ' + asset.source() + '\n      ').trim();

        compilation.assets[_this2.options.filename] = {
          source: function source() {
            return _source;
          },
          size: function size() {
            return Buffer.byteLength(_source, 'utf8');
          }
        };

        callback();
      });
    }
  }]);

  return ServiceWorkerPlugin;
}();

exports.default = ServiceWorkerPlugin;
module.exports = exports['default'];