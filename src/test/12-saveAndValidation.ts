import { parse } from "../lib/qmreader";

import * as fs from "fs";
import * as assert from "assert";
import "mocha";

import {
  GameState,
  initGame,
  performJump,
  validateWinningLog,
  getGameLog,
  JUMP_I_AGREE,
  JUMP_GO_BACK_TO_SHIP,
} from "../lib/qmplayer";
import { getUIState } from "../lib/qmplayer/funcs";
import { DEFAULT_RUS_PLAYER } from "../lib/qmplayer/player";

let state: GameState;

const MY_SEED1 = "someseed";
const MY_SEED2 = "someseed3";

const date1 = new Date("2018-07-22T22:20:36.761Z").getTime();
const date2 = new Date("2018-07-22T22:21:36.761Z").getTime();
const date3 = new Date("2018-07-22T22:22:36.761Z").getTime();
const date4 = new Date("2018-07-22T22:30:36.761Z").getTime();

describe(`Using saveAndValidaton.qm, seed 1`, function () {
  const data = fs.readFileSync(__dirname + `/../../src/test/saveAndValidation.qm`);
  const quest = parse(data);

  before(`Reads and parses quest`, () => {
    state = initGame(quest, MY_SEED1);
  });
  it(`That seed have 2 jumps`, () => {
    state = performJump(JUMP_I_AGREE, quest, state, date1);
    assert.strictEqual(state.possibleJumps.length, 2);
  });
  it(`Jumping`, () => {
    state = performJump(2, quest, state, date1);
    state = performJump(3, quest, state, date1);
    state = performJump(6, quest, state, date1);
    assert.deepStrictEqual(state.paramValues.slice(0, 3), [8, 5, 1]);
    state = performJump(JUMP_GO_BACK_TO_SHIP, quest, state, date1);
    assert.strictEqual(state.state, "returnedending");
    const uistate = getUIState(quest, state, DEFAULT_RUS_PLAYER);
    assert.strictEqual(uistate.gameState, "win");
  });
  /*
    it(`Validating state`, () => {        
        assert.ok(validateState(quest, state));
    })
    */
  it(`Validating game log`, () => {
    const gameLog = getGameLog(state);
    assert.ok(validateWinningLog(quest, gameLog));
  });
  it(`Partial game log is not validated`, () => {
    const gameLog = getGameLog(state);
    const partialGameLog: typeof gameLog = {
      ...gameLog,
      performedJumps: gameLog.performedJumps.slice(0, 3),
    };
    assert.ok(!validateWinningLog(quest, partialGameLog));
  });
});

describe(`Using saveAndValidaton.qm, seed 2`, function () {
  const data = fs.readFileSync(__dirname + `/../../src/test/saveAndValidation.qm`);
  const quest = parse(data);

  before(`Reads and parses quest`, () => {
    state = initGame(quest, MY_SEED2);
  });
  it(`That seed have 1 jump`, () => {
    state = performJump(JUMP_I_AGREE, quest, state, date1);
    assert.strictEqual(state.possibleJumps.length, 1);
  });
});
