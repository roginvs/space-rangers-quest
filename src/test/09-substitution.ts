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
    //    ["Один [d2]", "Один <clr>Фиал<clrEnd>"],
    //    ["Один [d2:25]", "Один <clr>Bottle<clrEnd>"],
    //    ["Один [d2:10+15]", "Один <clr>Bottle<clrEnd>"],
    //    ["Один [d2:{10+15}]", "Один <clr>Bottle<clrEnd>"],
    //    ["Один [d2:[p1] + 15]", "Один <clr>Bottle<clrEnd>"],
    //    ["Один [d2:{[p1] + 15}]", "Один <clr>Bottle<clrEnd>"],
    //    ["Deep [d3]", "Deep <clr>Lol <clr>Param1valueString<clrEnd><clrEnd>"],
    //    ["Random [d1:[10..20]]", "Random <clr>Param1valueString<clrEnd>"],
    //    ["Random [d1:{[10..20]}]", "Random <clr>Param1valueString<clrEnd>"],
  ]) {
    const random = createDetermenisticRandom([5, 6, 7]);
    it(`Substitute '${str}'`, () =>
      assert.equal(
        substitute(
          str,
          player,
          [10, 20, 30],
          [
            {
              showingInfo: [
                {
                  from: 0,
                  to: 20,
                  str: "Param1valueString",
                },
              ],
            },
            {
              showingInfo: [
                {
                  from: 0,
                  to: 5,
                  str: "Fial",
                },
                {
                  from: 5,
                  to: 21,
                  str: "Фиал",
                },
                {
                  from: 21,
                  to: 26,
                  str: "Bottle",
                },
              ],
            },
            {
              showingInfo: [
                {
                  from: 30,
                  to: 30,
                  str: "Lol [d1]",
                },
              ],
            },
          ],
          random,
          1,
        ),
        expected,
      ));
  }
});
