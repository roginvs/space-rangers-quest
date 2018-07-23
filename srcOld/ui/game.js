"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = __importStar(require("react"));
var gamelist_1 = require("./gamelist");
require("./game.css");
var ReactCSSTransitionGroup = __importStar(require("react-addons-css-transition-group"));
var consts_1 = require("./consts");
var GAME_STATE = "SpaceRangesGameState";
var MUSIC_STATE = "SpaceRangesMusicIsOff";
var TransitionInOpacity = /** @class */ (function (_super) {
    __extends(TransitionInOpacity, _super);
    function TransitionInOpacity() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TransitionInOpacity.prototype.render = function () {
        return (React.createElement(ReactCSSTransitionGroup, { transitionName: "gamebyopacity", transitionEnterTimeout: 300, transitionLeave: false }, this.props.children));
    };
    return TransitionInOpacity;
}(React.Component));
/* TODO:
    - На узких сделать картинку сверху
    - Теги везде
*/
var GamePlay = /** @class */ (function (_super) {
    __extends(GamePlay, _super);
    function GamePlay(props) {
        var _this = _super.call(this, props) || this;
        _this.jumbotron = null;
        _this.audio = null;
        _this.state = {
            music: localStorage.getItem(MUSIC_STATE) ? false : true,
            jumpsCountForAnimation: 0
        };
        var oldGame = localStorage.getItem(gamelist_1.GAME_NAME);
        if (oldGame === _this.props.gameName) {
            try {
                var oldState = localStorage.getItem(GAME_STATE);
                _this.props.player.loadSaving(JSON.parse(oldState || ""));
            }
            catch (e) {
                console.warn("Failed to load game", e);
                _this.props.player.start();
            }
        }
        else {
            _this.props.player.start();
        }
        document.location.hash = _this.props.gameName;
        return _this;
    }
    GamePlay.prototype.replaceTags = function (str) {
        // Я не знаю как это сделать React-way
        /*  x.match(/\<format=(left|right|center),(\d+)\>(.*?)\<\/format\>/)
[ '<format=left,30>текст</format>',
  'left',
  '30',
  'текст',
*/
        var cloneStr = str.slice();
        while (true) {
            var m = cloneStr.match(/\<format=(left|right|center),(\d+)\>(.*?)\<\/format\>/);
            if (!m) {
                break;
            }
            var textToReplace = m[0], whereToPad = m[1], howManyPadStr = m[2], textInTags = m[3];
            var howManyPad = parseInt(howManyPadStr);
            if (!(howManyPad &&
                (whereToPad === "left" ||
                    whereToPad === "right" ||
                    whereToPad === "center"))) {
                cloneStr = cloneStr.replace(textToReplace, textInTags);
                continue;
            }
            var newText = textInTags.slice();
            while (true) {
                if (newText.replace(/\<.*?\>/g, "").length >= howManyPad) {
                    break;
                }
                if (whereToPad === "left") {
                    newText = " " + newText;
                }
                else if (whereToPad === "right") {
                    newText = newText + " ";
                }
                else {
                    newText =
                        newText.length % 2 ? " " + newText : newText + " ";
                }
            }
            // console.info(`Replacing part '${textToReplace}' to '${newText}'`)
            cloneStr = cloneStr.replace(textToReplace, newText);
        }
        var s = "&nbsp" +
            cloneStr
                .replace(/\r\n/g, "<br/>&nbsp")
                .replace(/\n/g, "<br/>&nbsp")
                .replace(/<clr>/g, '<span class="text-success">')
                .replace(/<clrEnd>/g, "</span>")
                .replace(/<fix>/g, '<span class="game-fix">')
                .replace(/<\/fix>/g, "</span>");
        // console.info('Replace', str, s)
        return {
            __html: s
        };
    };
    GamePlay.prototype.play = function (restart) {
        if (this.audio) {
            if (!this.audio.src || restart) {
                var i = Math.floor(Math.random() * this.props.musicList.length);
                this.audio.src = consts_1.DATA_DIR + this.props.musicList[i];
            }
        }
    };
    GamePlay.prototype.saveState = function () {
        var gameState = this.props.player.getSaving();
        localStorage.setItem(GAME_STATE, JSON.stringify(gameState));
        localStorage.setItem(gamelist_1.GAME_NAME, this.props.gameName);
        localStorage.setItem(MUSIC_STATE, this.state.music ? "" : "off");
    };
    /*
    componentWillMount() {
        document.getElementsByTagName('body')[0].className = 'game'
    }
    componentWillUnmount() {
        document.getElementsByTagName('body')[0].className = ''
    }
    */
    GamePlay.prototype.render = function () {
        var _this = this;
        var _a;
        try {
            var st = this.props.player.getState();
            if (st.gameState === "win") {
                this.props.onPassed();
            }
            var image = st.imageFileName ? (React.createElement("img", { className: "game-img", src: consts_1.DATA_DIR + "img/" + st.imageFileName })) : null;
            // <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" width="343" height="392" alt="" />
            var choices = st.choices.map(function (choice) {
                return (React.createElement("li", { key: choice.jumpId, className: "mb-4" },
                    React.createElement("a", { href: "#" + _this.props.gameName, onClick: function (e) {
                            if (_this.state.music && _this.audio) {
                                _this.audio.play();
                            }
                            // e.preventDefault();
                            _this.props.player.performJump(choice.jumpId);
                            _this.saveState();
                            if (_this.props.player.getState().gameState ===
                                "win") {
                                _this.props.onPassed();
                            }
                            _this.setState({
                                jumpsCountForAnimation: _this.state.jumpsCountForAnimation + 1
                            }, function () {
                                /*
                                if (this.jumbotron) {
                                    this.jumbotron.scrollIntoView({
                                        block: "start",
                                        behavior: "smooth"
                                    });
                                }*/
                            });
                        }, className: "game " + (choice.active ? "" : "disabled"), dangerouslySetInnerHTML: _this.replaceTags(choice.text) })));
            });
            var music = this.state.music ? (React.createElement("audio", { autoPlay: true, controls: false, onEnded: function (e) { return _this.play(true); }, ref: function (e) {
                    _this.audio = e;
                    _this.play(false);
                } })) : null;
            var imagesPreloaded = this.props.player
                .getAllImagesToPreload()
                .map(function (x) {
                return (React.createElement("img", { key: x, src: consts_1.DATA_DIR + "img/" + x, style: { display: "none" } }));
            });
            return (React.createElement("div", null,
                React.createElement("nav", { className: "navbar navbar-toggleable navbar-inverse bg-inverse" },
                    React.createElement("button", { className: "navbar-toggler navbar-toggler-right", type: "button", "data-toggle": "collapse", "data-target": "#navbarsExampleDefault", "aria-controls": "navbarsExampleDefault", "aria-expanded": "false", "aria-label": "Toggle navigation" },
                        React.createElement("span", { className: "navbar-toggler-icon" })),
                    React.createElement("a", { className: "navbar-brand", href: "#" }, this.props.gameName),
                    React.createElement("div", { className: "collapse navbar-collapse", id: "navbarsExampleDefault" },
                        React.createElement("ul", { className: "navbar-nav mr-auto" },
                            React.createElement("li", { className: "nav-item" },
                                React.createElement("a", { className: "nav-link", href: "#", onClick: function (e) {
                                        e.preventDefault();
                                        _this.props.player.start();
                                        _this.forceUpdate();
                                    } }, this.props.lang === "rus"
                                    ? "Сначала"
                                    : "Restart")),
                            React.createElement("li", { className: "nav-item" },
                                React.createElement("a", { className: "nav-link " +
                                        (this.state.music
                                            ? ""
                                            : "text-muted"), href: "#", onClick: function (e) {
                                        e.preventDefault();
                                        _this.setState({
                                            music: !_this.state.music
                                        }, function () { return _this.saveState(); });
                                    } }, this.props.lang === "rus"
                                    ? "Музыка"
                                    : "Music")),
                            React.createElement("li", { className: "nav-item" },
                                React.createElement("a", { className: "nav-link", href: "#", onClick: function (e) {
                                        e.preventDefault();
                                        document.location.hash = "";
                                        _this.props.onReturn(_this.props.gameName);
                                    } }, this.props.lang === "rus"
                                    ? "Выход"
                                    : "Exit"))))),
                React.createElement("div", { id: this.props.gameName }),
                React.createElement("div", { className: "jumbotron", ref: function (e) { return (_this.jumbotron = e); } },
                    React.createElement("div", { className: "container" },
                        React.createElement("div", { className: "row mb-1" },
                            React.createElement("div", { className: "col-12 col-sm-8 mb-3" },
                                React.createElement(TransitionInOpacity, null,
                                    React.createElement("div", { key: st.text +
                                            "#" +
                                            this.state
                                                .jumpsCountForAnimation, dangerouslySetInnerHTML: this.replaceTags(st.text) }))),
                            React.createElement("div", { className: "col-12 col-sm-4 flex-first flex-sm-last mb-3" },
                                imagesPreloaded,
                                React.createElement(TransitionInOpacity, null, image))),
                        React.createElement("div", { className: "row" },
                            React.createElement("div", { className: "col-12 col-sm-8 mb-3" },
                                React.createElement(TransitionInOpacity, null,
                                    React.createElement("ul", { key: choices.join("#") +
                                            "#" +
                                            this.state
                                                .jumpsCountForAnimation }, choices))),
                            React.createElement("div", { className: "col-12 col-sm-4 flex-first flex-sm-last mb-3" },
                                React.createElement(TransitionInOpacity, null, (_a = []).concat.apply(_a, st.paramsState.map(function (x) {
                                    return x.split("<br>");
                                })).map(function (paramText, index) {
                                    return (React.createElement("div", { key: paramText +
                                            "###" +
                                            index, style: {
                                            whiteSpace: "pre-wrap",
                                            textAlign: "center",
                                            minHeight: '1em'
                                        }, dangerouslySetInnerHTML: _this.replaceTags(paramText) }));
                                })))))),
                music));
        }
        catch (e) {
            console.error(e);
            return (React.createElement("div", { className: "p-3" },
                React.createElement("div", null,
                    "Error: ",
                    e.message),
                React.createElement("div", null,
                    React.createElement("a", { href: "#", onClick: function (e) {
                            e.preventDefault();
                            _this.props.onReturn(_this.props.gameName);
                        } }, "\u0412\u044B\u0445\u043E\u0434"))));
        }
    };
    return GamePlay;
}(React.Component));
exports.GamePlay = GamePlay;
