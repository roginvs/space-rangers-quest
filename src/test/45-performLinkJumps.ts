import * as assert from "assert";
import * as fs from "fs";
import "mocha";

import { parse } from "../lib/qmreader";
import { initGame, performJump, getUIState, Quest, GameState } from "../lib/qmplayer/funcs";
import { JUMP_I_AGREE } from "../lib/qmplayer";
import { DEFAULT_RUS_PLAYER } from "../lib/qmplayer/player";
import { performLinkJumps, normalizeForLinkMatch } from "../ui/questLinkPerform";
import { makeTestQuest, makeJump } from "./questLinkTestHelpers";

const player = DEFAULT_RUS_PLAYER;

// tslint:disable:no-invalid-this

describe("performLinkJumps", function () {
  beforeEach(() => {
    // Each test gets its own fresh quest copy
  });

  function startGame(doFirstStep = true) {
    const quest = makeTestQuest();
    let state = initGame(quest, "test-seed");
    if (doFirstStep) {
      state = performJump(JUMP_I_AGREE, quest, state, 0);
    }
    return { quest, state };
  }

  it(`Single jump by its name (jump text contains formatting tags, name does not)`, () => {
    const { quest, state } = startGame();
    const newState = performLinkJumps(["Открыть дверь"], quest, state, player);
    assert.strictEqual(newState.locationId, 2);
    assert.strictEqual(newState.state, "location");
  });

  it(`Three sequential jumps are performed by one call`, () => {
    const { quest, state } = startGame();
    const newState = performLinkJumps(
      ["Открыть дверь", "Войти в комнату", "Взять ключ"],
      quest,
      state,
      player,
    );
    assert.strictEqual(newState.locationId, 4);
    assert.deepStrictEqual(
      newState.performedJumps.map((j) => j.jumpId),
      [JUMP_I_AGREE, 1, 2, 3],
    );
  });

  it(`Two sequential jumps`, () => {
    const { quest, state } = startGame();
    const newState = performLinkJumps(["Открыть дверь", "Войти в комнату"], quest, state, player);
    assert.strictEqual(newState.locationId, 3);
    assert.strictEqual(newState.performedJumps.length, 3);
  });

  it(`Missing second jump stops the chain, first jump is kept`, () => {
    const { quest, state } = startGame();
    const newState = performLinkJumps(["Открыть дверь", "Открыть окно"], quest, state, player);
    // The first jump happened (loc 2), the second was not found there
    assert.strictEqual(newState.locationId, 2);
    assert.deepStrictEqual(
      newState.performedJumps.map((j) => j.jumpId),
      [JUMP_I_AGREE, 1],
    );
  });

  it(`Third jump is not performed after the missing second one`, () => {
    const { quest, state } = startGame();
    const newState = performLinkJumps(
      ["Открыть дверь", "Войти в комнату", "Открыть окно", "Взять ключ"],
      quest,
      state,
      player,
    );
    // Stopped right at "Открыть окно" being unavailable from loc 2
    assert.strictEqual(newState.locationId, 3);
    assert.deepStrictEqual(
      newState.performedJumps.map((j) => j.jumpId),
      [JUMP_I_AGREE, 1, 2],
    );
  });

  it(`Ambiguous names stop the chain and perform nothing`, () => {
    const quest = makeTestQuest() as any;
    quest.jumps.push(makeJump(8, 1, 6, "Открыть дверь"));
    quest.jumpsCount = 8;
    const state = initGame(quest as Quest, "test-seed");
    const newState = performLinkJumps(["Открыть дверь"], quest as Quest, state, player);
    assert.strictEqual(newState, state);
  });

  it(`Inactive choices are not used`, () => {
    const { quest, state } = startGame();
    const newState = performLinkJumps(["Скрытый переход"], quest, state, player);
    assert.strictEqual(newState, state);
  });

  it(`Name is matched by the display text after parameter substitution`, () => {
    const { quest, state } = startGame();
    const uiState = getUIState(quest, state, player);
    assert.ok(
      uiState.choices.some((c) => c.active && normalizeForLinkMatch(c.text) === "7 правок"),
      "The substitution must be matched after the formatting tags removal",
    );
    const newState = performLinkJumps(["7 правок"], quest, state, player);
    assert.strictEqual(newState.locationId, 5);
  });

  it(`No additional "Next" jumps are performed automatically`, () => {
    const quest = makeTestQuest() as any;
    quest.jumps[3].description = "Going to the window";
    let state = initGame(quest as Quest, "test-seed");
    state = performJump(JUMP_I_AGREE, quest as Quest, state, 0);
    const newState = performLinkJumps(["Открыть окно"], quest as Quest, state, player);
    assert.strictEqual(newState.state, "jump");
    // Stopped after the jump: no "Next" performed, the description must be shown
    assert.strictEqual(newState.lastJumpId, 4);
    assert.strictEqual(newState.performedJumps.length, 2);
  });

  it(`Quest end stops the chain`, () => {
    const { quest, state } = startGame();
    const newState = performLinkJumps(
      ["Открыть дверь", "Войти в комнату", "Взять ключ", "Вернуться на корабль", "Взять ключ"],
      quest,
      state,
      player,
    );
    // The chain stopped after the win ending, no jumps after that
    assert.strictEqual(newState.state, "returnedending");
    assert.strictEqual(
      newState.performedJumps.length,
      5, // I agree + 3 link jumps + go back to ship
    );
  });

  it(`Chain runs again from the same old state gives the same result (no state storing)`, () => {
    const { quest, state } = startGame();
    const afterChain = performLinkJumps(["Открыть дверь"], quest, state, player);
    const afterChainAgain = performLinkJumps(["Открыть дверь"], quest, state, player);
    assert.deepStrictEqual(afterChain, afterChainAgain);
  });

  it(`Empty name matches nothing`, () => {
    const { quest, state } = startGame();
    const uiBefore = getUIState(quest, state, player);
    assert.ok(
      uiBefore.choices.every((c) => !!c.text.trim()),
      "The test quest must not have empty jump texts at the start",
    );
    const newState = performLinkJumps([""], quest, state, player);
    assert.strictEqual(newState, state);
  });

  it(`Existing quests without the tag keep working`, () => {
    const data = fs.readFileSync(__dirname + "/test6-empty.qm");
    const qm = parse(data);
    let state: GameState = initGame(qm, "seed");
    state = performJump(JUMP_I_AGREE, qm, state, 0);
    const uiState = getUIState(qm, state, player);
    assert.ok(uiState.text);
    assert.ok(uiState.choices.length > 0);
  });
});
