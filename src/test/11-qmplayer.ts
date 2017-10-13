import { parse } from '../lib/qmreader';

import * as fs from 'fs';
import * as assert from 'assert';
import "mocha";

import { QMPlayer, GameState, JUMP_I_AGREE } from '../lib/qmplayer'

let player: QMPlayer;

function jumpTo(text: string = '') {
    const state = player.getState();
    const jump = state.choices.filter(x => x.text.indexOf(text) > -1 && x.active).shift()
    if (!jump) {
        throw new Error(`OLOLO: No jump '${text}' in ` + JSON.stringify(state, null, 4))
    }
    player.performJump(jump.jumpId);
    // console.info(player.getState());
    return player.getState();
}

for (const ext of ['qm','qmm']) {
describe(`Player on test10-locationtexts.${ext}`, function () {
    before(`Reads and parses quest`, () => {
        const data = fs.readFileSync(__dirname + `/../../src/test/test10-locationtexts.${ext}`);
        const qm = parse(data);
        player = new QMPlayer(qm, undefined, 'rus', false);
        player.start();
        player.performJump(JUMP_I_AGREE)
    })    
    it(`First state undefined`, () => {
        assert.ok(true);
        //console.info(player.getState())
    })
    it(`1nd jump to L2`, () => {
        assert.equal(jumpTo('-> L2').text, 'L2-1');        
    })
    it(`1nd back to L1`, () => {
        assert.equal(jumpTo('-> L1').text, 'L1-1');
    })

    it(`2nd jump to L2`, () => {
        assert.equal(jumpTo('-> L2').text, 'L2-2');
    })
    it(`2nd back to L1`, () => {
        assert.equal(jumpTo('-> L1').text, 'L1-2');
    })

    it(`3nd jump to L2`, () => {
        assert.equal(jumpTo('-> L2').text, 'L2-4');
    })
    it(`3nd back to L1 (no text check here)`, () => {
        jumpTo('-> L1');
        // qm: L1-1 , qmm : L2-4
    })

    it(`4nd jump to L2`, () => {
        assert.equal(jumpTo('-> L2').text, 'L2-1');
    })
    it(`4nd back to L1`, () => {
        assert.equal(jumpTo('-> L1').text, 'L1-4');
    })

    it(`5nd jump to L2`, () => {
        assert.equal(jumpTo('-> L2').text, 'L2-2');
    })
    it(`5nd back to L1`, () => {
        jumpTo('-> L1');
        // qm: L1-1 , qmm : L2-4
    })

    it(`6nd jump to L2`, () => {
        assert.equal(jumpTo('-> L2').text, 'L2-4');
    })
    it(`6nd back to L1`, () => {
        jumpTo('-> L1');
        // qm: L1-2 , qmm : L2-4
    })

    it(`7nd jump to L2`, () => {
        assert.equal(jumpTo('-> L2').text, 'L2-1');
    })
    it(`7nd back to L1`, () => {
        jumpTo('-> L1');
        // qm: L1-2 
    })

    // qm: 8 -> L1-1 , 9 -> L1-1, 10 -> L1-4 , 11 -> L1-1 ????
})
}

describe('Player on test10-deadly-loc.qmm', function () {
    let save: GameState;
    it(`Reads and parses quest`, () => {
        const data = fs.readFileSync(__dirname + '/../../src/test/test10-deadly-loc.qmm');
        const qm = parse(data);
        player = new QMPlayer(qm, undefined, 'rus', false);
        player.start();
        player.performJump(JUMP_I_AGREE);
        save = player.getSaving();
    })

    describe('Jumping to locations', () => {
        beforeEach(() => {
            player.loadSaving(save);
        })
        it(`Going to L5`, () => {
            assert.equal(player.getState().choices.length, 4)
            jumpTo('-> L5');
            assert.equal(player.getState().choices.length, 1);
            assert.equal(player.getState().text, 'L5');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win')
            assert.equal(player.getState().choices.length, 0)
        })

        it(`Going to L4`, () => {
            assert.equal(player.getState().choices.length, 4)
            jumpTo('-> L4')            
            assert.equal(player.getState().text, 'L4fail');
            assert.equal(player.getState().gameState, 'fail')
            assert.equal(player.getState().choices.length, 0)
        })

        it(`Going to L2`, () => {
            assert.equal(player.getState().choices.length, 4)
            jumpTo('-> L2')            
            assert.equal(player.getState().text, 'L2dead');
            assert.equal(player.getState().gameState, 'dead')
            assert.equal(player.getState().choices.length, 0)
        })
    })

})

describe('Player on limitedLocation.qmm', function () {
    let save: GameState;
    it(`Reads and parses quest`, () => {
        const data = fs.readFileSync(__dirname + '/../../src/test/limitedLocation.qmm');
        const qm = parse(data);
        player = new QMPlayer(qm, undefined, 'rus', false);
        player.start();
        player.performJump(JUMP_I_AGREE)
    })
    it(`Have 3 jumps`, () => {
        assert.equal(player.getState().choices.length, 3)
    })
    it('Performing walking loop', () => {
        jumpTo('Start --> LimitedLocation');
        jumpTo('LimitedLocation0 --> Start');
        jumpTo('Start --> LimitedLocation');
        jumpTo('LimitedLocation0 --> Start');
    })
    it(`Have 1 jump`, () => {
        assert.equal(player.getState().choices.length, 1)
        assert.equal(player.getState().choices[0].text, 'Start -> winloc');
    })
})

describe('Player on test4-forqmm.qm', function () {
    describe('Old behaviour', () => {
        it(`Reads and parses quest`, () => {
            const data = fs.readFileSync(__dirname + '/../../src/test/test4-forqmm.qm');
            const qm = parse(data);
            player = new QMPlayer(qm, undefined, 'rus', true);
            player.start();
            player.performJump(JUMP_I_AGREE)
        })
        it('Performing walking loop', () => {
            jumpTo('-> L1');
            jumpTo('--> L2');
            jumpTo('');
            jumpTo('');
            jumpTo('--> L2');
            jumpTo('');
            jumpTo('');
        })
        it('No jump here', () => {
            assert.equal(player.getState().choices.length, 0, 'TGE 4 shows not choices here')
        })
    })
    describe('New behaviour', () => {
        it(`Reads and parses quest`, () => {
            const data = fs.readFileSync(__dirname + '/../../src/test/test4-forqmm.qm');
            const qm = parse(data);
            player = new QMPlayer(qm, undefined, 'rus', false);
            player.start();
            player.performJump(JUMP_I_AGREE)
        })
        it('Performing walking loop', () => {
            jumpTo('-> L1');
            jumpTo('--> L2');
            jumpTo('');
            jumpTo('');
            jumpTo('--> L2');
            jumpTo('');
            jumpTo('');
            jumpTo('--> L2');
            jumpTo('');
            assert.equal(player.getState().gameState, 'win', 'TGE 5 allows here to win')
        })
    })
})

describe('Player on test8-emptyloc.qm', function () {
    describe('New behaviour', () => {
        beforeEach(`Reads and parses quest`, () => {
            const data = fs.readFileSync(__dirname + '/../../src/test/test8-emptyloc.qm');
            const qm = parse(data);
            player = new QMPlayer(qm, undefined, 'rus', false);
            player.start();
            player.performJump(JUMP_I_AGREE)
        })
        it('-> L2', () => {
            assert.equal(jumpTo('-> L2').text, 'J2desc');
            assert.equal(jumpTo('').text, 'j3desc');
            assert.equal(jumpTo('').text, 'j4desc');
            assert.equal(jumpTo('').text, 'L4');
        })
        it('-> L5', () => {
            assert.equal(jumpTo('-> L5').text, 'J5desc');
            assert.equal(jumpTo('').text, 'L4');
        })
        it('-> L7', () => {
            assert.equal(jumpTo('-> L7').text, 'J8Desc');
            assert.equal(jumpTo('').text, 'L4');
        })
        it('-> L9', () => {
            assert.equal(jumpTo('-> L9').text, 'J11Desc');
            assert.equal(jumpTo('').text, 'L10');
            assert.equal(jumpTo('').text, 'L4');
        })

    })
})

describe('Player on test9-loop-qm.qm', function () {
    beforeEach(`Reads and parses quest`, () => {
        const data = fs.readFileSync(__dirname + '/../../src/test/test9-loop-qm.qm');
        const qm = parse(data);
        player = new QMPlayer(qm, undefined, 'rus', false);
        player.start();
        player.performJump(JUMP_I_AGREE)
    })

    it('L1 -> L1', () => {
        assert.equal(jumpTo('-> L4').text, 'L1');
        assert.equal(jumpTo('-> L4').text, 'L1');
        assert.equal(jumpTo('-> L4').text, 'p1_j6_crit');
        assert.equal(jumpTo('').gameState, 'win');
    })
    /*    
        it('L1 -> L1', () => {
            assert.equal(jumpTo('-> L1').text, 'L1');
            //assert.equal(jumpTo('-> L1').text, 'L1');
            console.info(jumpTo('-> L1'))
            console.info(jumpTo('-> L1'))
            //assert.equal(jumpTo('-> L1').text,'j1crit');
            assert.equal(jumpTo('').gameState, 'win');
        })
        */
})

describe('Player on test9-loop.qmm', function () {
    beforeEach(`Reads and parses quest`, () => {
        const data = fs.readFileSync(__dirname + '/../../src/test/test9-loop.qmm');
        const qm = parse(data);
        player = new QMPlayer(qm, undefined, 'rus', false);
        player.start();
        player.performJump(JUMP_I_AGREE)
    })

    it('L1 -> L1', () => {
        assert.equal(jumpTo('-> L4').text, 'L1');
        assert.equal(jumpTo('-> L4').text, 'L1');
        assert.equal(jumpTo('-> L4').text, 'p1_j6_crit');
        assert.equal(jumpTo('').gameState, 'win');
    })

    it('L1 -> L1', () => {
        assert.equal(jumpTo('-> L1').text, 'L1');
        assert.equal(jumpTo('-> L1').text, 'L1');
        assert.equal(jumpTo('-> L1').text, 'j1crit');
        assert.equal(jumpTo('').gameState, 'win');
    })

})