import * as assert from "assert";
import "mocha";

import { _sortJumps } from "../lib/qmplayer/funcs";

describe("Checking _sortJumps", function() {
    it(`Empty list returns empty`, () => {
        const r = _sortJumps([], () => assert.fail("no random"));
        assert.deepEqual([], r);
    });
    it(`Sorting, all prios different`, () => {
        const r = _sortJumps(
            [
                { id: 0, showingOrder: 5 },
                { id: 1, showingOrder: 6 },
                { id: 2, showingOrder: 2 },
                { id: 3, showingOrder: 3 },
                { id: 4, showingOrder: 9 },
                { id: 5, showingOrder: 0 }
            ],
            () => assert.fail("no random")
        );
        assert.deepEqual(
            [
                { id: 5, showingOrder: 0 },
                { id: 2, showingOrder: 2 },
                { id: 3, showingOrder: 3 },
                { id: 0, showingOrder: 5 },
                { id: 1, showingOrder: 6 },
                { id: 4, showingOrder: 9 }
            ],
            r
        );
    });

    it(`Sorting, have duplicated prios`, () => {
        let randomId = -1;
        const random = (n: number | undefined) => {            
            if (n === undefined) {
                throw new Error('todo this test')
            }
            const randoms = [1, 0, 0, 1];
            randomId++;
            if (randomId >= randoms.length) {
                throw new Error("Lots of randoms");
            }
            const randomValue = randoms[randomId];
            // console.info(`Random call range=${n} randomValue=${randomValue}`)
            if (randomValue >= n) {
                throw new Error(`Why stored random value is greater?`)
            }            
            return randomValue;
        };
        const r = _sortJumps(
            [
                { id: 0, showingOrder: 5 },
                { id: 1, showingOrder: 6 },
                { id: 2, showingOrder: 2 },
                { id: 3, showingOrder: 3 },
                { id: 4, showingOrder: 9 },
                { id: 5, showingOrder: 0 },
                { id: 6, showingOrder: 5 },
                { id: 7, showingOrder: 2 },
                { id: 8, showingOrder: 3 },
                { id: 9, showingOrder: 3 },
            ],
            random
        );
        assert.deepEqual(
            [
                { id: 5, showingOrder: 0 },
                { id: 7, showingOrder: 2 },
                { id: 2, showingOrder: 2 },                
                { id: 3, showingOrder: 3 },
                { id: 8, showingOrder: 3 },                
                { id: 9, showingOrder: 3 },                
                { id: 0, showingOrder: 5 },
                { id: 6, showingOrder: 5 },
                { id: 1, showingOrder: 6 },
                { id: 4, showingOrder: 9 }                
            ],
            r
        );
    });
});
