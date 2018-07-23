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
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = __importStar(require("react"));
var qmreader_1 = require("../lib/qmreader");
var qmplayer_1 = require("../lib/qmplayer");
var game_1 = require("./game");
require("./gamelist.css");
var consts_1 = require("./consts");
var common_1 = require("./common");
exports.GAME_NAME = 'SpaceRangesGameName';
exports.GAME_LIST_FILTER = 'SpaceRangesGameListFilter';
/*
interface ServiceWorkerRegistrationOptions {
    scope?: string;
}
interface ServiceWorkerContainer {
    controller?: ServiceWorker;
    oncontrollerchange?: (event?: Event) => any;
    onerror?: (event?: Event) => any;
    onmessage?: (event?: Event) => any;
    ready: Promise<ServiceWorkerRegistration>;
    getRegistration(scope?: string): Promise<ServiceWorkerRegistration>;
    getRegistrations(): Promise<Array<ServiceWorkerRegistration>>;
    register(url: string, options?: ServiceWorkerRegistrationOptions): Promise<ServiceWorkerRegistration>;
}
*/
var SHOW_ALLOWED_QUESTS = 500;
var PASSED_QUESTS = 'SpaceRangersPassedQuests';
var LANG = 'SpaceRangersLang';
function loadGame(game) {
    return __awaiter(this, void 0, void 0, function () {
        var data, qm, player;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, common_1.getBinary(consts_1.DATA_DIR + game.filename, true)];
                case 1:
                    data = _a.sent();
                    qm = qmreader_1.parse(new Buffer(data));
                    player = new qmplayer_1.QMPlayer(qm, game.images, game.lang);
                    return [2 /*return*/, player];
            }
        });
    });
}
var GameList = /** @class */ (function (_super) {
    __extends(GameList, _super);
    function GameList(props) {
        var _this = _super.call(this, props) || this;
        var passedQuestsGameNames = [];
        try {
            var fromLocal = localStorage.getItem(PASSED_QUESTS);
            if (fromLocal) {
                passedQuestsGameNames = JSON.parse(fromLocal);
            }
        }
        catch (e) {
            console.warn("Unable to read stored passed quests", e);
        }
        ;
        _this.state = {
            passedQuestsGameNames: passedQuestsGameNames,
            error: undefined,
            lang: localStorage.getItem(LANG) !== 'eng' ? 'rus' : 'eng',
            serviceWorkerBusy: undefined,
            storageInfo: undefined
        };
        (function () { return __awaiter(_this, void 0, void 0, function () {
            var runningGame, game, player;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runningGame = localStorage.getItem(exports.GAME_NAME) || document.location.hash.replace(/^#/, '');
                        if (!runningGame) return [3 /*break*/, 2];
                        game = this.quests.find(function (x) { return x.gameName === runningGame; });
                        if (!game) return [3 /*break*/, 2];
                        this.setState({
                            loading: (this.state.lang === 'rus' ? 'Загрузка' : 'Loading') + " " + game.gameName
                        });
                        return [4 /*yield*/, loadGame(game)];
                    case 1:
                        player = _a.sent();
                        this.setState({
                            gamePlaying: {
                                player: player,
                                gameName: game.gameName,
                            },
                            loading: undefined
                        });
                        return [2 /*return*/];
                    case 2:
                        document.location.hash = "";
                        this.setState({
                            loading: undefined
                        });
                        return [2 /*return*/];
                }
            });
        }); })().catch(function (e) {
            console.info(e);
            _this.setState({ error: "\u041E\u0448\u0438\u0431\u043A\u0430: " + e.message });
        });
        common_1.getJson('version.json').then(function (buildInfo) { return _this.setState({ buildInfo: buildInfo }); });
        if (navigator.storage) {
            navigator.storage.persisted().then(function (persisted) {
                console.info("Constructor persisted=" + persisted);
                if (navigator.storage && !persisted) {
                    navigator.storage.persist().then(function (persistResult) {
                        console.info("Constructor persistResult=" + persistResult);
                    });
                }
            });
        }
        return _this;
    }
    GameList.prototype.updateUsedSpace = function () {
        return __awaiter(this, void 0, void 0, function () {
            var quota, persistent, _a, used, remaining, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        if (!navigator.storage) return [3 /*break*/, 3];
                        return [4 /*yield*/, navigator.storage.estimate()];
                    case 1:
                        quota = _b.sent();
                        return [4 /*yield*/, navigator.storage.persisted()];
                    case 2:
                        persistent = _b.sent();
                        this.setState({
                            storageInfo: {
                                used: quota.usage,
                                remaining: quota.quota,
                                persistent: persistent
                            }
                        });
                        return [3 /*break*/, 5];
                    case 3:
                        if (!navigator.webkitTemporaryStorage) return [3 /*break*/, 5];
                        return [4 /*yield*/, new Promise(function (resolv) {
                                return navigator.webkitTemporaryStorage.queryUsageAndQuota(function (used, remaining) { return resolv([used, remaining]); });
                            })];
                    case 4:
                        _a = _b.sent(), used = _a[0], remaining = _a[1];
                        this.setState({
                            storageInfo: {
                                used: used,
                                remaining: remaining,
                                persistent: undefined
                            }
                        });
                        _b.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_1 = _b.sent();
                        console.log('Error', e_1);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    GameList.prototype.componentDidMount = function () {
        this.updateUsedSpace();
    };
    GameList.prototype.componentWillUnmount = function () {
        if (this.spaceTimer) {
            clearInterval(this.spaceTimer);
        }
    };
    Object.defineProperty(GameList.prototype, "quests", {
        get: function () {
            var _this = this;
            return this.props.index.quests.filter(function (x) { return x.lang === _this.state.lang; });
        },
        enumerable: true,
        configurable: true
    });
    ;
    GameList.prototype.render = function () {
        var _this = this;
        var currentSelectedOrigin = localStorage.getItem(exports.GAME_LIST_FILTER);
        if (!this.state.gamePlaying) {
            var allQuests = this.quests
                .filter(function (q) { return !currentSelectedOrigin || q.questOrigin === currentSelectedOrigin; })
                .map(function (game, index) {
                var passed = _this.state.passedQuestsGameNames.indexOf(game.gameName) > -1 ?
                    (_this.state.lang === 'rus' ? 'Пройден' : 'Passed') : '';
                var disabled = (_this.state.passedQuestsGameNames.length + SHOW_ALLOWED_QUESTS) <= index || _this.state.loading;
                return React.createElement("a", { key: game.filename, href: "#" + game.gameName, id: 'gamelist_' + game.gameName, className: "list-group-item list-group-item-action flex-column align-items-start " +
                        (disabled ? 'disabled' : ''), title: disabled ? "Нужно пройти предыдущие" : '', onClick: function (e) {
                        e.preventDefault();
                        if (disabled) {
                            return;
                        }
                        _this.setState({
                            loading: (_this.state.lang === 'rus' ? 'Загрузка' : 'Loading') + " " + game.gameName
                        });
                        loadGame(game).then(function (player) {
                            _this.setState({
                                loading: undefined
                            });
                            if (player) {
                                _this.setState({
                                    gamePlaying: {
                                        player: player,
                                        gameName: game.gameName
                                    }
                                });
                            }
                        }).catch(function (e) {
                            console.info(e);
                            _this.setState({ error: "\u041E\u0448\u0438\u0431\u043A\u0430: " + e.message });
                        });
                    } },
                    React.createElement("div", { className: "d-flex w-100 justify-content-between" },
                        React.createElement("h5", { className: "mb-1" }, game.gameName),
                        React.createElement("small", null, passed)),
                    React.createElement("p", { className: "mb-1" },
                        React.createElement("span", { className: "gamelist-maxheight" }, game.description || '')),
                    React.createElement("small", null, game.smallDescription || ''));
            });
            var mainView = this.state.error ? React.createElement("div", { className: 'text-warning' }, this.state.error) :
                this.state.loading ? React.createElement("div", { className: "threedots" },
                    this.state.loading,
                    React.createElement("span", null, "."),
                    React.createElement("span", null, "."),
                    React.createElement("span", null, ".")) :
                    React.createElement("div", { className: "list-group" }, allQuests);
            /*
            self.addEventListener('message', function(event){
                console.log("SW Received Message: " + event.data);
            });
            function send_message_to_sw(msg){
                navigator.serviceWorker.controller.postMessage("Client 1 says '"+msg+"'");
            }


            */
            // navigator.serviceWorker.getRegistration().then(r => r.unregister()).then(x => console.info(x))
            // navigator.serviceWorker.controller
            /*

                Service workers сделаны коряво
                TODO: переделать

            */
            var serviceWorker = 'serviceWorker' in navigator ? React.createElement("li", { className: 'nav-item' },
                React.createElement("a", { className: "nav-link " + (this.state.serviceWorkerBusy ? "disabled" : ""), href: "#", onClick: function (e) {
                        e.preventDefault();
                        if (_this.state.serviceWorkerBusy) {
                            return;
                        }
                        _this.setState({
                            serviceWorkerBusy: 'Wait'
                        }, function () {
                            if (!navigator.serviceWorker.controller) {
                                _this.spaceTimer = setInterval(function () {
                                    _this.updateUsedSpace();
                                }, 1000);
                                _this.setState({
                                    serviceWorkerBusy: 'Unregistering old (if any)'
                                });
                                console.info("Starting to install service worker");
                                navigator.serviceWorker.getRegistration()
                                    .then(function (r) {
                                    if (r) {
                                        _this.setState({
                                            serviceWorkerBusy: 'Calling unregister'
                                        });
                                        return r.unregister();
                                    }
                                    else {
                                        _this.setState({
                                            serviceWorkerBusy: 'No old'
                                        });
                                        return Promise.resolve(true);
                                    }
                                })
                                    .then(function () {
                                    _this.setState({
                                        serviceWorkerBusy: 'Requesting persistent storage'
                                    });
                                    return navigator.storage ?
                                        navigator.storage.persist() : Promise.resolve(undefined);
                                }).catch(function (e) { return undefined; })
                                    .then(function (r) {
                                    console.info("Persistent r=" + r);
                                    _this.setState({
                                        serviceWorkerBusy: r === undefined ? "Persistent storage failed" :
                                            "Persistent = " + r
                                    });
                                })
                                    .then(function () {
                                    _this.setState({
                                        serviceWorkerBusy: 'Registering'
                                    });
                                    return navigator.serviceWorker.register('serviceWorker.js');
                                })
                                    .then(function (registration) {
                                    _this.setState({
                                        serviceWorkerBusy: 'Registered'
                                    });
                                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                                    registration.onupdatefound = function () {
                                        console.info('onupdatefound');
                                        _this.setState({
                                            serviceWorkerBusy: 'Installing'
                                        });
                                        var installingWorker = registration.installing;
                                        if (installingWorker) {
                                            installingWorker.onstatechange = function () {
                                                console.info("New state = " + installingWorker.state);
                                                _this.setState({
                                                    serviceWorkerBusy: "SW state: " + installingWorker.state
                                                });
                                                if (installingWorker.state === 'activated') {
                                                    _this.setState({
                                                        serviceWorkerBusy: 'Reloading (activated)'
                                                    });
                                                    setTimeout(function () {
                                                        location.reload();
                                                    }, 3000);
                                                }
                                                else if (installingWorker.state === 'redundant') {
                                                    _this.setState({
                                                        serviceWorkerBusy: 'Reloading (SW redundant)'
                                                    });
                                                    setTimeout(function () {
                                                        location.reload();
                                                    }, 3000);
                                                }
                                            };
                                        }
                                        else {
                                            console.error("Can not find installing sw");
                                            _this.setState({
                                                serviceWorkerBusy: 'Error: no installing SW'
                                            });
                                            setTimeout(function () {
                                                location.reload();
                                            }, 3000);
                                        }
                                    };
                                }).catch(function (e) {
                                    _this.setState({
                                        serviceWorkerBusy: "Error: " + e + " " + e.message
                                    });
                                    console.log('ServiceWorker registration failed: ', e);
                                    setTimeout(function () {
                                        location.reload();
                                    }, 3000);
                                });
                            }
                            else {
                                _this.setState({
                                    serviceWorkerBusy: 'Uninstalling'
                                }, function () { return __awaiter(_this, void 0, void 0, function () {
                                    var r;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                console.info("Starting to uninstall service worker");
                                                return [4 /*yield*/, navigator.serviceWorker.getRegistration()];
                                            case 1:
                                                r = _a.sent();
                                                if (!r) {
                                                    console.warn('No registration!');
                                                    this.setState({
                                                        serviceWorkerBusy: 'No registration!'
                                                    });
                                                    return [2 /*return*/];
                                                }
                                                else {
                                                    console.info("Got registration");
                                                }
                                                return [4 /*yield*/, r.unregister()];
                                            case 2:
                                                _a.sent();
                                                console.info("Cleaning cache");
                                                this.setState({
                                                    serviceWorkerBusy: 'Cleaning cache'
                                                });
                                                return [4 /*yield*/, window.caches.delete(consts_1.CACHE_NAME)];
                                            case 3:
                                                _a.sent();
                                                this.setState({
                                                    serviceWorkerBusy: 'Reloading page'
                                                });
                                                console.info("Reloading page");
                                                setTimeout(function () {
                                                    location.reload();
                                                }, 3000);
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                            }
                        });
                    } },
                    this.state.serviceWorkerBusy ||
                        (navigator.serviceWorker.controller ? 'Uninstall' : 'Install'),
                    this.state.storageInfo ?
                        ' [used ' + Math.round(this.state.storageInfo.used / 1000000).toString() + 'mb from ' +
                            Math.round(this.state.storageInfo.remaining / 1000000).toString() + 'mb' +
                            (this.state.storageInfo.persistent !== undefined ?
                                this.state.storageInfo.persistent ? ' persisted' : ' not persisted' : '') +
                            ']' : '')) : null;
            return React.createElement("div", null,
                React.createElement("nav", { className: "navbar navbar-toggleable navbar-inverse bg-inverse" },
                    React.createElement("button", { className: "navbar-toggler navbar-toggler-right", type: "button", "data-toggle": "collapse", "data-target": "#navbarsExampleDefault", "aria-controls": "navbarsExampleDefault", "aria-expanded": "false", "aria-label": "Toggle navigation" },
                        React.createElement("span", { className: "navbar-toggler-icon" })),
                    React.createElement("a", { className: "navbar-brand", href: "#" }, this.state.lang === 'rus' ? 'Квесты' :
                        'Quests'),
                    React.createElement("div", { className: "collapse navbar-collapse", id: "navbarsExampleDefault" },
                        React.createElement("ul", { className: "navbar-nav mr-auto" },
                            React.createElement("li", { className: "nav-item dropdown" },
                                React.createElement("a", { className: "nav-link dropdown-toggle", href: "#", id: "navbarDropdownMenuLink", "data-toggle": "dropdown", "aria-haspopup": "true", "aria-expanded": "false" }, currentSelectedOrigin || (this.state.lang === 'rus' ? 'Все' : 'All')),
                                React.createElement("div", { className: "dropdown-menu", "aria-labelledby": "navbarDropdownMenuLink" },
                                    React.createElement("a", { className: "dropdown-item", href: "#", onClick: function (e) {
                                            e.preventDefault();
                                            localStorage.setItem(exports.GAME_LIST_FILTER, '');
                                            _this.forceUpdate();
                                        } }, this.state.lang === 'rus' ? 'Все' : 'All'),
                                    this.quests.map(function (x) { return x.questOrigin; })
                                        .reduce(function (acc, d) { return acc.indexOf(d) > -1 ? acc : acc.concat(d); }, [])
                                        .map(function (origin) {
                                        return React.createElement("a", { key: origin, className: "dropdown-item", href: "#", onClick: function (e) {
                                                e.preventDefault();
                                                localStorage.setItem(exports.GAME_LIST_FILTER, origin);
                                                _this.forceUpdate();
                                            } }, origin);
                                    }))),
                            React.createElement("li", { className: "nav-item" },
                                React.createElement("a", { className: "nav-link", href: "#", onClick: function (e) {
                                        e.preventDefault();
                                        var newLang = _this.state.lang === 'rus' ? 'eng' : 'rus';
                                        _this.setState({
                                            lang: newLang
                                        });
                                        localStorage.setItem(LANG, newLang);
                                    } }, this.state.lang === 'rus' ? 'English' : 'Русский')),
                            serviceWorker))),
                React.createElement("div", { className: "jumbotron" },
                    React.createElement("div", { className: "container" }, mainView)),
                React.createElement("footer", { className: "footer" },
                    React.createElement("div", { className: "pt-2 pb-1 px-1" },
                        React.createElement("p", { className: "text-center" },
                            "Build at ",
                            this.state.buildInfo ? new Date(this.state.buildInfo.date).toLocaleString() : '<loading>',
                            React.createElement("br", null),
                            React.createElement("a", { href: "https://github.com/roginvs/space-rangers-quest" }, "https://github.com/roginvs/space-rangers-quest")))));
        }
        else {
            return React.createElement(game_1.GamePlay, __assign({}, this.state.gamePlaying, { lang: this.state.lang, musicList: this.props.index ? this.props.index.dir.music.files.map(function (x) { return x.path; }) : [], onPassed: function () {
                    if (_this.state.gamePlaying) {
                        if (_this.state.passedQuestsGameNames.indexOf(_this.state.gamePlaying.gameName) < 0) {
                            var newList = _this.state.passedQuestsGameNames.concat(_this.state.gamePlaying.gameName);
                            _this.setState({
                                passedQuestsGameNames: newList
                            });
                            localStorage.setItem(PASSED_QUESTS, JSON.stringify(newList));
                        }
                    }
                }, onReturn: function (gameName) {
                    _this.setState({
                        gamePlaying: undefined
                    }, function () {
                        var e = document.getElementById('gamelist_' + gameName);
                        if (e) {
                            e.scrollIntoView();
                        }
                    });
                    localStorage.setItem(exports.GAME_NAME, '');
                } }));
        }
    };
    return GameList;
}(React.Component));
exports.GameList = GameList;
