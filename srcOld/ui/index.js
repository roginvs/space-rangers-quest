"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("babel-polyfill");
var React = __importStar(require("react"));
var ReactDOM = __importStar(require("react-dom"));
var gamelist_1 = require("./gamelist");
/* Needed for collapsed button */
var $ = __importStar(require("jquery"));
window.jQuery = $; // A workaround for 'bootstrap'
window.$ = $; // A workaround to use $ in console
var Tether = __importStar(require("tether"));
window.Tether = Tether;
require("bootstrap"); // TODO: Types installed for bootstrap v3
require("bootstrap/dist/css/bootstrap.min.css");
require("./index.css");
var common_1 = require("./common");
var consts_1 = require("./consts");
var root = document.getElementById("root");
common_1.getJson(consts_1.INDEX_JSON)
    .then(function (index) { return ReactDOM.render(React.createElement(gamelist_1.GameList, { index: index }), root); })
    .catch(function (e) {
    return ReactDOM.render(React.createElement("div", { className: "p-3 text-warning" },
        "\u041E\u0448\u0438\u0431\u043A\u0430 ",
        e), root);
});
