// tslint:disable:no-invalid-this

import "mocha";
import * as assert from "assert";
import { calculate, MAX_NUMBER } from "../lib/formula";
import { randomFromMathRandom } from "../lib/randomFunc";

describe("Formula parser test throws", function () {
  const throwingFormulas = [
    "2+",
    "2 + 2 {",
    "-",
    "-3..",
    "Кек",
    "%",
    "2%4",
    "2 div ",
    " div 54",
    "#",
    "[pp]",
    "[p1sss] + 2",
  ];
  for (const t of throwingFormulas) {
    it(`Throws at '${t}'`, () => {
      assert.throws(() => calculate(t, [0, 0, 0, 0, 0], () => 0));
    });
  }
});
