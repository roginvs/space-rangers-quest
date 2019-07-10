// tslint:disable:no-invalid-this

import "mocha";
import * as assert from "assert";
import { parse, MAX_NUMBER } from "../lib/formula";
import { randomFromMathRandom } from "../lib/randomFunc";

describe("Formula parser test", function() {
  it(`Throws on wrong formula`, () => {
    const throwingFormulas = ["2+", "2+2{"];
    for (const t of throwingFormulas) {
      assert.throws(() => parse(t, [0, 0, 0, 0, 0], () => 0), `${t}`);
    }
  });
});
