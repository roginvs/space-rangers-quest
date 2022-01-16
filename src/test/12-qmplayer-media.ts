import { parse } from "../lib/qmreader";

import * as fs from "fs";
import * as assert from "assert";
import "mocha";

// tslint:disable:no-invalid-this

import {
  QMPlayer,
  GameState,
  JUMP_I_AGREE,
  JUMP_GO_BACK_TO_SHIP,
  JUMP_NEXT,
} from "../lib/qmplayer";

let player: QMPlayer;

function jumpTo(text: string = "") {
  const state = player.getState();
  const jump = state.choices.filter((x) => x.text.indexOf(text) > -1 && x.active).shift();
  if (!jump) {
    throw new Error(`OLOLO: No jump '${text}' in ` + JSON.stringify(state, null, 4));
  }
  player.performJump(jump.jumpId);
  return player.getState();
}

describe("Media", function () {
  beforeEach(`Reads and parses quest`, () => {
    const data = fs.readFileSync(__dirname + "/../../src/test/mediatest.qmm");
    const qm = parse(data);
    player = new QMPlayer(qm, "rus");
    player.start();
    player.performJump(JUMP_I_AGREE);
  });
  it("No media in the beginning", () => {
    assert.strictEqual(player.getState().imageName, null);
  });
  it("Media on location", () => {
    const st = jumpTo("locMedia");
    assert.strictEqual(st.imageName, "Boat_01");
  });
  it("Media on location and go back", () => {
    jumpTo("locMedia");
    const st = jumpTo("Back");
    assert.strictEqual(st.imageName, "Boat_01");
  });
});
