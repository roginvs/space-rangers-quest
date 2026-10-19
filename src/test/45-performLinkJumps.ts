import * as assert from "assert";
import * as fs from "fs";
import "mocha";

import { JumpId, parse } from "../lib/qmreader";
import { initGame, performJump, getUIState, Quest, GameState } from "../lib/qmplayer/funcs";
import { JUMP_I_AGREE } from "../lib/qmplayer";
import { DEFAULT_RUS_PLAYER } from "../lib/qmplayer/player";
import { performLinkJumps, normalizeForLinkMatch } from "../ui/questLinkPerform";
import { makeTestQuest } from "./questLinkTestHelpers";
import { formatTokens } from "../ui/questReplaceTags.format";
import { splitStringToTokens } from "../ui/questReplaceTags.split";
import { greetingsQmm } from "../ui/editor/core/greetingsQmm";

const player = DEFAULT_RUS_PLAYER;

// tslint:disable:no-invalid-this

describe("performLinkJumps", function () {
  let warnings: string[];
  const originalWarn = console.warn;
  beforeEach(() => {
    warnings = [];
    console.warn = (message: string) => warnings.push(message);
  });
  afterEach(() => {
    console.warn = originalWarn;
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
    assert.strictEqual(warnings.length, 1);
    assert.ok(warnings[0].includes('Transition not found or inactive: "Открыть окно"'));
    assert.ok(warnings[0].includes("step 2/2, location 2"));
  });

  it(`Third jump is not performed after the missing second one`, () => {
    const { quest, state } = startGame();
    const newState = performLinkJumps(
      ["Открыть дверь", "Открыть окно", "Войти в комнату"],
      quest,
      state,
      player,
    );
    // Stopped right at "Открыть окно" being unavailable from loc 2
    assert.strictEqual(newState.locationId, 2);
    assert.deepStrictEqual(
      newState.performedJumps.map((j) => j.jumpId),
      [JUMP_I_AGREE, 1],
    );
  });

  it(`Ambiguous names stop the chain and perform nothing`, () => {
    const base = makeTestQuest();
    const quest: Quest = {
      ...base,
      jumps: [...base.jumps, { ...base.jumps[0], id: 8 as JumpId, text: "Открыть дверь" }],
      jumpsCount: base.jumpsCount + 1,
    };
    const state = performJump(JUMP_I_AGREE, quest, initGame(quest, "test-seed"), 0);
    assert.strictEqual(
      getUIState(quest, state, player).choices.filter(
        (c) => c.active && normalizeForLinkMatch(c.text) === "Открыть дверь",
      ).length,
      2,
    );
    const newState = performLinkJumps(["Открыть дверь"], quest, state, player);
    assert.strictEqual(newState, state);
    assert.strictEqual(warnings.length, 1);
    assert.ok(warnings[0].includes("Ambiguous transition"));
  });

  it(`Inactive choices are not used`, () => {
    const { quest, state } = startGame();
    assert.ok(getUIState(quest, state, player).choices.some((c) => !c.active));
    const newState = performLinkJumps(["Скрытый переход"], quest, state, player);
    assert.strictEqual(newState, state);
    assert.strictEqual(warnings.length, 1);
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
    assert.deepStrictEqual(warnings, []);
    assert.strictEqual(
      newState.performedJumps.length,
      5, // I agree + 3 link jumps + go back to ship
    );
  });

  it(`Chain runs again from the same old state gives the same result (no state storing)`, () => {
    const { quest, state } = startGame();
    const afterChain = performLinkJumps(["Открыть дверь"], quest, state, player, 123);
    const afterChainAgain = performLinkJumps(["Открыть дверь"], quest, state, player, 123);
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

  it("Preserves parameter changes, random state and history exactly as manual jumps", () => {
    const base = makeTestQuest();
    const quest: Quest = {
      ...base,
      jumps: base.jumps.map((jump) => ({
        ...jump,
        paramsChanges: [
          { ...jump.paramsChanges[0], isChangeFormula: true, changingFormula: "[p1]+[1..4]" },
        ],
      })),
    };
    const state = performJump(JUMP_I_AGREE, quest, initGame(quest, "test-seed"), 10);
    const snapshot = JSON.stringify(state);
    const timestamp = Date.now();
    let manual = state;
    for (const id of [1, 2, 3]) {
      manual = performJump(id, quest, manual, timestamp);
    }
    const linked = performLinkJumps(
      ["Открыть дверь", "Войти в комнату", "Взять ключ"],
      quest,
      state,
      player,
      timestamp,
    );
    assert.deepStrictEqual(linked, manual);
    assert.notDeepStrictEqual(linked.aleaState, state.aleaState);
    assert.notDeepStrictEqual(linked.paramValues, state.paramValues);
    assert.strictEqual(JSON.stringify(state), snapshot);
    assert.ok(linked.performedJumps.slice(1).every((j) => j.dateUnix === timestamp));
  });

  it("Recomputes conditions and substituted names after a parameter change", () => {
    const base = makeTestQuest();
    const quest: Quest = {
      ...base,
      jumps: base.jumps.map((jump) =>
        jump.id === 1
          ? {
              ...jump,
              paramsChanges: [{ ...jump.paramsChanges[0], change: 1 }],
            }
          : jump.id === 2
          ? {
              ...jump,
              text: "Войти [p1]",
              formulaToPass: "[p1]=8",
            }
          : jump,
      ),
    };
    const state = performJump(JUMP_I_AGREE, quest, initGame(quest, "test-seed"), 0);
    const linked = performLinkJumps(["Открыть дверь", "Войти 8"], quest, state, player);
    assert.strictEqual(linked.locationId, 3);
    assert.strictEqual(linked.paramValues[0], 8);
  });

  it("Matches exact displayed text, including internal format padding", () => {
    const base = makeTestQuest();
    const quest: Quest = {
      ...base,
      jumps: base.jumps.map((j) =>
        j.id === 1 ? { ...j, text: "A<format=left,3>B</format>C" } : j,
      ),
    };
    const state = performJump(JUMP_I_AGREE, quest, initGame(quest, "test-seed"), 0);
    assert.strictEqual(performLinkJumps(["A  BC"], quest, state, player).locationId, 2);
    assert.strictEqual(performLinkJumps(["ABC"], quest, state, player), state);
    assert.strictEqual(performLinkJumps(["Открыть"], quest, state, player), state);
  });

  it("Parses target names after numeric and formula substitutions inserted formatting", () => {
    const base = makeTestQuest();
    const quest: Quest = {
      ...base,
      locations: base.locations.map((loc) =>
        loc.id === 1
          ? {
              ...loc,
              texts: ["<link=[p1] правок>параметр</link> <link={3+4} правок>формула</link>"],
            }
          : loc,
      ),
    };
    const state = performJump(JUMP_I_AGREE, quest, initGame(quest, "test-seed"), 0);
    const tokens = formatTokens(splitStringToTokens(getUIState(quest, state, player).text));
    const links = tokens.filter((t) => t.type === "text" && t.links);
    assert.strictEqual(links.length, 2);
    for (const link of links) {
      assert.ok(link.type === "text" && link.links);
      if (link.type === "text" && link.links) {
        assert.strictEqual(performLinkJumps(link.links, quest, state, player).locationId, 5);
      }
    }
  });

  it("Runs every link from the actual editor demo", () => {
    const quest = parse(greetingsQmm);
    const state = performJump(JUMP_I_AGREE, quest, initGame(quest, "demo-seed"), 0);
    const links = formatTokens(splitStringToTokens(getUIState(quest, state, player).text)).filter(
      (t) => t.type === "text" && t.links,
    );
    assert.strictEqual(links.length, 6);
    const expectedLocations = [4, 5, 6, 7, 4, 1];
    links.forEach((link, index) => {
      if (link.type === "text" && link.links) {
        assert.strictEqual(
          performLinkJumps(link.links, quest, state, player).locationId,
          expectedLocations[index],
        );
      }
    });
    assert.strictEqual(warnings.length, 2);
  });
});
