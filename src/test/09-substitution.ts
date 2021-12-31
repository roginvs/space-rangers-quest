import * as assert from "assert";
import "mocha";
import { PlayerSubstitute } from "../lib/qmplayer/playerSubstitute";
import { createDetermenisticRandom } from "../lib/randomFunc";
import { substitute } from "../lib/substitution";

const player: PlayerSubstitute = {
  Ranger: "MyName",
  Player: "Player",
  FromPlanet: "FromPlanet",
  FromStar: "FromStar",
  ToPlanet: "ToPlanet",
  ToStar: "<ToStar>",
  Date: "Date",
  Day: "Day",
  Money: "Money",
  CurDate: "CurDate",
  lang: "rus",
};

describe("Checking substitute", function() {
  for (const [str, expected] of [
    ["", ""],
    ["lol kek", "lol kek"],
    ["У вас [p3] кредитов", "У вас <clr>30<clrEnd> кредитов"],
    ["Boo {2+3}", "Boo <clr>5<clrEnd>"],
    ["Boo {2+[10..20]}", "Boo <clr>17<clrEnd>"],
    ["Lol <Ranger><Ranger>", "Lol <clr>MyName<clrEnd><clr>MyName<clrEnd>"],
    // This is commented because current implementation causes infinite loop
    // ["Special char <ToStar>", "Special char <clr><ToStar><clrEnd>"],
    ["Diamond <>", "Diamond <clr>20<clrEnd>"],
  ]) {
    const random = createDetermenisticRandom([5, 6, 7]);
    it(`Substitute '${str}'`, () =>
      assert.equal(substitute(str, player, [10, 20, 30], random, 1), expected));
  }
});
