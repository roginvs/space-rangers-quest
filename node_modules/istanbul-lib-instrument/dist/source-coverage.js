"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SourceCoverage = void 0;

var _istanbulLibCoverage = require("istanbul-lib-coverage");

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function cloneLocation(loc) {
  return {
    start: {
      line: loc && loc.start.line,
      column: loc && loc.start.column
    },
    end: {
      line: loc && loc.end.line,
      column: loc && loc.end.column
    }
  };
}
/**
 * SourceCoverage provides mutation methods to manipulate the structure of
 * a file coverage object. Used by the instrumenter to create a full coverage
 * object for a file incrementally.
 *
 * @private
 * @param pathOrObj {String|Object} - see the argument for {@link FileCoverage}
 * @extends FileCoverage
 * @constructor
 */


var SourceCoverage =
/*#__PURE__*/
function (_classes$FileCoverage) {
  _inherits(SourceCoverage, _classes$FileCoverage);

  function SourceCoverage(pathOrObj) {
    var _this;

    _classCallCheck(this, SourceCoverage);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(SourceCoverage).call(this, pathOrObj));
    _this.meta = {
      last: {
        s: 0,
        f: 0,
        b: 0
      }
    };
    return _this;
  }

  _createClass(SourceCoverage, [{
    key: "newStatement",
    value: function newStatement(loc) {
      var s = this.meta.last.s;
      this.data.statementMap[s] = cloneLocation(loc);
      this.data.s[s] = 0;
      this.meta.last.s += 1;
      return s;
    }
  }, {
    key: "newFunction",
    value: function newFunction(name, decl, loc) {
      var f = this.meta.last.f;
      name = name || '(anonymous_' + f + ')';
      this.data.fnMap[f] = {
        name: name,
        decl: cloneLocation(decl),
        loc: cloneLocation(loc),
        // DEPRECATED: some legacy reports require this info.
        line: loc && loc.start.line
      };
      this.data.f[f] = 0;
      this.meta.last.f += 1;
      return f;
    }
  }, {
    key: "newBranch",
    value: function newBranch(type, loc) {
      var b = this.meta.last.b;
      this.data.b[b] = [];
      this.data.branchMap[b] = {
        loc: cloneLocation(loc),
        type: type,
        locations: [],
        // DEPRECATED: some legacy reports require this info.
        line: loc && loc.start.line
      };
      this.meta.last.b += 1;
      return b;
    }
  }, {
    key: "addBranchPath",
    value: function addBranchPath(name, location) {
      var bMeta = this.data.branchMap[name],
          counts = this.data.b[name];
      /* istanbul ignore if: paranoid check */

      if (!bMeta) {
        throw new Error("Invalid branch " + name);
      }

      bMeta.locations.push(cloneLocation(location));
      counts.push(0);
      return counts.length - 1;
    }
    /**
     * Assigns an input source map to the coverage that can be used
     * to remap the coverage output to the original source
     * @param sourceMap {object} the source map
     */

  }, {
    key: "inputSourceMap",
    value: function inputSourceMap(sourceMap) {
      this.data.inputSourceMap = sourceMap;
    }
  }, {
    key: "freeze",
    value: function freeze() {
      // prune empty branches
      var map = this.data.branchMap,
          branches = this.data.b;
      Object.keys(map).forEach(function (b) {
        if (map[b].locations.length === 0) {
          delete map[b];
          delete branches[b];
        }
      });
    }
  }]);

  return SourceCoverage;
}(_istanbulLibCoverage.classes.FileCoverage);

exports.SourceCoverage = SourceCoverage;