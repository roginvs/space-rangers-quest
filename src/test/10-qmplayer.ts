import { parse } from "../lib/qmreader";

import * as fs from "fs";
import * as assert from "assert";
import "mocha";

import { QMPlayer, GameState, JUMP_I_AGREE } from "../lib/qmplayer";

// tslint:disable:no-invalid-this

let player: QMPlayer;

function jumpTo(text: string = "") {
  const state = player.getState();
  const jump = state.choices.filter((x) => x.text.indexOf(text) > -1 && x.active).shift();
  if (!jump) {
    throw new Error(`OLOLO: No jump ${text} in ` + JSON.stringify(state, null, 4));
  }
  player.performJump(jump.jumpId);
  // console.info(player.getState());
  return player.getState();
}
describe("Player on test6-empty.qm", function () {
  let save: GameState;
  it(`Reads and parses quest`, () => {
    const data = fs.readFileSync(__dirname + "/../../src/test/test6-empty.qm");
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // false
    player.start();
    player.performJump(JUMP_I_AGREE);
    save = player.getSaving();
  });
  describe("Crit params on loc/jumps", () => {
    beforeEach(() => {
      player.loadSaving(save);
    });
    it(`failonloc_chain`, () => {
      jumpTo("failonloc_chain");
      assert.strictEqual(player.getState().text, "p2_at_l11");
      assert.strictEqual(player.getState().gameState, "fail");
    });
    it(`success_on_loc_jumptext`, () => {
      jumpTo("success_on_loc_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "success_on_loc_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });
    it(`success_on_loc_no_jumptext`, () => {
      jumpTo("success_on_loc_no_jumptext");
      assert.strictEqual(player.getState().text, "success_on_loc_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });
    it(`success_on_locnotext_nojumptext`, () => {
      jumpTo("success_on_locnotext_nojumptext");
      assert.strictEqual(player.getState().text, "p1_at_l10");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });
    it(`success_on_locnotext_jumptext`, () => {
      jumpTo("success_on_locnotext_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "p1_at_l10");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });
    it(`success_on_jump_jumptext`, () => {
      jumpTo("success_on_jump_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "success_on_jump_jumptext_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });
    it(`success_on_jump_nojumptext`, () => {
      jumpTo("success_on_jump_nojumptext");
      assert.strictEqual(player.getState().text, "success_on_jump_nojumptext_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });

    it(`fail_on_jump_jumptext`, () => {
      jumpTo("fail_on_jump_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "fail_jump_msg");
      assert.strictEqual(player.getState().gameState, "fail");
    });
    it(`fail_on_jump_nojumptext`, () => {
      jumpTo("fail_on_jump_nojumptext");
      assert.strictEqual(player.getState().text, "fail_jump_text");
      assert.strictEqual(player.getState().gameState, "fail");
    });
    it(`fail_on_loc_jumptext`, () => {
      jumpTo("fail_on_loc_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "fail_loc_msg");
      assert.strictEqual(player.getState().gameState, "fail");
    });
    it(`fail_on_loc_nojumptext`, () => {
      jumpTo("fail_on_loc_nojumptext");
      assert.strictEqual(player.getState().text, "fail_loc_msg");
      assert.strictEqual(player.getState().gameState, "fail");
    });
    it(`fail_on_locnotext_jumptext`, () => {
      jumpTo("fail_on_locnotext_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "p2_failed_on_L9");
      assert.strictEqual(player.getState().gameState, "fail");
    });
    it(`fail_on_locnotext_nojumptext`, () => {
      jumpTo("fail_on_locnotext_nojumptext");
      assert.strictEqual(player.getState().text, "p2_failed_on_L9");
      assert.strictEqual(player.getState().gameState, "fail");
    });

    it(`death_on_jump_jumptext`, () => {
      jumpTo("death_on_jump_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "dead_jump_msg");
      assert.strictEqual(player.getState().gameState, "dead");
    });
    it(`death_on_jump_nojumptext`, () => {
      jumpTo("death_on_jump_nojumptext");
      assert.strictEqual(player.getState().text, "dead_jump_msg");
      assert.strictEqual(player.getState().gameState, "dead");
    });
    it(`death_on_loc_jumptext`, () => {
      jumpTo("death_on_loc_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "dead_on_loc");
      assert.strictEqual(player.getState().gameState, "dead");
    });
    it(`death_on_loc_nojumptext`, () => {
      jumpTo("death_on_loc_nojumptext");
      assert.strictEqual(player.getState().text, "dead_on_loc");
      assert.strictEqual(player.getState().gameState, "dead");
    });
  });
});

describe("Player on test6.qm", function () {
  let save: GameState;
  it(`Reads and parses quest`, () => {
    const data = fs.readFileSync(__dirname + "/../../src/test/test6.qm");
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // true
    player.start();
    player.performJump(JUMP_I_AGREE);
    save = player.getSaving();
  });
  describe("Crit params on loc/jumps with active jump", () => {
    beforeEach(() => {
      player.loadSaving(save);
    });
    it(`success_on_loc_jumptext`, () => {
      jumpTo("success_on_loc_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "success_on_loc");
      jumpTo("");
      assert.strictEqual(player.getState().text, "success_on_loc_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });
    it(`success_on_loc_no_jumptext`, () => {
      jumpTo("success_on_loc_no_jumptext");
      assert.strictEqual(player.getState().text, "success_on_loc");
      jumpTo("");
      assert.strictEqual(player.getState().text, "success_on_loc_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });
    it(`success_on_jump_jumptext`, () => {
      jumpTo("success_on_jump_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "success_on_jump_jumptext_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });
    it(`success_on_jump_nojumptext`, () => {
      jumpTo("success_on_jump_nojumptext");
      assert.strictEqual(player.getState().text, "success_on_jump_nojumptext_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });

    it(`fail_on_jump_jumptext`, () => {
      jumpTo("fail_on_jump_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "fail_jump_msg");
      assert.strictEqual(player.getState().gameState, "fail");
    });
    it(`fail_on_jump_nojumptext`, () => {
      jumpTo("fail_on_jump_nojumptext");
      assert.strictEqual(player.getState().text, "fail_jump_text");
      assert.strictEqual(player.getState().gameState, "fail");
    });
    it(`fail_on_loc_jumptext live-after-fail`, () => {
      jumpTo("fail_on_loc_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "fail_on_loc");
      /* Here is live-after-fail */
      jumpTo("");
      assert.strictEqual(player.getState().text, "L3");
      assert.strictEqual(player.getState().gameState, "running");
    });
    it(`fail_on_loc_nojumptext`, () => {
      jumpTo("fail_on_loc_nojumptext");
      assert.strictEqual(player.getState().text, "fail_on_loc");
      /* Here is live-after-fail */
      jumpTo("");
      assert.strictEqual(player.getState().text, "L3");
      assert.strictEqual(player.getState().gameState, "running");
    });

    it(`death_on_jump_jumptext`, () => {
      jumpTo("death_on_jump_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "dead_jump_msg");
      assert.strictEqual(player.getState().gameState, "dead");
    });
    it(`death_on_jump_nojumptext`, () => {
      jumpTo("death_on_jump_nojumptext");
      assert.strictEqual(player.getState().text, "dead_jump_msg");
      assert.strictEqual(player.getState().gameState, "dead");
    });
    it(`death_on_loc_jumptext`, () => {
      jumpTo("death_on_loc_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "death_on_loc");
      /* Here is live-after-dead */
      jumpTo("");
      assert.strictEqual(player.getState().text, "L3");
      assert.strictEqual(player.getState().gameState, "running");
    });
    it(`death_on_loc_nojumptext`, () => {
      jumpTo("death_on_loc_nojumptext");
      assert.strictEqual(player.getState().text, "death_on_loc");
      /* Here is live-after-dead */
      jumpTo("");
      assert.strictEqual(player.getState().text, "L3");
      assert.strictEqual(player.getState().gameState, "running");
    });
  });
  describe("Crit params on loc/jumps without active jump", () => {
    beforeEach(() => {
      player.loadSaving(save);
      jumpTo("enable_lock");
    });
    it(`success_on_loc_jumptext`, () => {
      jumpTo("success_on_loc_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "success_on_loc");
      jumpTo("");
      assert.strictEqual(player.getState().text, "success_on_loc_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });
    it(`success_on_loc_no_jumptext`, () => {
      jumpTo("success_on_loc_no_jumptext");
      assert.strictEqual(player.getState().text, "success_on_loc");
      jumpTo("");
      assert.strictEqual(player.getState().text, "success_on_loc_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });
    it(`success_on_jump_jumptext`, () => {
      jumpTo("success_on_jump_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "success_on_jump_jumptext_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });
    it(`success_on_jump_nojumptext`, () => {
      jumpTo("success_on_jump_nojumptext");
      assert.strictEqual(player.getState().text, "success_on_jump_nojumptext_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });

    it(`fail_on_jump_jumptext`, () => {
      jumpTo("fail_on_jump_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "fail_jump_msg");
      assert.strictEqual(player.getState().gameState, "fail");
    });
    it(`fail_on_jump_nojumptext`, () => {
      jumpTo("fail_on_jump_nojumptext");
      assert.strictEqual(player.getState().text, "fail_jump_text");
      assert.strictEqual(player.getState().gameState, "fail");
    });
    it(`fail_on_loc_jumptext`, () => {
      jumpTo("fail_on_loc_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "fail_on_loc");
      jumpTo("");
      assert.strictEqual(player.getState().text, "fail_loc_msg");
      assert.strictEqual(player.getState().gameState, "fail");
    });
    it(`fail_on_loc_nojumptext`, () => {
      jumpTo("fail_on_loc_nojumptext");
      assert.strictEqual(player.getState().text, "fail_on_loc");
      jumpTo("");
      assert.strictEqual(player.getState().text, "fail_loc_msg");
      assert.strictEqual(player.getState().gameState, "fail");
    });

    it(`death_on_jump_jumptext`, () => {
      jumpTo("death_on_jump_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "dead_jump_msg");
      assert.strictEqual(player.getState().gameState, "dead");
    });
    it(`death_on_jump_nojumptext`, () => {
      jumpTo("death_on_jump_nojumptext");
      assert.strictEqual(player.getState().text, "dead_jump_msg");
      assert.strictEqual(player.getState().gameState, "dead");
    });
    it(`death_on_loc_jumptext`, () => {
      jumpTo("death_on_loc_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "death_on_loc");
      jumpTo("");
      assert.strictEqual(player.getState().text, "dead_on_loc");
      assert.strictEqual(player.getState().gameState, "dead");
    });
    it(`death_on_loc_nojumptext`, () => {
      jumpTo("death_on_loc_nojumptext");
      assert.strictEqual(player.getState().text, "death_on_loc");
      jumpTo("");
      assert.strictEqual(player.getState().text, "dead_on_loc");
      assert.strictEqual(player.getState().gameState, "dead");
    });
  });
});

describe("Player on test6.qm with permitLiveAfterDeath=false", function () {
  let save: GameState;
  it(`Reads and parses quest`, () => {
    const data = fs.readFileSync(__dirname + "/../../src/test/test6.qmm");
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // false
    player.start();
    player.performJump(JUMP_I_AGREE);
    save = player.getSaving();
  });
  describe("Crit params on loc/jumps with active jump", () => {
    beforeEach(() => {
      player.loadSaving(save);
    });
    it(`success_on_loc_jumptext`, () => {
      jumpTo("success_on_loc_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "success_on_loc");
      jumpTo("");
      assert.strictEqual(player.getState().text, "success_on_loc_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });
    it(`success_on_loc_no_jumptext`, () => {
      jumpTo("success_on_loc_no_jumptext");
      assert.strictEqual(player.getState().text, "success_on_loc");
      jumpTo("");
      assert.strictEqual(player.getState().text, "success_on_loc_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });
    it(`success_on_jump_jumptext`, () => {
      jumpTo("success_on_jump_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "success_on_jump_jumptext_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });
    it(`success_on_jump_nojumptext`, () => {
      jumpTo("success_on_jump_nojumptext");
      assert.strictEqual(player.getState().text, "success_on_jump_nojumptext_msg");
      jumpTo("");
      assert.strictEqual(player.getState().gameState, "win");
    });

    it(`fail_on_jump_jumptext`, () => {
      jumpTo("fail_on_jump_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "fail_jump_msg");
      assert.strictEqual(player.getState().gameState, "fail");
    });
    it(`fail_on_jump_nojumptext`, () => {
      jumpTo("fail_on_jump_nojumptext");
      assert.strictEqual(player.getState().text, "fail_jump_text");
      assert.strictEqual(player.getState().gameState, "fail");
    });

    it(`fail_on_loc_jumptext`, () => {
      jumpTo("fail_on_loc_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "fail_on_loc");
      jumpTo("");
      assert.strictEqual(player.getState().text, "fail_loc_msg");
      assert.strictEqual(player.getState().gameState, "fail");
    });

    it(`fail_on_loc_nojumptext`, () => {
      jumpTo("fail_on_loc_nojumptext");
      assert.strictEqual(player.getState().text, "fail_on_loc");
      jumpTo("");
      assert.strictEqual(player.getState().text, "fail_loc_msg");
      assert.strictEqual(player.getState().gameState, "fail");
    });

    it(`death_on_jump_jumptext`, () => {
      jumpTo("death_on_jump_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "dead_jump_msg");
      assert.strictEqual(player.getState().gameState, "dead");
    });
    it(`death_on_jump_nojumptext`, () => {
      jumpTo("death_on_jump_nojumptext");
      assert.strictEqual(player.getState().text, "dead_jump_msg");
      assert.strictEqual(player.getState().gameState, "dead");
    });
    it(`death_on_loc_jumptext`, () => {
      jumpTo("death_on_loc_jumptext");
      assert.strictEqual(player.getState().text, "jumptext");
      jumpTo("");
      assert.strictEqual(player.getState().text, "death_on_loc");
      jumpTo("");
      assert.strictEqual(player.getState().text, "dead_on_loc");
      assert.strictEqual(player.getState().gameState, "dead");
    });
    it(`death_on_loc_nojumptext`, () => {
      jumpTo("death_on_loc_nojumptext");
      assert.strictEqual(player.getState().text, "death_on_loc");
      jumpTo("");
      assert.strictEqual(player.getState().text, "dead_on_loc");
      assert.strictEqual(player.getState().gameState, "dead");
    });
  });
});

describe("Player on test5.qm", function () {
  it(`Reads and parses quest`, () => {
    const data = fs.readFileSync(__dirname + "/../../src/test/test5.qm");
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // true
    player.start();
  });
  it(`Accept`, () => player.performJump(JUMP_I_AGREE));
  it(`In L2`, () => {
    assert.strictEqual(player.getState().text, "L2");
  });
});

describe("Player on test5-emptystart-usingformula.qm", function () {
  it(`Reads and parses quest`, () => {
    const data = fs.readFileSync(__dirname + "/../../src/test/test5-emptystart-usingformula.qm");
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // true
    player.start();
  });
  it(`Accept`, () => player.performJump(JUMP_I_AGREE));
  it(`In L2`, () => {
    assert.strictEqual(player.getState().text, "L2");
  });
});
describe("Player on test5-emptystart-usingorder.qm", function () {
  it(`Reads and parses quest`, () => {
    const data = fs.readFileSync(__dirname + "/../../src/test/test5-emptystart-usingorder.qm");
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // true
    player.start();
  });
  it(`Accept`, () => player.performJump(JUMP_I_AGREE));
  it(`have jump`, () => jumpTo(""));
  it(`In L2`, () => {
    assert.strictEqual(player.getState().text, "L2");
  });
});
describe("Player on test5-emptyloctext-emptyloc-autojump.qm", function () {
  it(`Reads and parses quest`, () => {
    const data = fs.readFileSync(
      __dirname + "/../../src/test/test5-emptyloctext-emptyloc-autojump.qm",
    );
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // true
    player.start();
  });
  it(`Accept`, () => player.performJump(JUMP_I_AGREE));
  it(`In L2`, () => {
    assert.strictEqual(player.getState().text, "L2");
  });
});
describe("Player on test5-emptyloctext-emptyloc-noautojump.qm doing 1-8", function () {
  beforeEach(() => {
    const data = fs.readFileSync(
      __dirname + "/../../src/test/test5-emptyloctext-emptyloc-noautojump.qm",
    );
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // true
    player.start();
    player.performJump(JUMP_I_AGREE);
  });

  it(`1_nojumptext_emptyloc_noloctext_jumptext`, () => {
    jumpTo("1_nojumptext_emptyloc_noloctext_jumptext");
    assert.strictEqual(player.getState().text, "");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`2_jumptext_emptyloc_noloctext_jumptext`, () => {
    jumpTo("2_jumptext_emptyloc_noloctext_jumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`3_nojumptext_noemptyloc_noloctext_jumptext`, () => {
    jumpTo("3_nojumptext_noemptyloc_noloctext_jumptext");
    assert.strictEqual(player.getState().text, "");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`4_jumptext_noemptyloc_noloctext_jumptext`, () => {
    jumpTo("4_jumptext_noemptyloc_noloctext_jumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, "");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });

  it(`5_nojumptext_emptyloc_loctext_jumptext`, () => {
    jumpTo("5_nojumptext_emptyloc_loctext_jumptext");
    assert.strictEqual(player.getState().text, "L10");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`6_jumptext_emptyloc_loctext_jumptext`, () => {
    jumpTo("6_jumptext_emptyloc_loctext_jumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`7_nojumptext_noemptyloc_loctext_jumptext`, () => {
    jumpTo("7_nojumptext_noemptyloc_loctext_jumptext");
    assert.strictEqual(player.getState().text, "L11");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`8_jumptext_noemptyloc_loctext_jumptext`, () => {
    jumpTo("8_jumptext_noemptyloc_loctext_jumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L13");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
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

describe("Player on test5-emptyloctext-emptyloc-autojump.qm doing 9-16", function () {
  beforeEach(() => {
    const data = fs.readFileSync(
      __dirname + "/../../src/test/test5-emptyloctext-emptyloc-autojump.qm",
    );
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // true
    player.start();
    player.performJump(JUMP_I_AGREE);
  });

  it(`9_nojumptext_emptyloc_noloctext_nojumptext`, () => {
    jumpTo("9_nojumptext_emptyloc_noloctext_nojumptext");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`10_jumptext_emptyloc_noloctext_nojumptext`, () => {
    jumpTo("10_jumptext_emptyloc_noloctext_nojumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`11_nojumptext_noemptyloc_noloctext_nojumptext`, () => {
    jumpTo("11_nojumptext_noemptyloc_noloctext_nojumptext");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`12_jumptext_noemptyloc_noloctext_nojumptext`, () => {
    jumpTo("12_jumptext_noemptyloc_noloctext_nojumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });

  it(`13_nojumptext_emptyloc_loctext_nojumptext`, () => {
    jumpTo("13_nojumptext_emptyloc_loctext_nojumptext");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`14_jumptext_emptyloc_loctext_nojumptext`, () => {
    jumpTo("14_jumptext_emptyloc_loctext_nojumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`15_nojumptext_noemptyloc_loctext_nojumptext`, () => {
    jumpTo("15_nojumptext_noemptyloc_loctext_nojumptext");
    assert.strictEqual(player.getState().text, "L11");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`16_jumptext_noemptyloc_loctext_nojumptext`, () => {
    jumpTo("16_jumptext_noemptyloc_loctext_nojumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L13");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
});

describe("Player on test5-emptyloctext-emptyloc-noautojump.qmm", function () {
  it("Loads quest", () => {
    const data = fs.readFileSync(
      __dirname + "/../../src/test/test5-emptyloctext-emptyloc-noautojump.qmm",
    );
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // true
    player.start();
    player.performJump(JUMP_I_AGREE);
  });
  it.skip("Location is empty, but have text, so it is shown", () => {
    assert.strictEqual(player.getState().text, "Empry loc with text");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L2");
  });
});

describe.skip("Player on test5-emptyloctext-emptyloc-noautojump.qmm doing 1-8", function () {
  beforeEach(() => {
    const data = fs.readFileSync(
      __dirname + "/../../src/test/test5-emptyloctext-emptyloc-noautojump.qmm",
    );
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // true
    player.start();
    player.performJump(JUMP_I_AGREE);
    jumpTo("");
  });

  it(`1_nojumptext_emptyloc_noloctext_jumptext`, () => {
    jumpTo("1_nojumptext_emptyloc_noloctext_jumptext");
    assert.strictEqual(player.getState().text, ""); // L2 here in TGE 5.2.9
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`2_jumptext_emptyloc_noloctext_jumptext`, () => {
    jumpTo("2_jumptext_emptyloc_noloctext_jumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`3_nojumptext_noemptyloc_noloctext_jumptext`, () => {
    jumpTo("3_nojumptext_noemptyloc_noloctext_jumptext");
    assert.strictEqual(player.getState().text, ""); // L2 here in TGE 5.2.9
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`4_jumptext_noemptyloc_noloctext_jumptext`, () => {
    jumpTo("4_jumptext_noemptyloc_noloctext_jumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, ""); // jumptext here in TGE 5.2.9
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });

  it(`5_nojumptext_emptyloc_loctext_jumptext`, () => {
    jumpTo("5_nojumptext_emptyloc_loctext_jumptext");
    assert.strictEqual(player.getState().text, "L10");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`6_jumptext_emptyloc_loctext_jumptext`, () => {
    jumpTo("6_jumptext_emptyloc_loctext_jumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`7_nojumptext_noemptyloc_loctext_jumptext`, () => {
    jumpTo("7_nojumptext_noemptyloc_loctext_jumptext");
    assert.strictEqual(player.getState().text, "L11");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`8_jumptext_noemptyloc_loctext_jumptext`, () => {
    jumpTo("8_jumptext_noemptyloc_loctext_jumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L13");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
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

describe.skip("Player on test5-emptyloctext-emptyloc-autojump.qmm doing 9-16", function () {
  beforeEach(() => {
    const data = fs.readFileSync(
      __dirname + "/../../src/test/test5-emptyloctext-emptyloc-autojump.qmm",
    );
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // true
    player.start();
    player.performJump(JUMP_I_AGREE);
    jumpTo();
  });

  it(`9_nojumptext_emptyloc_noloctext_nojumptext`, () => {
    jumpTo("9_nojumptext_emptyloc_noloctext_nojumptext");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`10_jumptext_emptyloc_noloctext_nojumptext`, () => {
    jumpTo("10_jumptext_emptyloc_noloctext_nojumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`11_nojumptext_noemptyloc_noloctext_nojumptext`, () => {
    jumpTo("11_nojumptext_noemptyloc_noloctext_nojumptext");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`12_jumptext_noemptyloc_noloctext_nojumptext`, () => {
    jumpTo("12_jumptext_noemptyloc_noloctext_nojumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });

  it(`13_nojumptext_emptyloc_loctext_nojumptext`, () => {
    jumpTo("13_nojumptext_emptyloc_loctext_nojumptext");
    assert.strictEqual(player.getState().text, "L10"); // Here is difference between tge4 and tge5
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`14_jumptext_emptyloc_loctext_nojumptext`, () => {
    jumpTo("14_jumptext_emptyloc_loctext_nojumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`15_nojumptext_noemptyloc_loctext_nojumptext`, () => {
    jumpTo("15_nojumptext_noemptyloc_loctext_nojumptext");
    assert.strictEqual(player.getState().text, "L11");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
  it(`16_jumptext_noemptyloc_loctext_nojumptext`, () => {
    jumpTo("16_jumptext_noemptyloc_loctext_nojumptext");
    assert.strictEqual(player.getState().text, "jumptext");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L13");
    jumpTo("");
    assert.strictEqual(player.getState().text, "L6");
  });
});

describe("Player on test4.qm", function () {
  this.timeout(20 * 1000);

  let save: GameState;

  it(`Reads and parses quest`, () => {
    const data = fs.readFileSync(__dirname + "/../../src/test/test4.qm");
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // true
    player.start();
  });
  it(`Accept`, () => player.performJump(JUMP_I_AGREE));

  describe(`Available jumps`, () => {
    it(`2 jumps available, going first loop`, () => {
      jumpTo("-> L1");
      assert.strictEqual(
        player.getState().choices.length,
        3,
        "Three jump available " + JSON.stringify(player.getState()),
      );
      save = player.getSaving();
      jumpTo("-> L8");
      jumpTo("-> L9");
      jumpTo("-> Start");
      jumpTo("-> L8");
      assert.strictEqual(player.getState().choices.length, 0, "Dead end here");
      player.loadSaving(save);
    });
    it(`2 jumps available, going second loop`, () => {
      assert.strictEqual(player.getState().choices.length, 3, "Three jump available");
      jumpTo("-> L2");
      jumpTo("-> L3");
      jumpTo("-> Start");
      assert.strictEqual(player.getState().choices.length, 2, "Two jumps left");
    });
    it(`2 jumps available, going third loop`, () => {
      jumpTo("-> L4");
      jumpTo("-> L6");
      jumpTo("-> L7");
      jumpTo("-> L4");
      assert.strictEqual(player.getState().text, "L4");
      assert.strictEqual(player.getState().choices.length, 1);
      jumpTo("");
    });
    it(`L5`, () => {
      assert.strictEqual(player.getState().text, "L5");
      jumpTo("-> L10");
      jumpTo("-> L11");
      jumpTo("-> L5");
      jumpTo("-> L10");
      jumpTo("-> L11");
      jumpTo("-> L5");
      assert.strictEqual(player.getState().choices.length, 1);
      jumpTo("-> L13");
    });
    it(`L13`, () => {
      assert.strictEqual(player.getState().text, "L13");
      assert.strictEqual(player.getState().choices.length, 4);
      save = player.getSaving();
      jumpTo("-> L16");
      assert.strictEqual(player.getState().choices.length, 0, "L16 is dead end");
      player.loadSaving(save);
      jumpTo("-> L18");
      assert.strictEqual(
        player.getState().choices.filter((x) => x.active).length,
        0,
        "L18 is dead end",
      );
      player.loadSaving(save);
      jumpTo("-> L14");
      jumpTo("-> L13");
      jumpTo("-> L14");
      jumpTo("-> L13");
      assert.strictEqual(player.getState().choices.length, 3);
    });
  });
});
describe("Player on test3.qm", function () {
  this.timeout(20 * 1000);

  let save: GameState;
  let lastTestOk = false;

  it(`Reads and parses quest`, () => {
    const data = fs.readFileSync(__dirname + "/../../src/test/test3.qm");
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // true
    player.start();
  });
  it(`Accept`, () => player.performJump(JUMP_I_AGREE));

  describe(`Empty locations/jumps`, () => {
    beforeEach(() => {
      save = player.getSaving();
    });
    afterEach(() => {
      player.loadSaving(save);
    });
    it(`loc0text_0empty_jump0text_param=0`, () => {
      jumpTo("loc0text_0empty_jump0text_param=0");
      assert.strictEqual(player.getState().text, "Main menu", "Wants main menu");
    });
    it(`loc0text_0empty_jump0text_param=1`, () => {
      //      const st =
      jumpTo(`loc0text_0empty_jump0text_param=1`);
      assert.strictEqual(player.getState().choices.length, 1);
      assert.strictEqual(player.getState().text, "");
      assert.strictEqual(jumpTo("2win").text, "Win");
    });
    it(`loc1text_0empty_jump0text_param=0`, () => {
      assert.ok(jumpTo("loc1text_0empty_jump0text_param=0").text, "Text");
      assert.strictEqual(player.getState().choices.length, 1, "One choise");
    });
    it(`loc1text_0empty_jump0text_param=1`, () => {
      assert.ok(jumpTo("loc1text_0empty_jump0text_param=1").text, "Text");
      assert.strictEqual(player.getState().choices.length, 1);
      assert.strictEqual(jumpTo("2win").text, "Win");
    });
    it(`loc0text_1empty_jump0text_param=0`, () => {
      assert.strictEqual(jumpTo("loc0text_1empty_jump0text_param=0").text, "Main menu");
    });
    it(`loc0loctext1text_1empty_jump0text_param=0`, () => {
      assert.strictEqual(jumpTo("loc0loctext1text_1empty_jump0text_param=0").text, "Main menu");
    });
    it(`loc1loctext1text_1empty_jump0text_param=0`, () => {
      assert.strictEqual(jumpTo("loc1loctext1text_1empty_jump0text_param=0").text, "some_text_l23");
      assert.strictEqual(jumpTo("").text, "Main menu");
    });
    it(`loc0loctext1jumptext1text_1empty_jump0text_param=0`, () => {
      assert.strictEqual(
        jumpTo("loc0loctext1jumptext1text_1empty_jump0text_param=0").text,
        "jump52text",
      );
      assert.strictEqual(jumpTo("").text, "Main menu");
    });
    it(`loc1loctext1jumptext1text_1empty_jump0text_param=0`, () => {
      assert.strictEqual(
        jumpTo("loc1loctext1jumptext1text_1empty_jump0text_param=0").text,
        "jump53text",
      );
      assert.strictEqual(jumpTo("").text, "some_text_l23");
      assert.strictEqual(jumpTo("").text, "Main menu");
    });

    it(`loc0text_1empty_jump0text_param=1`, () => {
      jumpTo(`loc0text_1empty_jump0text_param=1`);
      assert.strictEqual(player.getState().choices.length, 1);
      assert.strictEqual(jumpTo("2win").text, "Win");
    });
    it(`loc0text_1empty_jump1text_locparam=0`, () => {
      assert.strictEqual(jumpTo("loc0text_1empty_jump1text_locparam=0").text, "jumpTextX");
      assert.strictEqual(jumpTo("").text, "Main menu");
    });
    it(`loc0text_1empty_jump1text_locparam=1`, () => {
      assert.strictEqual(jumpTo("loc0text_1empty_jump1text_locparam=1").text, "jumpText");
      assert.strictEqual(player.getState().choices.length, 1);
      assert.strictEqual(jumpTo("2win").text, "Win");
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

  describe(`Last test`, () => {
    it(`Set flag`, () => {
      lastTestOk = true;
    });
  });

  after(function () {
    if (!lastTestOk) {
      console.info(player.getState());
    }
  });
});

describe("Player on test2.qm", function () {
  this.timeout(20 * 1000);

  let save: GameState;
  let lastTestOk = false;

  it(`Reads and parses quest`, () => {
    const data = fs.readFileSync(__dirname + "/../../src/test/test2.qm");
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // true
    player.start();
  });
  it(`Accept`, () => player.performJump(JUMP_I_AGREE));
  it(`Main menu`, () => assert.strictEqual(jumpTo("mainmenu").text, "Main menu"));
  it(`To equal`, () => assert.strictEqual(jumpTo("To equal").text, "Here should be 1 jump"));
  it(`Next`, () => {
    assert.strictEqual(player.getState().choices.length, 1);
    jumpTo("next");
    assert.strictEqual(player.getState().text, "Text2");
  });
  it(`Next`, () => {
    assert.strictEqual(player.getState().choices.length, 1);
    jumpTo("next");
    assert.strictEqual(player.getState().text, "Text3");
  });
  it(`Main menu`, () => assert.strictEqual(jumpTo("mainmenu").text, "Main menu"));
  it(`Save in main menu`, () => {
    save = player.getSaving();
  });
  describe(`Ending locations`, () => {
    beforeEach(() => {
      player.loadSaving(save);
      jumpTo("ending_locations");
    });
    it(`win0`, () => {
      assert.ok(jumpTo("win0").text === "Winner");
      const st = jumpTo("");
      assert.ok(st.gameState === "win");
    });
    it(`win1`, () => {
      assert.ok(jumpTo("win1").text === "text");
      assert.ok(jumpTo("").text === "Winner");
      const st = jumpTo("");
      assert.ok(st.gameState === "win");
    });

    it(`lose0`, () => {
      const st = jumpTo("lose0");
      assert.ok(st.gameState === "fail" && st.text === "Loser");
    });
    it(`lose1`, () => {
      assert.ok(jumpTo("lose1").text === "text");
      const st = jumpTo("");
      assert.ok(st.gameState === "fail" && st.text === "Loser");
    });

    it(`zombie0`, () => {
      const st = jumpTo("zombie0");
      assert.strictEqual(st.gameState, "dead");
      assert.strictEqual(st.text, "Zombie");
    });
    it(`zombie1`, () => {
      assert.ok(jumpTo("zombie1").text === "text");
      const st = jumpTo("");
      assert.strictEqual(st.gameState, "dead");
      assert.strictEqual(st.text, "Zombie");
    });
  });
  describe(`Locations with crit params in update`, () => {
    beforeEach(() => {
      player.loadSaving(save);
      jumpTo("end_by_crit_in_loc");
    });
    it(`Fail no zombie`, () => {
      jumpTo("failNoZombie");
      assert.ok(jumpTo().gameState === "dead");
    });
    it(`Fail wuth zombie`, () => {
      jumpTo("failZombie");
      const st = jumpTo();
      assert.ok(st.text === "Zombie");
      assert.strictEqual(st.choices.length, 0);
    });
  });

  describe(`Empty locations/jumps`, () => {
    beforeEach(() => {
      player.loadSaving(save);
      jumpTo("empty_loc_empty_jump");
    });
    it(`loc0text_0empty_jump0text_param=0`, () => {
      assert.strictEqual(jumpTo("loc0text_0empty_jump0text_param=0").text, "");
      assert.strictEqual(player.getState().choices.length, 1, "One choise");
      assert.strictEqual(
        player.getState().choices.filter((x) => x.active).length,
        0,
        "But inactive",
      );
      assert.strictEqual(player.getState().choices[0].text, "neverActive");
    });
    it(`loc0text_0empty_jump0text_param=1`, () => {
      //      const st =
      jumpTo(`loc0text_0empty_jump0text_param=1`);
      assert.strictEqual(player.getState().choices.length, 2);
      assert.strictEqual(jumpTo("2win").text, "Win");
    });
    it(`loc1text_0empty_jump0text_param=0`, () => {
      assert.ok(jumpTo("loc1text_0empty_jump0text_param=0").text, "Text");
      assert.strictEqual(player.getState().choices.length, 1, "One choise");
      assert.strictEqual(
        player.getState().choices.filter((x) => x.active).length,
        0,
        "But inactive",
      );
      assert.strictEqual(player.getState().choices[0].text, "neverActive");
    });
    it(`loc1text_0empty_jump0text_param=1`, () => {
      assert.ok(jumpTo("loc1text_0empty_jump0text_param=1").text, "Text");
      assert.strictEqual(player.getState().choices.length, 2);
      assert.strictEqual(jumpTo("2win").text, "Win");
    });
    it(`loc0text_1empty_jump0text_param=0`, () => {
      assert.strictEqual(jumpTo("loc0text_1empty_jump0text_param=0").text, "");
      assert.strictEqual(player.getState().choices.length, 1, "One choise");
      assert.strictEqual(
        player.getState().choices.filter((x) => x.active).length,
        0,
        "But inactive",
      );
      assert.strictEqual(player.getState().choices[0].text, "neverActive");
    });
    it(`loc0text_1empty_jump0text_param=1`, () => {
      jumpTo(`loc0text_1empty_jump0text_param=1`);
      assert.strictEqual(player.getState().choices.length, 2);
      assert.strictEqual(jumpTo("2win").text, "Win");
    });
    it(`loc0text_1empty_jump1text_locparam=0`, () => {
      assert.strictEqual(jumpTo("loc0text_1empty_jump1text_locparam=0").text, "jumpTextX");
      assert.strictEqual(player.getState().choices.length, 1, "One choise");
      assert.strictEqual(
        player.getState().choices.filter((x) => x.active).length,
        0,
        "But inactive",
      );
      assert.strictEqual(player.getState().choices[0].text, "neverActive");
    });
    it(`loc0text_1empty_jump1text_locparam=1`, () => {
      assert.strictEqual(jumpTo("loc0text_1empty_jump1text_locparam=1").text, "jumpText");
      assert.strictEqual(player.getState().choices.length, 2);
      assert.strictEqual(jumpTo("2win").text, "Win");
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

  describe(`Last test`, () => {
    it(`Set flag`, () => {
      lastTestOk = true;
    });
  });

  after(function () {
    if (!lastTestOk) {
      console.info(player.getState());
    }
  });
});

describe("Player on test.qm", function () {
  this.timeout(20 * 1000);

  let save1: GameState;

  it(`Reads and parses quest`, () => {
    const data = fs.readFileSync(__dirname + "/../../src/test/test.qm");
    const qm = parse(data);
    player = new QMPlayer(qm, "rus"); // true
    player.start();
  });

  it(`Have first state`, () => {
    const state1 = player.getState();
    assert.ok(state1.text);
    assert.ok(state1.gameState === "running");
  });
  it(`Jumps to accept`, () => {
    player.performJump(JUMP_I_AGREE);
  });

  it(`Starting location jumps count`, () => {
    const state2 = player.getState();
    // console.info(JSON.stringify(state2, null, 4));
    assert.strictEqual(state2.choices.filter((x) => x.active).length, 2);
    assert.strictEqual(state2.choices.filter((x) => !x.active).length, 5);

    assert.ok(state2.choices[0].text.indexOf("p2 / 5") > -1, `Choices have p2/5`);
    assert.ok(state2.choices[6].text.indexOf("Видно активен по формуле") > -1, "Have formula seen");
  });
  it(`Jumps on jumpid > 2`, () => {
    const state2 = player.getState();

    player.performJump(state2.choices.filter((x) => x.jumpId > 2)[0].jumpId);
    const state3 = player.getState();
    //console.info(JSON.stringify(state3, null, 4));

    // На описании P10
    player.performJump(state3.choices.shift()!.jumpId);
  });
  it(`Next jumps, hideme param show/hide`, () => {
    const state4 = player.getState();
    assert.ok(state4.paramsState[5].indexOf("hideme") < 0);
    //console.info(JSON.stringify(state4, null, 4));
    assert.strictEqual(state4.text, "Текст на переходе");

    player.performJump(state4.choices.shift()!.jumpId);
    const state5 = player.getState();
    //console.info(JSON.stringify(state5, null, 4));
    assert.ok(state5.paramsState[5].indexOf("hideme") > -1);
  });
  it(`Пустая1`, () => assert.strictEqual(jumpTo("Пустая1").text, "Пустая1"));

  it(`Пустая 2`, () => {
    const st7 = jumpTo("Пустая 2");
    assert.strictEqual(st7.text, "Пустая 2 замещенный");
    assert.strictEqual(st7.choices.length, 4);
  });

  it(`Пустой проверка`, () => {
    const save = player.getSaving();
    const st8 = jumpTo("пустой проверка");
    assert.strictEqual(st8.text, "HangsHere");
    assert.strictEqual(st8.choices.length, 1, "One choice");
    assert.strictEqual(st8.choices.filter((x) => x.active).length, 0, "Inactive");
    player.loadSaving(save);
  });
  it(`EmptyJumps`, () => {
    jumpTo("EmptyJumps");
    jumpTo("");
    jumpTo("");
    assert.strictEqual(player.getState().text, "Пустая 2");
  });
  it(`На тест критичных`, () => {
    jumpTo("тест");
    assert.strictEqual(player.getState().text, "Тест критичных параметров");
  });
  it(`Делаем сохранение`, () => {
    save1 = player.getSaving();
  });

  it(`OnJumpWithoutDescription`, () => {
    jumpTo("OnJumpWithoutDescription");
    assert.strictEqual(player.getState().text, "CritInJump");
    jumpTo("");
    //console.info(player.getState());
    assert.strictEqual(player.getState().gameState, "win");
    player.loadSaving(save1);
  });
  // console.info('After load\n\n', player.getState(), 'saved state itself\n\n', save1);

  it(`win`, () => {
    jumpTo("win");
    assert.strictEqual(player.getState().text, "YouAreWinner");
    jumpTo("");
    assert.strictEqual(player.getState().gameState, "win");
    player.loadSaving(save1);
  });
  it(`fail`, () => {
    jumpTo("fail");
    assert.strictEqual(player.getState().text, "You failed");
    assert.strictEqual(player.getState().gameState, "fail");
    player.loadSaving(save1);
  });
  it(`dead`, () => {
    jumpTo("dead");
    assert.strictEqual(player.getState().text, "You are dead");
    assert.strictEqual(player.getState().gameState, "dead");
    player.loadSaving(save1);
  });
  it(`OnJumpWithDescription`, () => {
    jumpTo("OnJumpWithDescription");
    assert.strictEqual(player.getState().text, "Blablabla");
    //console.info(`State = ${player.getSaving().state}`)
    jumpTo("");
    //console.info(`State = ${player.getSaving().state}`)
    jumpTo("");
    assert.strictEqual(player.getState().gameState, "win");
    player.loadSaving(save1);
  });
  it(`Спорные и лимит переходов`, () => {
    jumpTo("Спорные");
    jumpTo("2times");
    jumpTo("2times");
    jumpTo("2times");
    jumpTo("2times");
    assert.ok(player.getState().choices.length <= 2);
  });
  it(`Спорные, проверка вероятнотей`, () => {
    let randomJumpCount = 0;
    for (let i = 0; i < 700; i++) {
      // console.info(`i=${i}, f=${((i+2) % 3) + 1} val=${parseInt(player.getState().text)}`);
      assert.strictEqual(((i + 2) % 3) + 1, parseInt(player.getState().text), "X1"); // + JSON.stringify(player.getSaving(), null, 4));
      randomJumpCount += player
        .getState()
        .choices.filter((x) => x.text.indexOf("random") > -1).length;
      jumpTo("oooo");
      // console.info(`~~~~~~~~~~~~~~~~~~~~~~~~~~ i=${i} f=${((i) % 6) + 3} state=${parseInt(player.getState().text)}`)
      assert.strictEqual((i % 6) + 3, parseInt(player.getState().text), "X2");
      jumpTo("back");
    }
    const st10 = player.getState();
    const n4 = parseInt(st10.paramsState[3].replace("<clr>", "").replace("<clrEnd>", ""));
    const n5 = parseInt(st10.paramsState[4].replace("<clr>", "").replace("<clrEnd>", ""));
    const n6 = parseInt(st10.paramsState[5].replace("<clr>", "").replace("<clrEnd>", ""));
    assert.ok(n4 > 50 && n4 < 150);
    assert.ok(n5 > 350 && n5 < 450);
    assert.ok(n6 > 150 && n6 < 250);
    assert.ok(randomJumpCount > 100 && randomJumpCount < 200);
    player.loadSaving(save1);
  });

  it(`LocationCritOnEmpty -> ToLocationWhichSetsCritParam-WithoutDesc`, () => {
    jumpTo("LocationCritOnEmpty");
    jumpTo("ToLocationWhichSetsCritParam-WithoutDesc");
    assert.strictEqual(player.getState().text, "That location have crit param");
    assert.strictEqual(player.getState().choices.length, 1);
    jumpTo("");
    assert.strictEqual(player.getState().text, "CritLocationMessage");
    jumpTo("");
    assert.strictEqual(player.getState().gameState, "win");
    player.loadSaving(save1);
  });

  it(`LocationCritOnEmpty -> ToLocationWhichSetsCritParam-WithDesc`, () => {
    jumpTo("LocationCritOnEmpty");
    jumpTo("ToLocationWhichSetsCritParam-WithDesc");
    assert.strictEqual(player.getState().text, "Description");
    assert.strictEqual(player.getState().choices.length, 1);
    jumpTo("");
    assert.strictEqual(player.getState().text, "That location have crit param");
    assert.strictEqual(player.getState().choices.length, 1);
    jumpTo("");
    assert.strictEqual(player.getState().text, "CritLocationMessage");
    jumpTo("");
    assert.strictEqual(player.getState().gameState, "win");
    player.loadSaving(save1);
  });

  it(`LocationCritOnEmpty -> ToEmptyLocationWhichSetsCritParam-WithoutDesc`, () => {
    jumpTo("LocationCritOnEmpty");
    // console.info(`State === ` + player.getSaving().state);
    jumpTo("ToEmptyLocationWhichSetsCritParam-WithoutDesc");
    // console.info(`State === ` + player.getSaving().state);;
    assert.strictEqual(player.getState().text, "CritEmptyLocationMessage");
    jumpTo("");
    assert.strictEqual(player.getState().gameState, "win");
    player.loadSaving(save1);
  });

  it(`LocationCritOnEmpty -> ToEmptyLocationWhichSetsCritParam-WithDesc`, () => {
    jumpTo("LocationCritOnEmpty");
    jumpTo("ToEmptyLocationWhichSetsCritParam-WithDesc");
    assert.strictEqual(player.getState().text, "Description");
    assert.strictEqual(player.getState().choices.length, 1);
    jumpTo("");
    jumpTo("");
    assert.strictEqual(player.getState().gameState, "win");
    player.loadSaving(save1);
  });
});
