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
    assert.strictEqual(player.getState().trackName, null);
    assert.strictEqual(player.getState().soundName, null);
  });
  it("Media on location", () => {
    const st = jumpTo("locMedia");
    assert.strictEqual(st.imageName, "Boat_01");
    assert.strictEqual(st.trackName, "track1");
    assert.strictEqual(st.soundName, "sound1");
  });
  it("Media on location and go back", () => {
    jumpTo("locMedia");
    const st = jumpTo("Back");
    assert.strictEqual(st.imageName, "Boat_01");
    assert.strictEqual(st.trackName, "track1");
    assert.strictEqual(st.soundName, null);
  });

  it("Media on jump with no description", () => {
    const st = jumpTo("jumpMediaNoDesc");
    assert.strictEqual(st.imageName, "Boat_02");
    assert.strictEqual(st.trackName, "track02");
    assert.strictEqual(st.soundName, "sound02");
  });
  it("Media on jump with no description and go back", () => {
    jumpTo("jumpMediaNoDesc");
    const st = jumpTo("Back");
    assert.strictEqual(st.imageName, "Boat_02");
    assert.strictEqual(st.trackName, "track02");
    assert.strictEqual(st.soundName, null);
  });

  it("Media on jump with description", () => {
    const st = jumpTo("jumpMediaDesc");
    assert.strictEqual(st.imageName, "Ministry_02");
    assert.strictEqual(st.trackName, "track002");
    assert.strictEqual(st.soundName, "sound002");
  });
  it("Media on jump with description and go back", () => {
    jumpTo("jumpMediaDesc");
    const st0 = jumpTo();
    assert.strictEqual(st0.soundName, null);
    const st = jumpTo("Back");
    assert.strictEqual(st.imageName, "Ministry_02");
    assert.strictEqual(st.trackName, "track002");
    assert.strictEqual(st0.soundName, null);
  });

  it("Media on critparam own media on jump", () => {
    const st = jumpTo("SuccessParamOnJumpMediaOwn");
    assert.strictEqual(st.imageName, "boat_03");
    assert.strictEqual(st.trackName, "track3");
    assert.strictEqual(st.soundName, "sound3");
  });

  it("Media on critparam jump override", () => {
    const st = jumpTo("SuccessParamMediaJumpOverride");
    assert.strictEqual(st.imageName, "drugs_00");
    assert.strictEqual(st.trackName, "track05");
    assert.strictEqual(st.soundName, "sound05");
  });

  it("Media on critparam location own", () => {
    const st = jumpTo("SuccessParamLocationOwn");
    assert.strictEqual(st.imageName, "boat_03");
    assert.strictEqual(st.trackName, "track3");
    assert.strictEqual(st.soundName, "sound3");
  });

  it("Media on critparam location override", () => {
    const st = jumpTo("SuccessParamLocationOverride");
    assert.strictEqual(st.imageName, "drugs_02");
    assert.strictEqual(st.trackName, "track06");
    assert.strictEqual(st.soundName, "sound06");
  });

  it("Media track is cleaned", () => {
    {
      const st1 = jumpTo("locMedia");
      assert.strictEqual(st1.trackName, "track1");
    }
    {
      const st2 = jumpTo("Back");
      assert.strictEqual(st2.trackName, "track1");
    }
    {
      const st3 = jumpTo("cleanTrack");
      assert.strictEqual(st3.trackName, null);
    }
    {
      const st4 = jumpTo("back");
      assert.strictEqual(st4.trackName, null);
    }
  });
});
