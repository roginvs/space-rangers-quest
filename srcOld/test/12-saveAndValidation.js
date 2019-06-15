"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var qmreader_1 = require("../lib/qmreader");
var fs = __importStar(require("fs"));
var assert = __importStar(require("assert"));
require("mocha");
var qmplayer_1 = require("../lib/qmplayer");
var funcs_1 = require("../lib/qmplayer/funcs");
var state;
var MY_SEED1 = "someseed";
var MY_SEED2 = "someseed3";
var date1 = new Date("2018-07-22T22:20:36.761Z");
var date2 = new Date("2018-07-22T22:21:36.761Z");
var date3 = new Date("2018-07-22T22:22:36.761Z");
var date4 = new Date("2018-07-22T22:30:36.761Z");
describe("Using saveAndValidaton.qm, seed 1", function () {
    var images = [];
    var data = fs.readFileSync(__dirname + "/../../src/test/saveAndValidation.qm");
    var quest = qmreader_1.parse(data);
    before("Reads and parses quest", function () {
        state = qmplayer_1.initGame(quest, MY_SEED1);
    });
    it("That seed have 2 jumps", function () {
        state = qmplayer_1.performJump(qmplayer_1.JUMP_I_AGREE, quest, state, images, date1);
        assert.strictEqual(state.possibleJumps.length, 2);
    });
    it("Jumping", function () {
        state = qmplayer_1.performJump(2, quest, state, images, date1);
        state = qmplayer_1.performJump(4, quest, state, images, date1);
        state = qmplayer_1.performJump(6, quest, state, images, date1);
        assert.deepEqual(state.paramValues.slice(0, 3), [5, 5, 2]);
        state = qmplayer_1.performJump(qmplayer_1.JUMP_GO_BACK_TO_SHIP, quest, state, images, date1);
        assert.strictEqual(state.state, "returnedending");
        var uistate = funcs_1.getUIState(quest, state, funcs_1.DEFAULT_RUS_PLAYER);
        assert.strictEqual(uistate.gameState, "win");
    });
    it("Validating state", function () {
        assert.ok(qmplayer_1.validateState(quest, state));
    });
    it("Validating game log", function () {
        var gameLog = qmplayer_1.getGameLog(state);
        assert.ok(qmplayer_1.validateWinningLog(quest, gameLog));
    });
    it("Partial game log is not validated", function () {
        var gameLog = qmplayer_1.getGameLog(state);
        var partialGameLog = __assign({}, gameLog, { performedJumps: gameLog.performedJumps.slice(0, 3) });
        assert.ok(!qmplayer_1.validateWinningLog(quest, partialGameLog));
    });
});
describe("Using saveAndValidaton.qm, seed 2", function () {
    var images = [];
    var data = fs.readFileSync(__dirname + "/../../src/test/saveAndValidation.qm");
    var quest = qmreader_1.parse(data);
    before("Reads and parses quest", function () {
        state = qmplayer_1.initGame(quest, MY_SEED2);
    });
    it("That seed have 1 jump", function () {
        state = qmplayer_1.performJump(qmplayer_1.JUMP_I_AGREE, quest, state, images, date1);
        assert.strictEqual(state.possibleJumps.length, 1);
    });
});
