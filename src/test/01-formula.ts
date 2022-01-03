// tslint:disable:no-invalid-this

import "mocha";
import * as assert from "assert";
import { calculate, MAX_NUMBER } from "../lib/formula";
import { randomFromMathRandom } from "../lib/randomFunc";

describe("Formula parser test", function () {
  const testEquations = {
    "2 + 2 * 2": 6,
    "2 +  2 * 2 +2+2": 10,
    "2+(2 *2 +3   )+4": 13,
    "5 + [3..3]*2": 11,
    "10 / 3": 3,
    "-10 / 3": -3,
    "10 / 3 * 3": 10,
    "10 / 2": 5,
    "10 / (-3)": -3,
    "10 / (-4)": -2,
    "-10 / (-4)": 3,
    "10 / 0": MAX_NUMBER,
    "-10 / 0": -MAX_NUMBER,
    "11 / 4": 3,
    "-11 / 4": -3,

    "10 div 3": 3,
    "10 div (-3)": -3,
    "-10 div (-3)": 3,
    "10 div 0": MAX_NUMBER,
    "-10 div 0": -MAX_NUMBER,
    "10 div 3 * 3": 9,
    "11 div 4": 2,
    "-11 div 4": -2,

    "10 mod 3": 1,
    "10 mod (-3)": 1,
    "-10 mod (-3)": -1,
    "10 mod 0": MAX_NUMBER,
    "-10 mod 0": -MAX_NUMBER,

    "2*3": 6,
    " -3 * (- 3)": 9,
    "4*(-3)": -12,

    "4 * -  3": -12,

    "-4 * -3": 12,
    "-2 + - 2": -4,
    "-6 / -3 * -4": -8,

    "-5": -5,
    "2-10": -8,

    "2 in [1..3]": 1,
    "2 in [3..4]": 0,
    "[3..5] in [1..6]": 1,
    "[3..5] in [7..8]": 0,
    "5 in 5": 1,
    "5 in 6": 0,

    "2 in 2 to 3": 1,
    "2 in 4 to 5": 0,
    "5 in [1..2] to [6..7]": 1,
    "5 in [6..7] to [4..4]": 1,
    "0 in [1..2] to [6..7]": 0,
    "8 in [1..2] to [6..7]": 0,

    "1 > 2": 0,
    "2 >= 2": 1,
    "2 >= 3": 0,
    "2 = 2": 1,
    "3 = 4": 0,
    " 5 < 1": 0,
    " 5 <= 4": 0,
    " 5 <= 5": 1,
    "6 <> 7": 1,
    "6 <> 6": 0,
    "1 and 1+1": 1,
    "1 or 0": 1,
    "10 or 11": 1,
    "0 and 0": 0,
    "3 and 0": 0,
    "0 and 3": 0,
    "0 or 0": 0,
    "0 or 4": 1,

    /*
        '2 <> <>': 1,
        '100 <> <>': 0,
        '<> <> 2': 1,
        '<> <> 100': 0,

        //'<> <> <> + 1': 1,
        '<> <> <>': 0,
        '<> mod 11': 2,
        '<> <> <> and <> <> <>': 0,
        //'<> <> <> and <> <> <> or <> <> <> + 1': 1,
        */

    "2 <> 2": 0,
    "4 <> 5": 1,

    "2 + [p3] * 3": 8,
    "2 + [p4] * 3": 14,
    "[p1]+[p2]*[p3]+[p4]": 6,

    "[p3] in [p2] to [p4]": 1,
    "[p2] in [p3] to [p4]": 0,

    "[-2]": -2,

    "[-3;-3;-3..-3]": -3,

    "0.05*100": 5,
    "100*0.05": 5,
    "10 000 + 1 00": 10100,
  };
  const params = [0, 1, 2, 4, 8, 16, 32, 64, 100];
  for (let i = 0; i < 100; i++) {
    params.push(i * 2);
  }

  for (const eq of Object.keys(testEquations) as (keyof typeof testEquations)[]) {
    it(`Calculates '${eq}' into ${testEquations[eq]}`, () => {
      assert.strictEqual(calculate(eq, params, randomFromMathRandom), testEquations[eq]);
    });
  }

  for (const withRandom of ["[p48]+[0..1]*[0..1]*[-1..1]+([p48]=0)*[1..8]", "[1..0]"]) {
    it(`Calculates '${withRandom}'`, () => {
      calculate(withRandom, params, randomFromMathRandom);
    });
  }
  it(`Formula with new lines`, () => {
    assert.strictEqual(calculate(` 1 \n + \r\n 1`, [], randomFromMathRandom), 2);
  });
  it(`Calculates scary formula from Codebox`, () => {
    assert.strictEqual(
      calculate(
        `(-(([p4] div 1000) mod 10)*1000*(([p1] div 10)=1)-
            (([p4] div 100) mod 10)*100*(([p1] div 10)=2)-
            (([p4] div 10) mod 10)*10*(([p1] div 10)=3)-(([p4] div 1) mod 10)*1*(([p1] div 10)=4))`,
        [44, 4631, 7584, 3152, 8270, 72],
        randomFromMathRandom,
      ),
      -2,
    );
  });

  describe("Randomness check ", function () {
    this.timeout(5000);
    it(`Check randomness of ranges`, () => {
      for (let i = 0; i < 10000; i++) {
        const random = calculate("3 + [4;9;  10..20]", [], randomFromMathRandom);
        assert.ok(random === 7 || random === 12 || (random >= 13 && random <= 23));
      }
    });
    it(`Check randomness of ranges with negative values`, () => {
      for (let i = 0; i < 10000; i++) {
        const random = calculate("3 + [ -20..-10]", [], randomFromMathRandom);
        assert.ok(random >= -20 + 3 && random <= -10 + 3);
      }
    });
    it(`Check randomness of ranges with negative and reversed values`, () => {
      for (let i = 0; i < 10000; i++) {
        const random = calculate("3 + [ -10 ..  -12; -3]", [], randomFromMathRandom);
        assert.ok(random === 0 || (random >= -12 + 3 && random <= -10 + 3));
      }
    });

    it(`Check randomness distribution`, () => {
      const values: { [val: number]: number } = {};
      for (let i = 0; i < 10000; i++) {
        const random = calculate("3 + [1;3;6..9] - 3", [], randomFromMathRandom);
        assert.ok(
          random === 1 || random === 3 || (random >= 6 && random <= 9),
          `Random value=${random}`,
        );
        if (random in values) {
          values[random]++;
        } else {
          values[random] = 0;
        }
      }
      for (const x of Object.keys(values).map((x) => parseInt(x))) {
        assert.ok(values[x] > (10000 / 6) * 0.9, `Values=${JSON.stringify(values, null, 4)}`);
        assert.ok(values[x] < (10000 / 6) * 1.1, `Values=${JSON.stringify(values, null, 4)}`);
      }
    });
  });
});
