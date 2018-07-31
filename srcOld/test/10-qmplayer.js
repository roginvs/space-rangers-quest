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
    var jump = state.choices.filter(function (x) { return x.text.indexOf(text) > -1 && x.active; }).shift();
    if (!jump) {
        throw new Error("OLOLO: No jump " + text + " in " + JSON.stringify(state, null, 4));
    }
    player.performJump(jump.jumpId);
    // console.info(player.getState());
    return player.getState();
}
describe('Player on test6-empty.qm', function () {
    var save;
    it("Reads and parses quest", function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test6-empty.qm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // false
        player.start();
        player.performJump(qmplayer_1.JUMP_I_AGREE);
        save = player.getSaving();
    });
    describe('Crit params on loc/jumps', function () {
        beforeEach(function () {
            player.loadSaving(save);
        });
        it("failonloc_chain", function () {
            jumpTo('failonloc_chain');
            assert.equal(player.getState().text, 'p2_at_l11');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("success_on_loc_jumptext", function () {
            jumpTo('success_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'success_on_loc_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("success_on_loc_no_jumptext", function () {
            jumpTo('success_on_loc_no_jumptext');
            assert.equal(player.getState().text, 'success_on_loc_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("success_on_locnotext_nojumptext", function () {
            jumpTo('success_on_locnotext_nojumptext');
            assert.equal(player.getState().text, 'p1_at_l10');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("success_on_locnotext_jumptext", function () {
            jumpTo('success_on_locnotext_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'p1_at_l10');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("success_on_jump_jumptext", function () {
            jumpTo('success_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'success_on_jump_jumptext_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("success_on_jump_nojumptext", function () {
            jumpTo('success_on_jump_nojumptext');
            assert.equal(player.getState().text, 'success_on_jump_nojumptext_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("fail_on_jump_jumptext", function () {
            jumpTo('fail_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'fail_jump_msg');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("fail_on_jump_nojumptext", function () {
            jumpTo('fail_on_jump_nojumptext');
            assert.equal(player.getState().text, 'fail_jump_text');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("fail_on_loc_jumptext", function () {
            jumpTo('fail_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'fail_loc_msg');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("fail_on_loc_nojumptext", function () {
            jumpTo('fail_on_loc_nojumptext');
            assert.equal(player.getState().text, 'fail_loc_msg');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("fail_on_locnotext_jumptext", function () {
            jumpTo('fail_on_locnotext_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'p2_failed_on_L9');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("fail_on_locnotext_nojumptext", function () {
            jumpTo('fail_on_locnotext_nojumptext');
            assert.equal(player.getState().text, 'p2_failed_on_L9');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("death_on_jump_jumptext", function () {
            jumpTo('death_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'dead_jump_msg');
            assert.equal(player.getState().gameState, 'dead');
        });
        it("death_on_jump_nojumptext", function () {
            jumpTo('death_on_jump_nojumptext');
            assert.equal(player.getState().text, 'dead_jump_msg');
            assert.equal(player.getState().gameState, 'dead');
        });
        it("death_on_loc_jumptext", function () {
            jumpTo('death_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'dead_on_loc');
            assert.equal(player.getState().gameState, 'dead');
        });
        it("death_on_loc_nojumptext", function () {
            jumpTo('death_on_loc_nojumptext');
            assert.equal(player.getState().text, 'dead_on_loc');
            assert.equal(player.getState().gameState, 'dead');
        });
    });
});
describe('Player on test6.qm', function () {
    var save;
    it("Reads and parses quest", function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test6.qm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
        player.start();
        player.performJump(qmplayer_1.JUMP_I_AGREE);
        save = player.getSaving();
    });
    describe('Crit params on loc/jumps with active jump', function () {
        beforeEach(function () {
            player.loadSaving(save);
        });
        it("success_on_loc_jumptext", function () {
            jumpTo('success_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'success_on_loc');
            jumpTo('');
            assert.equal(player.getState().text, 'success_on_loc_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("success_on_loc_no_jumptext", function () {
            jumpTo('success_on_loc_no_jumptext');
            assert.equal(player.getState().text, 'success_on_loc');
            jumpTo('');
            assert.equal(player.getState().text, 'success_on_loc_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("success_on_jump_jumptext", function () {
            jumpTo('success_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'success_on_jump_jumptext_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("success_on_jump_nojumptext", function () {
            jumpTo('success_on_jump_nojumptext');
            assert.equal(player.getState().text, 'success_on_jump_nojumptext_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("fail_on_jump_jumptext", function () {
            jumpTo('fail_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'fail_jump_msg');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("fail_on_jump_nojumptext", function () {
            jumpTo('fail_on_jump_nojumptext');
            assert.equal(player.getState().text, 'fail_jump_text');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("fail_on_loc_jumptext live-after-fail", function () {
            jumpTo('fail_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'fail_on_loc');
            /* Here is live-after-fail */
            jumpTo('');
            assert.equal(player.getState().text, 'L3');
            assert.equal(player.getState().gameState, 'running');
        });
        it("fail_on_loc_nojumptext", function () {
            jumpTo('fail_on_loc_nojumptext');
            assert.equal(player.getState().text, 'fail_on_loc');
            /* Here is live-after-fail */
            jumpTo('');
            assert.equal(player.getState().text, 'L3');
            assert.equal(player.getState().gameState, 'running');
        });
        it("death_on_jump_jumptext", function () {
            jumpTo('death_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'dead_jump_msg');
            assert.equal(player.getState().gameState, 'dead');
        });
        it("death_on_jump_nojumptext", function () {
            jumpTo('death_on_jump_nojumptext');
            assert.equal(player.getState().text, 'dead_jump_msg');
            assert.equal(player.getState().gameState, 'dead');
        });
        it("death_on_loc_jumptext", function () {
            jumpTo('death_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'death_on_loc');
            /* Here is live-after-dead */
            jumpTo('');
            assert.equal(player.getState().text, 'L3');
            assert.equal(player.getState().gameState, 'running');
        });
        it("death_on_loc_nojumptext", function () {
            jumpTo('death_on_loc_nojumptext');
            assert.equal(player.getState().text, 'death_on_loc');
            /* Here is live-after-dead */
            jumpTo('');
            assert.equal(player.getState().text, 'L3');
            assert.equal(player.getState().gameState, 'running');
        });
    });
    describe('Crit params on loc/jumps without active jump', function () {
        beforeEach(function () {
            player.loadSaving(save);
            jumpTo('enable_lock');
        });
        it("success_on_loc_jumptext", function () {
            jumpTo('success_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'success_on_loc');
            jumpTo('');
            assert.equal(player.getState().text, 'success_on_loc_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("success_on_loc_no_jumptext", function () {
            jumpTo('success_on_loc_no_jumptext');
            assert.equal(player.getState().text, 'success_on_loc');
            jumpTo('');
            assert.equal(player.getState().text, 'success_on_loc_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("success_on_jump_jumptext", function () {
            jumpTo('success_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'success_on_jump_jumptext_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("success_on_jump_nojumptext", function () {
            jumpTo('success_on_jump_nojumptext');
            assert.equal(player.getState().text, 'success_on_jump_nojumptext_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("fail_on_jump_jumptext", function () {
            jumpTo('fail_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'fail_jump_msg');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("fail_on_jump_nojumptext", function () {
            jumpTo('fail_on_jump_nojumptext');
            assert.equal(player.getState().text, 'fail_jump_text');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("fail_on_loc_jumptext", function () {
            jumpTo('fail_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'fail_on_loc');
            jumpTo('');
            assert.equal(player.getState().text, 'fail_loc_msg');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("fail_on_loc_nojumptext", function () {
            jumpTo('fail_on_loc_nojumptext');
            assert.equal(player.getState().text, 'fail_on_loc');
            jumpTo('');
            assert.equal(player.getState().text, 'fail_loc_msg');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("death_on_jump_jumptext", function () {
            jumpTo('death_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'dead_jump_msg');
            assert.equal(player.getState().gameState, 'dead');
        });
        it("death_on_jump_nojumptext", function () {
            jumpTo('death_on_jump_nojumptext');
            assert.equal(player.getState().text, 'dead_jump_msg');
            assert.equal(player.getState().gameState, 'dead');
        });
        it("death_on_loc_jumptext", function () {
            jumpTo('death_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'death_on_loc');
            jumpTo('');
            assert.equal(player.getState().text, 'dead_on_loc');
            assert.equal(player.getState().gameState, 'dead');
        });
        it("death_on_loc_nojumptext", function () {
            jumpTo('death_on_loc_nojumptext');
            assert.equal(player.getState().text, 'death_on_loc');
            jumpTo('');
            assert.equal(player.getState().text, 'dead_on_loc');
            assert.equal(player.getState().gameState, 'dead');
        });
    });
});
describe('Player on test6.qm with permitLiveAfterDeath=false', function () {
    var save;
    it("Reads and parses quest", function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test6.qmm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // false
        player.start();
        player.performJump(qmplayer_1.JUMP_I_AGREE);
        save = player.getSaving();
    });
    describe('Crit params on loc/jumps with active jump', function () {
        beforeEach(function () {
            player.loadSaving(save);
        });
        it("success_on_loc_jumptext", function () {
            jumpTo('success_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'success_on_loc');
            jumpTo('');
            assert.equal(player.getState().text, 'success_on_loc_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("success_on_loc_no_jumptext", function () {
            jumpTo('success_on_loc_no_jumptext');
            assert.equal(player.getState().text, 'success_on_loc');
            jumpTo('');
            assert.equal(player.getState().text, 'success_on_loc_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("success_on_jump_jumptext", function () {
            jumpTo('success_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'success_on_jump_jumptext_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("success_on_jump_nojumptext", function () {
            jumpTo('success_on_jump_nojumptext');
            assert.equal(player.getState().text, 'success_on_jump_nojumptext_msg');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win');
        });
        it("fail_on_jump_jumptext", function () {
            jumpTo('fail_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'fail_jump_msg');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("fail_on_jump_nojumptext", function () {
            jumpTo('fail_on_jump_nojumptext');
            assert.equal(player.getState().text, 'fail_jump_text');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("fail_on_loc_jumptext", function () {
            jumpTo('fail_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'fail_on_loc');
            jumpTo('');
            assert.equal(player.getState().text, 'fail_loc_msg');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("fail_on_loc_nojumptext", function () {
            jumpTo('fail_on_loc_nojumptext');
            assert.equal(player.getState().text, 'fail_on_loc');
            jumpTo('');
            assert.equal(player.getState().text, 'fail_loc_msg');
            assert.equal(player.getState().gameState, 'fail');
        });
        it("death_on_jump_jumptext", function () {
            jumpTo('death_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'dead_jump_msg');
            assert.equal(player.getState().gameState, 'dead');
        });
        it("death_on_jump_nojumptext", function () {
            jumpTo('death_on_jump_nojumptext');
            assert.equal(player.getState().text, 'dead_jump_msg');
            assert.equal(player.getState().gameState, 'dead');
        });
        it("death_on_loc_jumptext", function () {
            jumpTo('death_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext');
            jumpTo('');
            assert.equal(player.getState().text, 'death_on_loc');
            jumpTo('');
            assert.equal(player.getState().text, 'dead_on_loc');
            assert.equal(player.getState().gameState, 'dead');
        });
        it("death_on_loc_nojumptext", function () {
            jumpTo('death_on_loc_nojumptext');
            assert.equal(player.getState().text, 'death_on_loc');
            jumpTo('');
            assert.equal(player.getState().text, 'dead_on_loc');
            assert.equal(player.getState().gameState, 'dead');
        });
    });
});
describe('Player on test5.qm', function () {
    it("Reads and parses quest", function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test5.qm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
        player.start();
    });
    it("Accept", function () { return player.performJump(qmplayer_1.JUMP_I_AGREE); });
    it("In L2", function () {
        assert.equal(player.getState().text, 'L2');
    });
});
describe('Player on test5-emptystart-usingformula.qm', function () {
    it("Reads and parses quest", function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test5-emptystart-usingformula.qm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
        player.start();
    });
    it("Accept", function () { return player.performJump(qmplayer_1.JUMP_I_AGREE); });
    it("In L2", function () {
        assert.equal(player.getState().text, 'L2');
    });
});
describe('Player on test5-emptystart-usingorder.qm', function () {
    it("Reads and parses quest", function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test5-emptystart-usingorder.qm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
        player.start();
    });
    it("Accept", function () { return player.performJump(qmplayer_1.JUMP_I_AGREE); });
    it("have jump", function () { return jumpTo(''); });
    it("In L2", function () {
        assert.equal(player.getState().text, 'L2');
    });
});
describe('Player on test5-emptyloctext-emptyloc-autojump.qm', function () {
    it("Reads and parses quest", function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test5-emptyloctext-emptyloc-autojump.qm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
        player.start();
    });
    it("Accept", function () { return player.performJump(qmplayer_1.JUMP_I_AGREE); });
    it("In L2", function () {
        assert.equal(player.getState().text, 'L2');
    });
});
describe('Player on test5-emptyloctext-emptyloc-noautojump.qm doing 1-8', function () {
    beforeEach(function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test5-emptyloctext-emptyloc-noautojump.qm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
        player.start();
        player.performJump(qmplayer_1.JUMP_I_AGREE);
    });
    it("1_nojumptext_emptyloc_noloctext_jumptext", function () {
        jumpTo('1_nojumptext_emptyloc_noloctext_jumptext');
        assert.equal(player.getState().text, '');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("2_jumptext_emptyloc_noloctext_jumptext", function () {
        jumpTo('2_jumptext_emptyloc_noloctext_jumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("3_nojumptext_noemptyloc_noloctext_jumptext", function () {
        jumpTo('3_nojumptext_noemptyloc_noloctext_jumptext');
        assert.equal(player.getState().text, '');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("4_jumptext_noemptyloc_noloctext_jumptext", function () {
        jumpTo('4_jumptext_noemptyloc_noloctext_jumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, '');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("5_nojumptext_emptyloc_loctext_jumptext", function () {
        jumpTo('5_nojumptext_emptyloc_loctext_jumptext');
        assert.equal(player.getState().text, 'L10');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("6_jumptext_emptyloc_loctext_jumptext", function () {
        jumpTo('6_jumptext_emptyloc_loctext_jumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("7_nojumptext_noemptyloc_loctext_jumptext", function () {
        jumpTo('7_nojumptext_noemptyloc_loctext_jumptext');
        assert.equal(player.getState().text, 'L11');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("8_jumptext_noemptyloc_loctext_jumptext", function () {
        jumpTo('8_jumptext_noemptyloc_loctext_jumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, 'L13');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    /*
      test5-emptyloctext-emptyloc-noautojump
     1_nojumptext_emptyloc_noloctext_jumptext -> "" -> L6
     2_jumptext_emptyloc_noloctext_jumptext -> jumptext -> "" -> L6
     3_nojumptext_noemptyloc_noloctext_jumptext -> "" -> L6
     4_jumptext_noemptyloc_noloctext_jumptext -> jumptext -> "" -> L6
     
     5_nojumptext_emptyloc_loctext_jumptext -> L6
     6_jumptext_emptyloc_loctext_jumptext
     7_nojumptext_noemptyloc_loctext_jumptext
     8_jumptext_noemptyloc_loctext_jumptext

     */
});
describe('Player on test5-emptyloctext-emptyloc-autojump.qm doing 9-16', function () {
    beforeEach(function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test5-emptyloctext-emptyloc-autojump.qm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
        player.start();
        player.performJump(qmplayer_1.JUMP_I_AGREE);
    });
    it("9_nojumptext_emptyloc_noloctext_nojumptext", function () {
        jumpTo('9_nojumptext_emptyloc_noloctext_nojumptext');
        assert.equal(player.getState().text, 'L6');
    });
    it("10_jumptext_emptyloc_noloctext_nojumptext", function () {
        jumpTo('10_jumptext_emptyloc_noloctext_nojumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("11_nojumptext_noemptyloc_noloctext_nojumptext", function () {
        jumpTo('11_nojumptext_noemptyloc_noloctext_nojumptext');
        assert.equal(player.getState().text, 'L6');
    });
    it("12_jumptext_noemptyloc_noloctext_nojumptext", function () {
        jumpTo('12_jumptext_noemptyloc_noloctext_nojumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("13_nojumptext_emptyloc_loctext_nojumptext", function () {
        jumpTo('13_nojumptext_emptyloc_loctext_nojumptext');
        assert.equal(player.getState().text, 'L6');
    });
    it("14_jumptext_emptyloc_loctext_nojumptext", function () {
        jumpTo('14_jumptext_emptyloc_loctext_nojumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("15_nojumptext_noemptyloc_loctext_nojumptext", function () {
        jumpTo('15_nojumptext_noemptyloc_loctext_nojumptext');
        assert.equal(player.getState().text, 'L11');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("16_jumptext_noemptyloc_loctext_nojumptext", function () {
        jumpTo('16_jumptext_noemptyloc_loctext_nojumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, 'L13');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
});
describe('Player on test5-emptyloctext-emptyloc-noautojump.qmm', function () {
    it('Loads quest', function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test5-emptyloctext-emptyloc-noautojump.qmm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
        player.start();
        player.performJump(qmplayer_1.JUMP_I_AGREE);
    });
    it.skip('Location is empty, but have text, so it is shown', function () {
        assert.equal(player.getState().text, 'Empry loc with text');
        jumpTo('');
        assert.equal(player.getState().text, 'L2');
    });
});
describe.skip('Player on test5-emptyloctext-emptyloc-noautojump.qmm doing 1-8', function () {
    beforeEach(function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test5-emptyloctext-emptyloc-noautojump.qmm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
        player.start();
        player.performJump(qmplayer_1.JUMP_I_AGREE);
        jumpTo('');
    });
    it("1_nojumptext_emptyloc_noloctext_jumptext", function () {
        jumpTo('1_nojumptext_emptyloc_noloctext_jumptext');
        assert.equal(player.getState().text, ''); // L2 here in TGE 5.2.9
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("2_jumptext_emptyloc_noloctext_jumptext", function () {
        jumpTo('2_jumptext_emptyloc_noloctext_jumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("3_nojumptext_noemptyloc_noloctext_jumptext", function () {
        jumpTo('3_nojumptext_noemptyloc_noloctext_jumptext');
        assert.equal(player.getState().text, ''); // L2 here in TGE 5.2.9
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("4_jumptext_noemptyloc_noloctext_jumptext", function () {
        jumpTo('4_jumptext_noemptyloc_noloctext_jumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, ''); // jumptext here in TGE 5.2.9
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("5_nojumptext_emptyloc_loctext_jumptext", function () {
        jumpTo('5_nojumptext_emptyloc_loctext_jumptext');
        assert.equal(player.getState().text, 'L10');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("6_jumptext_emptyloc_loctext_jumptext", function () {
        jumpTo('6_jumptext_emptyloc_loctext_jumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("7_nojumptext_noemptyloc_loctext_jumptext", function () {
        jumpTo('7_nojumptext_noemptyloc_loctext_jumptext');
        assert.equal(player.getState().text, 'L11');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("8_jumptext_noemptyloc_loctext_jumptext", function () {
        jumpTo('8_jumptext_noemptyloc_loctext_jumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, 'L13');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    /*
      test5-emptyloctext-emptyloc-noautojump
     1_nojumptext_emptyloc_noloctext_jumptext -> "" -> L6
     2_jumptext_emptyloc_noloctext_jumptext -> jumptext -> "" -> L6
     3_nojumptext_noemptyloc_noloctext_jumptext -> "" -> L6
     4_jumptext_noemptyloc_noloctext_jumptext -> jumptext -> "" -> L6
     
     5_nojumptext_emptyloc_loctext_jumptext -> L6
     6_jumptext_emptyloc_loctext_jumptext
     7_nojumptext_noemptyloc_loctext_jumptext
     8_jumptext_noemptyloc_loctext_jumptext

     */
});
describe.skip('Player on test5-emptyloctext-emptyloc-autojump.qmm doing 9-16', function () {
    beforeEach(function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test5-emptyloctext-emptyloc-autojump.qmm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
        player.start();
        player.performJump(qmplayer_1.JUMP_I_AGREE);
        jumpTo();
    });
    it("9_nojumptext_emptyloc_noloctext_nojumptext", function () {
        jumpTo('9_nojumptext_emptyloc_noloctext_nojumptext');
        assert.equal(player.getState().text, 'L6');
    });
    it("10_jumptext_emptyloc_noloctext_nojumptext", function () {
        jumpTo('10_jumptext_emptyloc_noloctext_nojumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("11_nojumptext_noemptyloc_noloctext_nojumptext", function () {
        jumpTo('11_nojumptext_noemptyloc_noloctext_nojumptext');
        assert.equal(player.getState().text, 'L6');
    });
    it("12_jumptext_noemptyloc_noloctext_nojumptext", function () {
        jumpTo('12_jumptext_noemptyloc_noloctext_nojumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("13_nojumptext_emptyloc_loctext_nojumptext", function () {
        jumpTo('13_nojumptext_emptyloc_loctext_nojumptext');
        assert.equal(player.getState().text, 'L10'); // Here is difference between tge4 and tge5
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("14_jumptext_emptyloc_loctext_nojumptext", function () {
        jumpTo('14_jumptext_emptyloc_loctext_nojumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("15_nojumptext_noemptyloc_loctext_nojumptext", function () {
        jumpTo('15_nojumptext_noemptyloc_loctext_nojumptext');
        assert.equal(player.getState().text, 'L11');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
    it("16_jumptext_noemptyloc_loctext_nojumptext", function () {
        jumpTo('16_jumptext_noemptyloc_loctext_nojumptext');
        assert.equal(player.getState().text, 'jumptext');
        jumpTo('');
        assert.equal(player.getState().text, 'L13');
        jumpTo('');
        assert.equal(player.getState().text, 'L6');
    });
});
describe('Player on test4.qm', function () {
    this.timeout(20 * 1000);
    var save;
    it("Reads and parses quest", function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test4.qm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
        player.start();
    });
    it("Accept", function () { return player.performJump(qmplayer_1.JUMP_I_AGREE); });
    describe("Available jumps", function () {
        it("2 jumps available, going first loop", function () {
            jumpTo('-> L1');
            assert.equal(player.getState().choices.length, 3, 'Three jump available ' +
                JSON.stringify(player.getState()));
            save = player.getSaving();
            jumpTo('-> L8');
            jumpTo('-> L9');
            jumpTo('-> Start');
            jumpTo('-> L8');
            assert.equal(player.getState().choices.length, 0, 'Dead end here');
            player.loadSaving(save);
        });
        it("2 jumps available, going second loop", function () {
            assert.equal(player.getState().choices.length, 3, 'Three jump available');
            jumpTo('-> L2');
            jumpTo('-> L3');
            jumpTo('-> Start');
            assert.equal(player.getState().choices.length, 2, 'Two jumps left');
        });
        it("2 jumps available, going third loop", function () {
            jumpTo('-> L4');
            jumpTo('-> L6');
            jumpTo('-> L7');
            jumpTo('-> L4');
            assert.equal(player.getState().text, 'L4');
            assert.equal(player.getState().choices.length, 1);
            jumpTo('');
        });
        it("L5", function () {
            assert.equal(player.getState().text, 'L5');
            jumpTo('-> L10');
            jumpTo('-> L11');
            jumpTo('-> L5');
            jumpTo('-> L10');
            jumpTo('-> L11');
            jumpTo('-> L5');
            assert.equal(player.getState().choices.length, 1);
            jumpTo('-> L13');
        });
        it("L13", function () {
            assert.equal(player.getState().text, 'L13');
            assert.equal(player.getState().choices.length, 4);
            save = player.getSaving();
            jumpTo('-> L16');
            assert.equal(player.getState().choices.length, 0, 'L16 is dead end');
            player.loadSaving(save);
            jumpTo('-> L18');
            assert.equal(player.getState().choices.filter(function (x) { return x.active; }).length, 0, 'L18 is dead end');
            player.loadSaving(save);
            jumpTo('-> L14');
            jumpTo('-> L13');
            jumpTo('-> L14');
            jumpTo('-> L13');
            assert.equal(player.getState().choices.length, 3);
        });
    });
});
describe('Player on test3.qm', function () {
    this.timeout(20 * 1000);
    var save;
    var lastTestOk = false;
    it("Reads and parses quest", function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test3.qm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
        player.start();
    });
    it("Accept", function () { return player.performJump(qmplayer_1.JUMP_I_AGREE); });
    describe("Empty locations/jumps", function () {
        beforeEach(function () {
            save = player.getSaving();
        });
        afterEach(function () {
            player.loadSaving(save);
        });
        it("loc0text_0empty_jump0text_param=0", function () {
            jumpTo('loc0text_0empty_jump0text_param=0');
            assert.equal(player.getState().text, 'Main menu', 'Wants main menu');
        });
        it("loc0text_0empty_jump0text_param=1", function () {
            var st = jumpTo("loc0text_0empty_jump0text_param=1");
            assert.equal(player.getState().choices.length, 1);
            assert.equal(player.getState().text, '');
            assert.equal(jumpTo('2win').text, 'Win');
        });
        it("loc1text_0empty_jump0text_param=0", function () {
            assert.ok(jumpTo('loc1text_0empty_jump0text_param=0').text, 'Text');
            assert.equal(player.getState().choices.length, 1, 'One choise');
        });
        it("loc1text_0empty_jump0text_param=1", function () {
            assert.ok(jumpTo('loc1text_0empty_jump0text_param=1').text, 'Text');
            assert.equal(player.getState().choices.length, 1);
            assert.equal(jumpTo('2win').text, 'Win');
        });
        it("loc0text_1empty_jump0text_param=0", function () {
            assert.equal(jumpTo('loc0text_1empty_jump0text_param=0').text, 'Main menu');
        });
        it("loc0loctext1text_1empty_jump0text_param=0", function () {
            assert.equal(jumpTo('loc0loctext1text_1empty_jump0text_param=0').text, 'Main menu');
        });
        it("loc1loctext1text_1empty_jump0text_param=0", function () {
            assert.equal(jumpTo('loc1loctext1text_1empty_jump0text_param=0').text, 'some_text_l23');
            assert.equal(jumpTo('').text, 'Main menu');
        });
        it("loc0loctext1jumptext1text_1empty_jump0text_param=0", function () {
            assert.equal(jumpTo('loc0loctext1jumptext1text_1empty_jump0text_param=0').text, 'jump52text');
            assert.equal(jumpTo('').text, 'Main menu');
        });
        it("loc1loctext1jumptext1text_1empty_jump0text_param=0", function () {
            assert.equal(jumpTo('loc1loctext1jumptext1text_1empty_jump0text_param=0').text, 'jump53text');
            assert.equal(jumpTo('').text, 'some_text_l23');
            assert.equal(jumpTo('').text, 'Main menu');
        });
        it("loc0text_1empty_jump0text_param=1", function () {
            jumpTo("loc0text_1empty_jump0text_param=1");
            assert.equal(player.getState().choices.length, 1);
            assert.equal(jumpTo('2win').text, 'Win');
        });
        it("loc0text_1empty_jump1text_locparam=0", function () {
            assert.equal(jumpTo('loc0text_1empty_jump1text_locparam=0').text, 'jumpTextX');
            assert.equal(jumpTo('').text, 'Main menu');
        });
        it("loc0text_1empty_jump1text_locparam=1", function () {
            assert.equal(jumpTo('loc0text_1empty_jump1text_locparam=1').text, 'jumpText');
            assert.equal(player.getState().choices.length, 1);
            assert.equal(jumpTo('2win').text, 'Win');
        });
    });
    /* TODO
        - Если есть доступные переходы
            - fail на критичных параметрах на Провальном типе (так же как на dead)
            - критичное успешное выдаёт успех (не как fail/dead)

        - Критичный минимум (win/fail/dead)
        
        - Критичные значения на переходе
            - ? как в TGE - обрабатывать всегда, или
                 как в теории - обработать локацию и проверить наличие переходов



    */
    describe("Last test", function () {
        it("Set flag", function () { lastTestOk = true; });
    });
    after(function () {
        if (!lastTestOk) {
            console.info(player.getState());
        }
    });
});
describe('Player on test2.qm', function () {
    this.timeout(20 * 1000);
    var save;
    var lastTestOk = false;
    it("Reads and parses quest", function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test2.qm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
        player.start();
    });
    it("Accept", function () { return player.performJump(qmplayer_1.JUMP_I_AGREE); });
    it("Main menu", function () { return assert.equal(jumpTo('mainmenu').text, 'Main menu'); });
    it("To equal", function () { return assert.equal(jumpTo('To equal').text, 'Here should be 1 jump'); });
    it("Next", function () {
        assert.equal(player.getState().choices.length, 1);
        jumpTo('next').text;
        assert.equal(player.getState().text, 'Text2');
    });
    it("Next", function () {
        assert.equal(player.getState().choices.length, 1);
        jumpTo('next').text;
        assert.equal(player.getState().text, 'Text3');
    });
    it("Main menu", function () { return assert.equal(jumpTo('mainmenu').text, 'Main menu'); });
    it("Save in main menu", function () {
        save = player.getSaving();
    });
    describe("Ending locations", function () {
        beforeEach(function () {
            player.loadSaving(save);
            jumpTo('ending_locations');
        });
        it("win0", function () {
            assert.ok(jumpTo('win0').text === 'Winner');
            var st = jumpTo('');
            assert.ok(st.gameState === 'win');
        });
        it("win1", function () {
            assert.ok(jumpTo('win1').text === 'text');
            assert.ok(jumpTo('').text === 'Winner');
            var st = jumpTo('');
            assert.ok(st.gameState === 'win');
        });
        it("lose0", function () {
            var st = jumpTo('lose0');
            assert.ok(st.gameState === 'fail' && st.text === 'Loser');
        });
        it("lose1", function () {
            assert.ok(jumpTo('lose1').text === 'text');
            var st = jumpTo('');
            assert.ok(st.gameState === 'fail' && st.text === 'Loser');
        });
        it("zombie0", function () {
            var st = jumpTo('zombie0');
            assert.equal(st.gameState, 'dead');
            assert.equal(st.text, 'Zombie');
        });
        it("zombie1", function () {
            assert.ok(jumpTo('zombie1').text === 'text');
            var st = jumpTo('');
            assert.equal(st.gameState, 'dead');
            assert.equal(st.text, 'Zombie');
        });
    });
    describe("Locations with crit params in update", function () {
        beforeEach(function () {
            player.loadSaving(save);
            jumpTo('end_by_crit_in_loc');
        });
        it("Fail no zombie", function () {
            jumpTo('failNoZombie');
            assert.ok(jumpTo().gameState === 'dead');
        });
        it("Fail wuth zombie", function () {
            jumpTo('failZombie');
            var st = jumpTo();
            assert.ok(st.text === 'Zombie');
            assert.equal(st.choices.length, 0);
        });
    });
    describe("Empty locations/jumps", function () {
        beforeEach(function () {
            player.loadSaving(save);
            jumpTo('empty_loc_empty_jump');
        });
        it("loc0text_0empty_jump0text_param=0", function () {
            assert.equal(jumpTo('loc0text_0empty_jump0text_param=0').text, '');
            assert.equal(player.getState().choices.length, 1, 'One choise');
            assert.equal(player.getState().choices.filter(function (x) { return x.active; }).length, 0, 'But inactive');
            assert.equal(player.getState().choices[0].text, 'neverActive');
        });
        it("loc0text_0empty_jump0text_param=1", function () {
            var st = jumpTo("loc0text_0empty_jump0text_param=1");
            assert.equal(player.getState().choices.length, 2);
            assert.equal(jumpTo('2win').text, 'Win');
        });
        it("loc1text_0empty_jump0text_param=0", function () {
            assert.ok(jumpTo('loc1text_0empty_jump0text_param=0').text, 'Text');
            assert.equal(player.getState().choices.length, 1, 'One choise');
            assert.equal(player.getState().choices.filter(function (x) { return x.active; }).length, 0, 'But inactive');
            assert.equal(player.getState().choices[0].text, 'neverActive');
        });
        it("loc1text_0empty_jump0text_param=1", function () {
            assert.ok(jumpTo('loc1text_0empty_jump0text_param=1').text, 'Text');
            assert.equal(player.getState().choices.length, 2);
            assert.equal(jumpTo('2win').text, 'Win');
        });
        it("loc0text_1empty_jump0text_param=0", function () {
            assert.equal(jumpTo('loc0text_1empty_jump0text_param=0').text, '');
            assert.equal(player.getState().choices.length, 1, 'One choise');
            assert.equal(player.getState().choices.filter(function (x) { return x.active; }).length, 0, 'But inactive');
            assert.equal(player.getState().choices[0].text, 'neverActive');
        });
        it("loc0text_1empty_jump0text_param=1", function () {
            jumpTo("loc0text_1empty_jump0text_param=1");
            assert.equal(player.getState().choices.length, 2);
            assert.equal(jumpTo('2win').text, 'Win');
        });
        it("loc0text_1empty_jump1text_locparam=0", function () {
            assert.equal(jumpTo('loc0text_1empty_jump1text_locparam=0').text, 'jumpTextX');
            assert.equal(player.getState().choices.length, 1, 'One choise');
            assert.equal(player.getState().choices.filter(function (x) { return x.active; }).length, 0, 'But inactive');
            assert.equal(player.getState().choices[0].text, 'neverActive');
        });
        it("loc0text_1empty_jump1text_locparam=1", function () {
            assert.equal(jumpTo('loc0text_1empty_jump1text_locparam=1').text, 'jumpText');
            assert.equal(player.getState().choices.length, 2);
            assert.equal(jumpTo('2win').text, 'Win');
        });
    });
    /* TODO
        - Если есть доступные переходы
            - fail на критичных параметрах на Провальном типе (так же как на dead)
            - критичное успешное выдаёт успех (не как fail/dead)

        - Критичный минимум (win/fail/dead)
        
        - Критичные значения на переходе
            - ? как в TGE - обрабатывать всегда, или
                 как в теории - обработать локацию и проверить наличие переходов



    */
    describe("Last test", function () {
        it("Set flag", function () { lastTestOk = true; });
    });
    after(function () {
        if (!lastTestOk) {
            console.info(player.getState());
        }
    });
});
describe('Player on test.qm', function () {
    this.timeout(20 * 1000);
    var save1;
    it("Reads and parses quest", function () {
        var data = fs.readFileSync(__dirname + '/../../src/test/test.qm');
        var qm = qmreader_1.parse(data);
        player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
        player.start();
    });
    it("Have first state", function () {
        var state1 = player.getState();
        assert.ok(state1.text);
        assert.ok(state1.gameState === 'running');
    });
    it("Jumps to accept", function () {
        player.performJump(qmplayer_1.JUMP_I_AGREE);
    });
    it("Starting location jumps count", function () {
        var state2 = player.getState();
        // console.info(JSON.stringify(state2, null, 4));
        assert.equal(state2.choices.filter(function (x) { return x.active; }).length, 2);
        assert.equal(state2.choices.filter(function (x) { return !x.active; }).length, 5);
        assert.ok(state2.choices[0].text.indexOf('p2 / 5') > -1);
        assert.ok(state2.choices[6].text.indexOf('Видно активен по формуле') > -1);
    });
    it("Jumps on jumpid > 2", function () {
        var state2 = player.getState();
        player.performJump(state2.choices.filter(function (x) { return x.jumpId > 2; })[0].jumpId);
        var state3 = player.getState();
        //console.info(JSON.stringify(state3, null, 4));
        // На описании P10
        player.performJump(state3.choices.shift().jumpId);
    });
    it("Next jumps, hideme param show/hide", function () {
        var state4 = player.getState();
        assert.ok(state4.paramsState[5].indexOf('hideme') < 0);
        //console.info(JSON.stringify(state4, null, 4));
        assert.equal(state4.text, 'Текст на переходе');
        player.performJump(state4.choices.shift().jumpId);
        var state5 = player.getState();
        //console.info(JSON.stringify(state5, null, 4));
        assert.ok(state5.paramsState[5].indexOf('hideme') > -1);
    });
    it("\u041F\u0443\u0441\u0442\u0430\u044F1", function () { return assert.equal(jumpTo('Пустая1').text, 'Пустая1'); });
    it("\u041F\u0443\u0441\u0442\u0430\u044F 2", function () {
        var st7 = jumpTo('Пустая 2');
        assert.equal(st7.text, 'Пустая 2 замещенный');
        assert.equal(st7.choices.length, 4);
    });
    it("\u041F\u0443\u0441\u0442\u043E\u0439 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430", function () {
        var save = player.getSaving();
        var st8 = jumpTo('пустой проверка');
        assert.equal(st8.text, 'HangsHere');
        assert.equal(st8.choices.length, 1, 'One choice');
        assert.equal(st8.choices.filter(function (x) { return x.active; }).length, 0, 'Inactive');
        player.loadSaving(save);
    });
    it("EmptyJumps", function () {
        jumpTo('EmptyJumps');
        jumpTo('');
        jumpTo('');
        assert.equal(player.getState().text, 'Пустая 2');
    });
    it("\u041D\u0430 \u0442\u0435\u0441\u0442 \u043A\u0440\u0438\u0442\u0438\u0447\u043D\u044B\u0445", function () {
        jumpTo('тест');
        assert.equal(player.getState().text, 'Тест критичных параметров');
    });
    it("\u0414\u0435\u043B\u0430\u0435\u043C \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435", function () {
        save1 = player.getSaving();
    });
    it("OnJumpWithoutDescription", function () {
        jumpTo('OnJumpWithoutDescription');
        assert.equal(player.getState().text, 'CritInJump');
        jumpTo('');
        //console.info(player.getState());
        assert.equal(player.getState().gameState, 'win');
        player.loadSaving(save1);
    });
    // console.info('After load\n\n', player.getState(), 'saved state itself\n\n', save1);
    it("win", function () {
        jumpTo('win');
        assert.equal(player.getState().text, 'YouAreWinner');
        jumpTo('');
        assert.equal(player.getState().gameState, 'win');
        player.loadSaving(save1);
    });
    it("fail", function () {
        jumpTo('fail');
        assert.equal(player.getState().text, 'You failed');
        assert.equal(player.getState().gameState, 'fail');
        player.loadSaving(save1);
    });
    it("dead", function () {
        jumpTo('dead');
        assert.equal(player.getState().text, 'You are dead');
        assert.equal(player.getState().gameState, 'dead');
        player.loadSaving(save1);
    });
    it("OnJumpWithDescription", function () {
        jumpTo('OnJumpWithDescription');
        assert.equal(player.getState().text, 'Blablabla');
        //console.info(`State = ${player.getSaving().state}`)
        jumpTo('');
        //console.info(`State = ${player.getSaving().state}`)
        jumpTo('');
        assert.equal(player.getState().gameState, 'win');
        player.loadSaving(save1);
    });
    it("\u0421\u043F\u043E\u0440\u043D\u044B\u0435 \u0438 \u043B\u0438\u043C\u0438\u0442 \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u043E\u0432", function () {
        jumpTo('Спорные');
        jumpTo('2times');
        jumpTo('2times');
        jumpTo('2times');
        jumpTo('2times');
        assert.ok(player.getState().choices.length <= 2);
    });
    it("\u0421\u043F\u043E\u0440\u043D\u044B\u0435, \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0432\u0435\u0440\u043E\u044F\u0442\u043D\u043E\u0442\u0435\u0439", function () {
        var randomJumpCount = 0;
        for (var i = 0; i < 700; i++) {
            // console.info(`i=${i}, f=${((i+2) % 3) + 1} val=${parseInt(player.getState().text)}`);
            assert.equal(((i + 2) % 3) + 1, parseInt(player.getState().text), "X1"); // + JSON.stringify(player.getSaving(), null, 4));
            randomJumpCount += player.getState().choices.filter(function (x) { return x.text.indexOf('random') > -1; }).length;
            jumpTo('oooo');
            // console.info(`~~~~~~~~~~~~~~~~~~~~~~~~~~ i=${i} f=${((i) % 6) + 3} state=${parseInt(player.getState().text)}`)
            assert.equal(((i) % 6) + 3, parseInt(player.getState().text), "X2");
            jumpTo('back');
        }
        var st10 = player.getState();
        var n4 = parseInt(st10.paramsState[3].replace('<clr>', '').replace('<clrEnd>', ''));
        var n5 = parseInt(st10.paramsState[4].replace('<clr>', '').replace('<clrEnd>', ''));
        var n6 = parseInt(st10.paramsState[5].replace('<clr>', '').replace('<clrEnd>', ''));
        assert.ok(n4 > 50 && n4 < 150);
        assert.ok(n5 > 350 && n5 < 450);
        assert.ok(n6 > 150 && n6 < 250);
        assert.ok(randomJumpCount > 100 && randomJumpCount < 200);
        player.loadSaving(save1);
    });
    it("LocationCritOnEmpty -> ToLocationWhichSetsCritParam-WithoutDesc", function () {
        jumpTo('LocationCritOnEmpty');
        jumpTo('ToLocationWhichSetsCritParam-WithoutDesc');
        assert.equal(player.getState().text, 'That location have crit param');
        assert.equal(player.getState().choices.length, 1);
        jumpTo('');
        assert.equal(player.getState().text, 'CritLocationMessage');
        jumpTo('');
        assert.equal(player.getState().gameState, 'win');
        player.loadSaving(save1);
    });
    it("LocationCritOnEmpty -> ToLocationWhichSetsCritParam-WithDesc", function () {
        jumpTo('LocationCritOnEmpty');
        jumpTo('ToLocationWhichSetsCritParam-WithDesc');
        assert.equal(player.getState().text, 'Description');
        assert.equal(player.getState().choices.length, 1);
        jumpTo('');
        assert.equal(player.getState().text, 'That location have crit param');
        assert.equal(player.getState().choices.length, 1);
        jumpTo('');
        assert.equal(player.getState().text, 'CritLocationMessage');
        jumpTo('');
        assert.equal(player.getState().gameState, 'win');
        player.loadSaving(save1);
    });
    it("LocationCritOnEmpty -> ToEmptyLocationWhichSetsCritParam-WithoutDesc", function () {
        jumpTo('LocationCritOnEmpty');
        // console.info(`State === ` + player.getSaving().state);
        jumpTo('ToEmptyLocationWhichSetsCritParam-WithoutDesc');
        // console.info(`State === ` + player.getSaving().state);;
        assert.equal(player.getState().text, 'CritEmptyLocationMessage');
        jumpTo('');
        assert.equal(player.getState().gameState, 'win');
        player.loadSaving(save1);
    });
    it("LocationCritOnEmpty -> ToEmptyLocationWhichSetsCritParam-WithDesc", function () {
        jumpTo('LocationCritOnEmpty');
        jumpTo('ToEmptyLocationWhichSetsCritParam-WithDesc');
        assert.equal(player.getState().text, 'Description');
        assert.equal(player.getState().choices.length, 1);
        jumpTo('');
        jumpTo('');
        assert.equal(player.getState().gameState, 'win');
        player.loadSaving(save1);
    });
});
