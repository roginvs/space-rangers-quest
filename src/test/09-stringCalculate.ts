import * as assert from "assert";
import "mocha";
import { PlayerSubstitute } from "../lib/qmplayer/playerSubstitute";
import { createDetermenisticRandom } from "../lib/randomFunc";
import { stringCalculate } from "../lib/stringCalculate";

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

let debugTextOut = "";
describe("Checking substitute", function () {
  for (const [str, expected] of [
    ["", []],
    ["lol kek", [{ type: "text", text: "lol kek" }]],
    [
      "У вас [p3] кредитов",
      [
        { type: "text", text: "У вас " },
        { type: "text", text: "30", isClr: true },
        { type: "text", text: " кредитов" },
      ],
    ],
    [
      "Boo {2+3}",
      [
        { type: "text", text: "Boo " },
        { type: "text", text: "5", isClr: true },
      ],
    ],
    [
      "Boo {2+[10..20]}",
      [
        { type: "text", text: "Boo " },
        { type: "text", text: "17", isClr: true },
      ],
    ],
    [
      "Lol <Ranger><Ranger>",
      [
        { type: "text", text: "Lol " },
        { type: "text", text: "MyName", isClr: true },
        { type: "text", text: "MyName", isClr: true },
      ],
    ],
    [
      "Special char <ToStar>",
      [
        { type: "text", text: "Special char " },
        { type: "text", text: "<ToStar>", isClr: true },
      ],
    ],
    [
      "Diamond <>",
      [
        { type: "text", text: "Diamond " },
        { type: "text", isClr: true, text: "20" },
      ],
    ],
    [
      "Один [d2]",
      [
        { type: "text", text: "Один " },
        { type: "text", text: "Фиал", isCrl: true },
      ],
    ],
    [
      "Один [d2:25]",
      [
        { type: "text", text: "Один " },
        { type: "text", text: "Bottle", isCrl: true },
      ],
    ],
    [
      "Один [d2:10+15]",
      [
        { type: "text", text: "Один " },
        { type: "text", text: "Bottle", isCrl: true },
      ],
    ],
    [
      "Один [d2:{25}]",
      [
        { type: "text", text: "Один " },
        { type: "text", text: "Bottle", isCrl: true },
      ],
    ],
    [
      "Один [d2:{10+15}]",
      [
        { type: "text", text: "Один " },
        { type: "text", text: "Bottle", isCrl: true },
      ],
    ],
    [
      "Один [d2:[p1] + 15]",
      [
        { type: "text", text: "Один " },
        { type: "text", text: "Bottle", isCrl: true },
      ],
    ],
    [
      "Один [d2:{[p1] + 15}]",
      [
        { type: "text", text: "Один " },
        { type: "text", text: "Bottle", isCrl: true },
      ],
    ],
    [
      "Deep [d3]",
      [
        { type: "text", text: "Deep " },
        { type: "text", text: "Lol ", isCrl: true },
        { type: "text", text: "Param1valueString", isCrl: true },
      ],
    ],
    [
      "Random [d1:[10..20]]",
      [
        { type: "text", text: "Random " },
        { type: "text", text: "Param1valueString", isCrl: true },
      ],
    ],
    [
      "Random [d1:{[10..20]}]",
      [
        { type: "text", text: "Random " },
        { type: "text", text: "Param1valueString", isCrl: true },
      ],
    ],
    [
      "Spaces [d2: { 6  -    3    }    ] ",
      [
        { type: "text", text: "Spaces " },
        { type: "text", text: "Fial", isCrl: true },
        { type: "text", text: " " },
      ],
    ],
    [
      "Multiple [d1] [d1]",
      [
        { type: "text", text: "Multiple " },
        { type: "text", text: "Param1valueString", isCrl: true },
        { type: "text", text: " " },
        { type: "text", text: "Param1valueString", isCrl: true },
      ],
    ],
    [
      "Incorrect [d] [d1]",
      [
        { type: "text", text: "Incorrect " },
        { type: "text", text: "UNKNOWN_PARAM" },
        { type: "text", text: " " },
        { type: "text", text: "Param1valueString", isCrl: true },
      ],
    ],
    [
      "Incorrect [d:] [d1]",
      [
        { type: "text", text: "Incorrect [d:] " },
        { type: "text", text: "Param1valueString", isCrl: true },
      ],
    ],
    [
      "Incorrect [d[d1]",
      [
        { type: "text", text: "Incorrect [d" },
        { type: "text", text: "Param1valueString", isCrl: true },
      ],
    ],
    [
      "Unknown param [d666]",
      [
        { type: "text", text: "Unknown param " },
        { type: "text", text: "UNKNOWN_PARAM" },
      ],
    ],
    [
      "Me <fix>1 2 3</fix> you",
      [
        { type: "text", text: "Me " },
        { type: "text", text: "1 2 3", isFix: true },
        { type: "text", text: " you" },
      ],
    ],
    [
      "Me <format=right,11>1 2 3</format> you",
      [
        { type: "text", text: "Me " },
        { type: "text", text: "1 2 3" },
        { type: "text", text: "      " },
        { type: "text", text: " you" },
      ],
    ],
    [
      "Me <format=left,11>1 2 3</format> you",
      [
        { type: "text", text: "Me " },
        { type: "text", text: "      " },
        { type: "text", text: "1 2 3" },
        { type: "text", text: " you" },
      ],
    ],
    [
      "Me <format=center,11>1 2 3</format> you",
      [
        { type: "text", text: "Me " },
        { type: "text", text: "   " },
        { type: "text", text: "1 2 3" },
        { type: "text", text: "   " },
        { type: "text", text: " you" },
      ],
    ],
    [
      "Me <format=center,11>1 2 33</format> you",
      [
        { type: "text", text: "Me " },
        { type: "text", text: "  " },
        { type: "text", text: "1 2 33" },
        { type: "text", text: "   " },
        { type: "text", text: " you" },
      ],
    ],
    [
      "Me <format=center,11>===============</format> you",
      [
        { type: "text", text: "Me " },
        { type: "text", text: "===============" },
        { type: "text", text: " you" },
      ],
    ],

    [
      "You have {<>+2}",
      [
        { type: "text", text: "You have " },
        {
          isClr: true,
          text: "22",
          type: "text",
        },
      ],
    ],

    //
    //
    // TODO: What if [d1] refers [d2] which refers [d1]? TGE crashes with stack overflow
    //
    //
  ] as const) {
    const random = createDetermenisticRandom([5, 6, 7]);
    it(`Substitute '${str}'`, () => {
      const observed = stringCalculate(
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
      );

      debugTextOut += `['${str}', ${JSON.stringify(observed)}], \n`;

      const observedNoUndefined = JSON.parse(JSON.stringify(observed));
      assert.deepStrictEqual(observedNoUndefined, expected);
    });
  }
});

/*
describe("Out", () => {
  it("ok", () => {
    console.info("\n\n" + debugTextOut + "\n\n");
  });
});
*/
