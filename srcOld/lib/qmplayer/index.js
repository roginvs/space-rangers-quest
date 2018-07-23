"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var defs_1 = require("./defs");
exports.JUMP_I_AGREE = defs_1.JUMP_I_AGREE;
exports.JUMP_NEXT = defs_1.JUMP_NEXT;
exports.JUMP_GO_BACK_TO_SHIP = defs_1.JUMP_GO_BACK_TO_SHIP;
var funcs_1 = require("./funcs");
exports.initGame = funcs_1.initGame;
exports.performJump = funcs_1.performJump;
exports.validateState = funcs_1.validateState;
exports.validateWinningLog = funcs_1.validateWinningLog;
exports.getGameLog = funcs_1.getGameLog;
var funcs_2 = require("./funcs");
var QMPlayer = /** @class */ (function () {
    function QMPlayer(quest, images, lang) {
        if (images === void 0) { images = []; }
        this.quest = quest;
        this.images = images;
        this.lang = lang;
        this.player = this.lang === 'rus' ? funcs_2.DEFAULT_RUS_PLAYER : funcs_2.DEFAULT_ENG_PLAYER;
        this.state = funcs_2.initGame(this.quest, Math.random().toString(36));
    }
    QMPlayer.prototype.start = function () {
        this.state = funcs_2.initGame(this.quest, Math.random().toString(36));
    };
    QMPlayer.prototype.getAllImagesToPreload = function () {
        return funcs_2.getAllImagesToPreload(this.quest, this.images);
    };
    QMPlayer.prototype.getState = function () {
        return funcs_2.getUIState(this.quest, this.state, this.player);
    };
    QMPlayer.prototype.performJump = function (jumpId) {
        this.state = funcs_2.performJump(jumpId, this.quest, this.state, this.images);
    };
    QMPlayer.prototype.getSaving = function () {
        return this.state;
    };
    QMPlayer.prototype.loadSaving = function (state) {
        this.state = state;
    };
    return QMPlayer;
}());
exports.QMPlayer = QMPlayer;
