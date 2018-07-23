"use strict";
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
var player;
function jumpTo(text) {
    if (text === void 0) { text = ''; }
    var state = player.getState();
    var saving = player.getSaving();
    //console.info(`jumpto='${text}' state=${saving.state} locId=${saving.locationId} jumps=${saving.possibleJumps
    //    .map(j =>`id=${j.id}${j.active}`).join(', ')} locs=`,saving.locationVisitCount);
    var jump = state.choices.filter(function (x) { return x.text.indexOf(text) > -1 && x.active; }).shift();
    //console.info(`jump=${jump ? jump.jumpId : "!"}`);
    if (!jump) {
        var saving_1 = player.getSaving();
        throw new Error("OLOLO: No jump '" + text + "' in " + JSON.stringify(state, null, 4));
    }
    player.performJump(jump.jumpId);
    // console.info(player.getState());
    return player.getState();
}
var _loop_1 = function (ext) {
    describe("Player on test10-locationtexts." + ext, function () {
        before("Reads and parses quest", function () {
            var data = fs.readFileSync(__dirname + ("/../../src/test/test10-locationtexts." + ext));
            var qm = qmreader_1.parse(data);
            player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // false
            player.start();
            player.performJump(qmplayer_1.JUMP_I_AGREE);
        });
        it("First state undefined", function () {
            assert.ok(true);
            //console.info(player.getState())
        });
        it("1nd jump to L2", function () {
            assert.equal(jumpTo('-> L2').text, 'L2-1');
        });
        it("1nd back to L1", function () {
            assert.equal(jumpTo('-> L1').text, 'L1-1');
        });
        it("2nd jump to L2", function () {
            assert.equal(jumpTo('-> L2').text, 'L2-2');
        });
        it("2nd back to L1", function () {
            assert.equal(jumpTo('-> L1').text, 'L1-2');
        });
        it("3nd jump to L2", function () {
            assert.equal(jumpTo('-> L2').text, 'L2-4');
        });
        it("3nd back to L1 (no text check here)", function () {
            jumpTo('-> L1');
            // qm: L1-1 , qmm : L2-4
        });
        it("4nd jump to L2", function () {
            assert.equal(jumpTo('-> L2').text, 'L2-1');
        });
        it("4nd back to L1", function () {
            assert.equal(jumpTo('-> L1').text, 'L1-4');
        });
        it("5nd jump to L2", function () {
            assert.equal(jumpTo('-> L2').text, 'L2-2');
        });
        it("5nd back to L1", function () {
            jumpTo('-> L1');
            // qm: L1-1 , qmm : L2-4
        });
        it("6nd jump to L2", function () {
            assert.equal(jumpTo('-> L2').text, 'L2-4');
        });
        it("6nd back to L1", function () {
            jumpTo('-> L1');
            // qm: L1-2 , qmm : L2-4
        });
        it("7nd jump to L2", function () {
            assert.equal(jumpTo('-> L2').text, 'L2-1');
        });
        it("7nd back to L1", function () {
            jumpTo('-> L1');
            // qm: L1-2 
        });
        // qm: 8 -> L1-1 , 9 -> L1-1, 10 -> L1-4 , 11 -> L1-1 ????
    });
};
for (var _i = 0, _a = ['qm', 'qmm']; _i < _a.length; _i++) {
    var ext = _a[_i];
    _loop_1(ext);
}
describe('Player on test10-deadly-loc.qmm', function () {
    var save;
    it("Reads and parses quest", function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test10-deadly-loc.qmm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // false
        player.start();
        player.performJump(qmplayer_1.JUMP_I_AGREE);
        save = player.getSaving();
    });
    describe('Jumping to locations', function () {
        beforeEach(function () {
            player.loadSaving(save);
        });
        it("Going to L5", function () {
            assert.equal(player.getState().choices.length, 4);
            jumpTo('-> L5');
            assert.equal(player.getState().choices.length, 1);
            assert.equal(player.getState().text, 'L5');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
            assert.equal(player.getState().choices.length, 0);
        });
        it("Going to L4", function () {
            assert.equal(player.getState().choices.length, 4);
            jumpTo('-> L4');
            assert.equal(player.getState().text, 'L4fail');
            assert.equal(player.getState().gameState, 'fail');
            assert.equal(player.getState().choices.length, 0);
        });
        it("Going to L2", function () {
            assert.equal(player.getState().choices.length, 4);
            jumpTo('-> L2');
            assert.equal(player.getState().text, 'L2dead');
            assert.equal(player.getState().gameState, 'dead');
            assert.equal(player.getState().choices.length, 0);
        });
    });
});
describe('Player on limitedLocation.qmm', function () {
    var save;
    it("Reads and parses quest", function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/limitedLocation.qmm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // false
        player.start();
        player.performJump(qmplayer_1.JUMP_I_AGREE);
    });
    it("Have 3 jumps", function () {
        assert.equal(player.getState().choices.length, 3);
    });
    it('Performing walking loop', function () {
        jumpTo('Start --> LimitedLocation');
        jumpTo('LimitedLocation0 --> Start');
        jumpTo('Start --> LimitedLocation');
        jumpTo('LimitedLocation0 --> Start');
    });
    it("Have 1 jump", function () {
        assert.equal(player.getState().choices.length, 1);
        assert.equal(player.getState().choices[0].text, 'Start -> winloc');
    });
});
describe('Player on test4-forqmm.qm', function () {
    describe('Old behaviour', function () {
        it("Reads and parses quest", function () {
            var data = fs.readFileSync(__dirname + '/../../src/test/test4-forqmm.qm');
            var qm = qmreader_1.parse(data);
            player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
            player.start();
            player.performJump(qmplayer_1.JUMP_I_AGREE);
        });
        it('Performing walking loop', function () {
            jumpTo('-> L1');
            jumpTo('--> L2');
            jumpTo('');
            jumpTo('');
            jumpTo('--> L2');
            jumpTo('');
            jumpTo('');
        });
        it('No jump here', function () {
            assert.equal(player.getState().choices.length, 0, 'TGE 4 shows not choices here');
        });
    });
    describe('New behaviour', function () {
        it("Reads and parses quest", function () {
            var data = fs.readFileSync(__dirname + '/../../src/test/test4-forqmm.qmm');
            var qm = qmreader_1.parse(data);
            player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // false
            player.start();
            player.performJump(qmplayer_1.JUMP_I_AGREE);
        });
        it('Performing walking loop', function () {
            jumpTo('-> L1');
            jumpTo('--> L2');
            jumpTo('');
            jumpTo('');
            jumpTo('--> L2');
            jumpTo('');
            jumpTo('');
            // Why? Why is was here?
            /*
            jumpTo('--> L2');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win', 'TGE 5 allows here to win')
            */
            assert.equal(player.getState().choices.length, 0, 'TGE 5.2.9 shows not choices here');
        });
    });
});
describe('Player on test8-emptyloc.qmm', function () {
    describe('New behaviour', function () {
        beforeEach("Reads and parses quest", function () {
            var data = fs.readFileSync(__dirname + '/../../src/test/test8-emptyloc.qmm');
            var qm = qmreader_1.parse(data);
            player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // false
            player.start();
            player.performJump(qmplayer_1.JUMP_I_AGREE);
        });
        it('-> L2', function () {
            assert.equal(jumpTo('-> L2').text, 'J2desc');
            assert.equal(jumpTo('').text, 'j3desc');
            assert.equal(jumpTo('').text, 'j4desc');
            assert.equal(jumpTo('').text, 'L4');
        });
        it('-> L5', function () {
            assert.equal(jumpTo('-> L5').text, 'J5desc');
            assert.equal(jumpTo('').text, 'L4');
        });
        it('-> L7', function () {
            assert.equal(jumpTo('-> L7').text, 'J8Desc');
            assert.equal(jumpTo('').text, 'L4');
        });
        it('-> L9', function () {
            assert.equal(jumpTo('-> L9').text, 'J11Desc');
            assert.equal(jumpTo('').text, 'L10');
            assert.equal(jumpTo('').text, 'L4');
        });
    });
});
describe('Player on test9-loop-qm.qm', function () {
    beforeEach("Reads and parses quest", function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test9-loop-qm.qm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // false
        player.start();
        player.performJump(qmplayer_1.JUMP_I_AGREE);
    });
    it('L1 -> L1', function () {
        assert.equal(jumpTo('-> L4').text, 'L1');
        assert.equal(jumpTo('-> L4').text, 'L1');
        assert.equal(jumpTo('-> L4').text, 'p1_j6_crit');
        assert.equal(jumpTo('').gameState, 'win');
    });
    /*
        it('L1 -> L1', () => {
            assert.equal(jumpTo('-> L1').text, 'L1');
            //assert.equal(jumpTo('-> L1').text, 'L1');
            console.info(jumpTo('-> L1'))
            console.info(jumpTo('-> L1'))
            //assert.equal(jumpTo('-> L1').text,'j1crit');
            assert.equal(jumpTo('').gameState, 'win');
        })
        */
});
describe('Player on test9-loop.qmm', function () {
    beforeEach("Reads and parses quest", function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test9-loop.qmm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // false
        player.start();
        player.performJump(qmplayer_1.JUMP_I_AGREE);
    });
    it('L1 -> L1', function () {
        assert.equal(jumpTo('-> L4').text, 'L1');
        assert.equal(jumpTo('-> L4').text, 'L1');
        assert.equal(jumpTo('-> L4').text, 'p1_j6_crit');
        assert.equal(jumpTo('').gameState, 'win');
    });
    it('L1 -> L1', function () {
        assert.equal(jumpTo('-> L1').text, 'L1');
        assert.equal(jumpTo('-> L1').text, 'L1');
        assert.equal(jumpTo('-> L1').text, 'j1crit');
        assert.equal(jumpTo('').gameState, 'win');
    });
});
