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
        throw new Error(`OLOLO: No jump ${text} in ` + JSON.stringify(state, null, 4))
    }
    player.performJump(jump.jumpId);
    // console.info(player.getState());
    return player.getState();
}
describe('Player on test6-empty.qm', function () {
    let save: GameState;
    it(`Reads and parses quest`, () => {
        const data = fs.readFileSync(__dirname + '/../../src/test/test6-empty.qm');
        const qm = parse(data);
        player = new QMPlayer(qm, undefined, 'rus'); // false
        player.start();
        player.performJump(JUMP_I_AGREE)
        save = player.getSaving();
    })
    describe('Crit params on loc/jumps', () => {
        beforeEach(() => {
            player.loadSaving(save);
        })
        it(`failonloc_chain`, () => {
            jumpTo('failonloc_chain');
            assert.equal(player.getState().text, 'p2_at_l11');
            assert.equal(player.getState().gameState, 'fail');
        })
        it(`success_on_loc_jumptext`, () => {
            jumpTo('success_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'success_on_loc_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })
        it(`success_on_loc_no_jumptext`, () => {
            jumpTo('success_on_loc_no_jumptext');
            assert.equal(player.getState().text, 'success_on_loc_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })
        it(`success_on_locnotext_nojumptext`, () => {
            jumpTo('success_on_locnotext_nojumptext');
            assert.equal(player.getState().text, 'p1_at_l10')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })
        it(`success_on_locnotext_jumptext`, () => {
            jumpTo('success_on_locnotext_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'p1_at_l10')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })
        it(`success_on_jump_jumptext`, () => {
            jumpTo('success_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'success_on_jump_jumptext_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })
        it(`success_on_jump_nojumptext`, () => {
            jumpTo('success_on_jump_nojumptext');
            assert.equal(player.getState().text, 'success_on_jump_nojumptext_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })


        it(`fail_on_jump_jumptext`, () => {
            jumpTo('fail_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'fail_jump_msg')
            assert.equal(player.getState().gameState, 'fail')
        })
        it(`fail_on_jump_nojumptext`, () => {
            jumpTo('fail_on_jump_nojumptext');
            assert.equal(player.getState().text, 'fail_jump_text')
            assert.equal(player.getState().gameState, 'fail')
        })
        it(`fail_on_loc_jumptext`, () => {
            jumpTo('fail_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'fail_loc_msg');
            assert.equal(player.getState().gameState, 'fail');
        })
        it(`fail_on_loc_nojumptext`, () => {
            jumpTo('fail_on_loc_nojumptext');
            assert.equal(player.getState().text, 'fail_loc_msg');
            assert.equal(player.getState().gameState, 'fail');
        })
        it(`fail_on_locnotext_jumptext`, () => {
            jumpTo('fail_on_locnotext_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'p2_failed_on_L9');
            assert.equal(player.getState().gameState, 'fail');
        })
        it(`fail_on_locnotext_nojumptext`, () => {
            jumpTo('fail_on_locnotext_nojumptext');
            assert.equal(player.getState().text, 'p2_failed_on_L9');
            assert.equal(player.getState().gameState, 'fail');
        })



        it(`death_on_jump_jumptext`, () => {
            jumpTo('death_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'dead_jump_msg')
            assert.equal(player.getState().gameState, 'dead')
        })
        it(`death_on_jump_nojumptext`, () => {
            jumpTo('death_on_jump_nojumptext');
            assert.equal(player.getState().text, 'dead_jump_msg')
            assert.equal(player.getState().gameState, 'dead')
        })
        it(`death_on_loc_jumptext`, () => {
            jumpTo('death_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'dead_on_loc');
            assert.equal(player.getState().gameState, 'dead');
        })
        it(`death_on_loc_nojumptext`, () => {
            jumpTo('death_on_loc_nojumptext');
            assert.equal(player.getState().text, 'dead_on_loc');
            assert.equal(player.getState().gameState, 'dead');
        })
    })
})

describe('Player on test6.qm', function () {
    let save: GameState;
    it(`Reads and parses quest`, () => {
        const data = fs.readFileSync(__dirname + '/../../src/test/test6.qm');
        const qm = parse(data);
        player = new QMPlayer(qm, undefined, 'rus'); // true
        player.start();
        player.performJump(JUMP_I_AGREE)
        save = player.getSaving();
    })
    describe('Crit params on loc/jumps with active jump', () => {
        beforeEach(() => {
            player.loadSaving(save);
        })
        it(`success_on_loc_jumptext`, () => {
            jumpTo('success_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'success_on_loc')
            jumpTo('')
            assert.equal(player.getState().text, 'success_on_loc_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })
        it(`success_on_loc_no_jumptext`, () => {
            jumpTo('success_on_loc_no_jumptext');
            assert.equal(player.getState().text, 'success_on_loc')
            jumpTo('')
            assert.equal(player.getState().text, 'success_on_loc_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })
        it(`success_on_jump_jumptext`, () => {
            jumpTo('success_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'success_on_jump_jumptext_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })
        it(`success_on_jump_nojumptext`, () => {
            jumpTo('success_on_jump_nojumptext');
            assert.equal(player.getState().text, 'success_on_jump_nojumptext_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })


        it(`fail_on_jump_jumptext`, () => {
            jumpTo('fail_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'fail_jump_msg')
            assert.equal(player.getState().gameState, 'fail')
        })
        it(`fail_on_jump_nojumptext`, () => {
            jumpTo('fail_on_jump_nojumptext');
            assert.equal(player.getState().text, 'fail_jump_text')
            assert.equal(player.getState().gameState, 'fail')
        })
        it(`fail_on_loc_jumptext live-after-fail`, () => {
            jumpTo('fail_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'fail_on_loc')
            /* Here is live-after-fail */
            jumpTo('')
            assert.equal(player.getState().text, 'L3');
            assert.equal(player.getState().gameState, 'running');
        })
        it(`fail_on_loc_nojumptext`, () => {
            jumpTo('fail_on_loc_nojumptext');
            assert.equal(player.getState().text, 'fail_on_loc');
            /* Here is live-after-fail */
            jumpTo('')
            assert.equal(player.getState().text, 'L3');
            assert.equal(player.getState().gameState, 'running');
        })


        it(`death_on_jump_jumptext`, () => {
            jumpTo('death_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'dead_jump_msg')
            assert.equal(player.getState().gameState, 'dead')
        })
        it(`death_on_jump_nojumptext`, () => {
            jumpTo('death_on_jump_nojumptext');
            assert.equal(player.getState().text, 'dead_jump_msg')
            assert.equal(player.getState().gameState, 'dead')
        })
        it(`death_on_loc_jumptext`, () => {
            jumpTo('death_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'death_on_loc')
            /* Here is live-after-dead */
            jumpTo('')
            assert.equal(player.getState().text, 'L3');
            assert.equal(player.getState().gameState, 'running');
        })
        it(`death_on_loc_nojumptext`, () => {
            jumpTo('death_on_loc_nojumptext');
            assert.equal(player.getState().text, 'death_on_loc');
            /* Here is live-after-dead */
            jumpTo('')
            assert.equal(player.getState().text, 'L3');
            assert.equal(player.getState().gameState, 'running');
        })
    })
    describe('Crit params on loc/jumps without active jump', () => {
        beforeEach(() => {
            player.loadSaving(save);
            jumpTo('enable_lock');
        })
        it(`success_on_loc_jumptext`, () => {
            jumpTo('success_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'success_on_loc')
            jumpTo('')
            assert.equal(player.getState().text, 'success_on_loc_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })
        it(`success_on_loc_no_jumptext`, () => {
            jumpTo('success_on_loc_no_jumptext');
            assert.equal(player.getState().text, 'success_on_loc')
            jumpTo('')
            assert.equal(player.getState().text, 'success_on_loc_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })
        it(`success_on_jump_jumptext`, () => {
            jumpTo('success_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'success_on_jump_jumptext_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })
        it(`success_on_jump_nojumptext`, () => {
            jumpTo('success_on_jump_nojumptext');
            assert.equal(player.getState().text, 'success_on_jump_nojumptext_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })


        it(`fail_on_jump_jumptext`, () => {
            jumpTo('fail_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'fail_jump_msg')
            assert.equal(player.getState().gameState, 'fail')
        })
        it(`fail_on_jump_nojumptext`, () => {
            jumpTo('fail_on_jump_nojumptext');
            assert.equal(player.getState().text, 'fail_jump_text')
            assert.equal(player.getState().gameState, 'fail')
        })
        it(`fail_on_loc_jumptext`, () => {
            jumpTo('fail_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'fail_on_loc')
            jumpTo('')
            assert.equal(player.getState().text, 'fail_loc_msg');
            assert.equal(player.getState().gameState, 'fail');
        })
        it(`fail_on_loc_nojumptext`, () => {
            jumpTo('fail_on_loc_nojumptext');
            assert.equal(player.getState().text, 'fail_on_loc');
            jumpTo('')
            assert.equal(player.getState().text, 'fail_loc_msg');
            assert.equal(player.getState().gameState, 'fail');
        })


        it(`death_on_jump_jumptext`, () => {
            jumpTo('death_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'dead_jump_msg')
            assert.equal(player.getState().gameState, 'dead')
        })
        it(`death_on_jump_nojumptext`, () => {
            jumpTo('death_on_jump_nojumptext');
            assert.equal(player.getState().text, 'dead_jump_msg')
            assert.equal(player.getState().gameState, 'dead')
        })
        it(`death_on_loc_jumptext`, () => {
            jumpTo('death_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'death_on_loc')
            jumpTo('')
            assert.equal(player.getState().text, 'dead_on_loc');
            assert.equal(player.getState().gameState, 'dead');
        })
        it(`death_on_loc_nojumptext`, () => {
            jumpTo('death_on_loc_nojumptext');
            assert.equal(player.getState().text, 'death_on_loc');
            jumpTo('')
            assert.equal(player.getState().text, 'dead_on_loc');
            assert.equal(player.getState().gameState, 'dead');
        })

    })
})

describe('Player on test6.qm with permitLiveAfterDeath=false', function () {
    let save: GameState;
    it(`Reads and parses quest`, () => {
        const data = fs.readFileSync(__dirname + '/../../src/test/test6.qm');
        const qm = parse(data);
        player = new QMPlayer(qm, undefined, 'rus'); // false
        player.start();
        player.performJump(JUMP_I_AGREE)
        save = player.getSaving();
    })
    describe('Crit params on loc/jumps with active jump', () => {
        beforeEach(() => {
            player.loadSaving(save);
        })
        it(`success_on_loc_jumptext`, () => {
            jumpTo('success_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'success_on_loc')
            jumpTo('')
            assert.equal(player.getState().text, 'success_on_loc_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })
        it(`success_on_loc_no_jumptext`, () => {
            jumpTo('success_on_loc_no_jumptext');
            assert.equal(player.getState().text, 'success_on_loc')
            jumpTo('')
            assert.equal(player.getState().text, 'success_on_loc_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })
        it(`success_on_jump_jumptext`, () => {
            jumpTo('success_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'success_on_jump_jumptext_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })
        it(`success_on_jump_nojumptext`, () => {
            jumpTo('success_on_jump_nojumptext');
            assert.equal(player.getState().text, 'success_on_jump_nojumptext_msg')
            jumpTo('')
            assert.equal(player.getState().gameState, 'win')
        })


        it(`fail_on_jump_jumptext`, () => {
            jumpTo('fail_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'fail_jump_msg')
            assert.equal(player.getState().gameState, 'fail')
        })
        it(`fail_on_jump_nojumptext`, () => {
            jumpTo('fail_on_jump_nojumptext');
            assert.equal(player.getState().text, 'fail_jump_text')
            assert.equal(player.getState().gameState, 'fail')
        })
        
        it.skip(`fail_on_loc_jumptext`, () => {
            jumpTo('fail_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'fail_on_loc')
            jumpTo('')
            assert.equal(player.getState().text, 'fail_loc_msg');
            assert.equal(player.getState().gameState, 'fail');
        })
        
        it.skip(`fail_on_loc_nojumptext`, () => {
            jumpTo('fail_on_loc_nojumptext');
            assert.equal(player.getState().text, 'fail_on_loc');
            jumpTo('')
            assert.equal(player.getState().text, 'fail_loc_msg');
            assert.equal(player.getState().gameState, 'fail');
        })


        it(`death_on_jump_jumptext`, () => {
            jumpTo('death_on_jump_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'dead_jump_msg')
            assert.equal(player.getState().gameState, 'dead')
        })
        it(`death_on_jump_nojumptext`, () => {
            jumpTo('death_on_jump_nojumptext');
            assert.equal(player.getState().text, 'dead_jump_msg')
            assert.equal(player.getState().gameState, 'dead')
        })
        it.skip(`death_on_loc_jumptext`, () => {
            jumpTo('death_on_loc_jumptext');
            assert.equal(player.getState().text, 'jumptext')
            jumpTo('')
            assert.equal(player.getState().text, 'death_on_loc')
            jumpTo('')
            assert.equal(player.getState().text, 'dead_on_loc');
            assert.equal(player.getState().gameState, 'dead');
        })
        it.skip(`death_on_loc_nojumptext`, () => {
            jumpTo('death_on_loc_nojumptext');
            assert.equal(player.getState().text, 'death_on_loc');
            jumpTo('')
            assert.equal(player.getState().text, 'dead_on_loc');
            assert.equal(player.getState().gameState, 'dead');
        })
    })
})

describe('Player on test5.qm', function () {
    it(`Reads and parses quest`, () => {
        const data = fs.readFileSync(__dirname + '/../../src/test/test5.qm');
        const qm = parse(data);
        player = new QMPlayer(qm, undefined, 'rus'); // true
        player.start();
    })
    it(`Accept`, () => player.performJump(JUMP_I_AGREE));
    it(`In L2`, () => {
        assert.equal(player.getState().text, 'L2')
    })
})

describe('Player on test4.qm', function () {
    this.timeout(20 * 1000);

    let save: GameState;

    it(`Reads and parses quest`, () => {
        const data = fs.readFileSync(__dirname + '/../../src/test/test4.qm');
        const qm = parse(data);
        player = new QMPlayer(qm, undefined, 'rus'); // true
        player.start();
    })
    it(`Accept`, () => player.performJump(JUMP_I_AGREE));

    describe(`Available jumps`, () => {
        it(`2 jumps available, going first loop`, () => {
            jumpTo('-> L1');
            assert.equal(player.getState().choices.length, 3, 'Three jump available ' +
                JSON.stringify(player.getState()));
            save = player.getSaving();
            jumpTo('-> L8');
            jumpTo('-> L9');
            jumpTo('-> Start');
            jumpTo('-> L8');
            assert.equal(player.getState().choices.length, 0, 'Dead end here');
            player.loadSaving(save);
        })
        it(`2 jumps available, going second loop`, () => {
            assert.equal(player.getState().choices.length, 3, 'Three jump available');
            jumpTo('-> L2');
            jumpTo('-> L3');
            jumpTo('-> Start');
            assert.equal(player.getState().choices.length, 2, 'Two jumps left');
        })
        it(`2 jumps available, going third loop`, () => {
            jumpTo('-> L4');
            jumpTo('-> L6');
            jumpTo('-> L7');
            jumpTo('-> L4');
            assert.equal(player.getState().text, 'L4');
            assert.equal(player.getState().choices.length, 1);
            jumpTo('');
        })
        it(`L5`, () => {
            assert.equal(player.getState().text, 'L5');
            jumpTo('-> L10');
            jumpTo('-> L11');
            jumpTo('-> L5');
            jumpTo('-> L10');
            jumpTo('-> L11');
            jumpTo('-> L5');
            assert.equal(player.getState().choices.length, 1);
            jumpTo('-> L13');
        })
        it(`L13`, () => {
            assert.equal(player.getState().text, 'L13');
            assert.equal(player.getState().choices.length, 4);
            save = player.getSaving();
            jumpTo('-> L16');
            assert.equal(player.getState().choices.length, 0, 'L16 is dead end');
            player.loadSaving(save);
            jumpTo('-> L18');
            assert.equal(player.getState().choices.filter(x => x.active).length, 0, 'L18 is dead end');
            player.loadSaving(save);
            jumpTo('-> L14');
            jumpTo('-> L13');
            jumpTo('-> L14');
            jumpTo('-> L13');
            assert.equal(player.getState().choices.length, 3);
        })
    })
})
describe('Player on test3.qm', function () {
    this.timeout(20 * 1000);

    let save: GameState;
    let lastTestOk = false;

    it(`Reads and parses quest`, () => {
        const data = fs.readFileSync(__dirname + '/../../src/test/test3.qm');
        const qm = parse(data);
        player = new QMPlayer(qm, undefined, 'rus'); // true
        player.start();
    })
    it(`Accept`, () => player.performJump(JUMP_I_AGREE));

    describe(`Empty locations/jumps`, () => {
        beforeEach(() => {
            save = player.getSaving();
        });
        afterEach(() => {
            player.loadSaving(save);
        })
        it(`loc0text_0empty_jump0text_param=0`, () => {
            jumpTo('loc0text_0empty_jump0text_param=0');
            assert.equal(player.getState().text, 'Main menu', 'Wants main menu');
        })
        it(`loc0text_0empty_jump0text_param=1`, () => {
            const st = jumpTo(`loc0text_0empty_jump0text_param=1`);
            assert.equal(player.getState().choices.length, 1);
            assert.equal(player.getState().text, '')
            assert.equal(jumpTo('2win').text, 'Win');
        })
        it(`loc1text_0empty_jump0text_param=0`, () => {
            assert.ok(jumpTo('loc1text_0empty_jump0text_param=0').text, 'Text')
            assert.equal(player.getState().choices.length, 1, 'One choise');
        })
        it(`loc1text_0empty_jump0text_param=1`, () => {
            assert.ok(jumpTo('loc1text_0empty_jump0text_param=1').text, 'Text')
            assert.equal(player.getState().choices.length, 1);
            assert.equal(jumpTo('2win').text, 'Win');
        })
        it(`loc0text_1empty_jump0text_param=0`, () => {
            assert.equal(jumpTo('loc0text_1empty_jump0text_param=0').text, 'Main menu')
        })
        it(`loc0loctext1text_1empty_jump0text_param=0`, () => {
            assert.equal(jumpTo('loc0loctext1text_1empty_jump0text_param=0').text, 'Main menu')
        })
        it(`loc1loctext1text_1empty_jump0text_param=0`, () => {
            assert.equal(jumpTo('loc1loctext1text_1empty_jump0text_param=0').text, 'some_text_l23')
            assert.equal(jumpTo('').text, 'Main menu')
        })
        it(`loc0loctext1jumptext1text_1empty_jump0text_param=0`, () => {
            assert.equal(jumpTo('loc0loctext1jumptext1text_1empty_jump0text_param=0').text, 'jump52text')
            assert.equal(jumpTo('').text, 'Main menu')
        })
        it(`loc1loctext1jumptext1text_1empty_jump0text_param=0`, () => {
            assert.equal(jumpTo('loc1loctext1jumptext1text_1empty_jump0text_param=0').text, 'jump53text')
            assert.equal(jumpTo('').text, 'some_text_l23')
            assert.equal(jumpTo('').text, 'Main menu')
        })


        it(`loc0text_1empty_jump0text_param=1`, () => {
            jumpTo(`loc0text_1empty_jump0text_param=1`);
            assert.equal(player.getState().choices.length, 1);
            assert.equal(jumpTo('2win').text, 'Win');
        })
        it(`loc0text_1empty_jump1text_locparam=0`, () => {
            assert.equal(jumpTo('loc0text_1empty_jump1text_locparam=0').text, 'jumpTextX');
            assert.equal(jumpTo('').text, 'Main menu');
        })
        it(`loc0text_1empty_jump1text_locparam=1`, () => {
            assert.equal(jumpTo('loc0text_1empty_jump1text_locparam=1').text, 'jumpText');
            assert.equal(player.getState().choices.length, 1);
            assert.equal(jumpTo('2win').text, 'Win');
        })
    })


    /* TODO
        - Если есть доступные переходы
            - fail на критичных параметрах на Провальном типе (так же как на dead)
            - критичное успешное выдаёт успех (не как fail/dead)

        - Критичный минимум (win/fail/dead)
        
        - Критичные значения на переходе
            - ? как в TGE - обрабатывать всегда, или
                 как в теории - обработать локацию и проверить наличие переходов 



    */

    describe(`Last test`, () => {
        it(`Set flag`, () => { lastTestOk = true })
    })

    after(function () {
        if (!lastTestOk) {
            console.info(player.getState())
        }
    })
})


describe('Player on test2.qm', function () {
    this.timeout(20 * 1000);

    let save: GameState;
    let lastTestOk = false;

    it(`Reads and parses quest`, () => {
        const data = fs.readFileSync(__dirname + '/../../src/test/test2.qm');
        const qm = parse(data);
        player = new QMPlayer(qm, undefined, 'rus'); // true
        player.start();
    })
    it(`Accept`, () => player.performJump(JUMP_I_AGREE));
    it(`Main menu`, () => assert.equal(jumpTo('mainmenu').text, 'Main menu'));
    it(`To equal`, () => assert.equal(jumpTo('To equal').text, 'Here should be 1 jump'));
    it(`Next`, () => {
        assert.equal(player.getState().choices.length, 1);
        jumpTo('next').text;
        assert.equal(player.getState().text, 'Text2');
    });
    it(`Next`, () => {
        assert.equal(player.getState().choices.length, 1);
        jumpTo('next').text;
        assert.equal(player.getState().text, 'Text3');
    });
    it(`Main menu`, () => assert.equal(jumpTo('mainmenu').text, 'Main menu'));
    it(`Save in main menu`, () => {
        save = player.getSaving();
    })
    describe(`Ending locations`, () => {
        beforeEach(() => {
            player.loadSaving(save);
            jumpTo('ending_locations');
        })
        it(`win0`, () => {
            assert.ok(jumpTo('win0').text === 'Winner');
            const st = jumpTo('');
            assert.ok(st.gameState === 'win');
        })
        it(`win1`, () => {
            assert.ok(jumpTo('win1').text === 'text');
            assert.ok(jumpTo('').text === 'Winner');
            const st = jumpTo('');
            assert.ok(st.gameState === 'win');
        })

        it(`lose0`, () => {
            const st = jumpTo('lose0');
            assert.ok(st.gameState === 'fail' && st.text === 'Loser');
        })
        it(`lose1`, () => {
            assert.ok(jumpTo('lose1').text === 'text');
            const st = jumpTo('');
            assert.ok(st.gameState === 'fail' && st.text === 'Loser');
        })

        it(`zombie0`, () => {
            const st = jumpTo('zombie0');
            assert.equal(st.gameState, 'dead')
            assert.equal(st.text, 'Zombie');
        })
        it(`zombie1`, () => {
            assert.ok(jumpTo('zombie1').text === 'text');
            const st = jumpTo('');
            assert.equal(st.gameState, 'dead')
            assert.equal(st.text, 'Zombie');
        })
    })
    describe(`Locations with crit params in update`, () => {
        beforeEach(() => {
            player.loadSaving(save);
            jumpTo('end_by_crit_in_loc');
        })
        it(`Fail no zombie`, () => {
            jumpTo('failNoZombie');
            assert.ok(jumpTo().gameState === 'dead')
        })
        it(`Fail wuth zombie`, () => {
            jumpTo('failZombie');
            const st = jumpTo()
            assert.ok(st.text === 'Zombie');
            assert.equal(st.choices.length, 0);
        })
    })

    describe(`Empty locations/jumps`, () => {
        beforeEach(() => {
            player.loadSaving(save);
            jumpTo('empty_loc_empty_jump');
        })
        it(`loc0text_0empty_jump0text_param=0`, () => {
            assert.equal(jumpTo('loc0text_0empty_jump0text_param=0').text, '');
            assert.equal(player.getState().choices.length, 1, 'One choise');
            assert.equal(player.getState().choices.filter(x => x.active).length, 0, 'But inactive');
            assert.equal(player.getState().choices[0].text, 'neverActive');
        })
        it(`loc0text_0empty_jump0text_param=1`, () => {
            const st = jumpTo(`loc0text_0empty_jump0text_param=1`);
            assert.equal(player.getState().choices.length, 2);
            assert.equal(jumpTo('2win').text, 'Win');
        })
        it(`loc1text_0empty_jump0text_param=0`, () => {
            assert.ok(jumpTo('loc1text_0empty_jump0text_param=0').text, 'Text')
            assert.equal(player.getState().choices.length, 1, 'One choise');
            assert.equal(player.getState().choices.filter(x => x.active).length, 0, 'But inactive');
            assert.equal(player.getState().choices[0].text, 'neverActive');
        })
        it(`loc1text_0empty_jump0text_param=1`, () => {
            assert.ok(jumpTo('loc1text_0empty_jump0text_param=1').text, 'Text')
            assert.equal(player.getState().choices.length, 2);
            assert.equal(jumpTo('2win').text, 'Win');
        })
        it(`loc0text_1empty_jump0text_param=0`, () => {
            assert.equal(jumpTo('loc0text_1empty_jump0text_param=0').text, '')
            assert.equal(player.getState().choices.length, 1, 'One choise');
            assert.equal(player.getState().choices.filter(x => x.active).length, 0, 'But inactive');
            assert.equal(player.getState().choices[0].text, 'neverActive');
        })
        it(`loc0text_1empty_jump0text_param=1`, () => {
            jumpTo(`loc0text_1empty_jump0text_param=1`);
            assert.equal(player.getState().choices.length, 2);
            assert.equal(jumpTo('2win').text, 'Win');
        })
        it(`loc0text_1empty_jump1text_locparam=0`, () => {
            assert.equal(jumpTo('loc0text_1empty_jump1text_locparam=0').text, 'jumpTextX');
            assert.equal(player.getState().choices.length, 1, 'One choise');
            assert.equal(player.getState().choices.filter(x => x.active).length, 0, 'But inactive');
            assert.equal(player.getState().choices[0].text, 'neverActive');
        })
        it(`loc0text_1empty_jump1text_locparam=1`, () => {
            assert.equal(jumpTo('loc0text_1empty_jump1text_locparam=1').text, 'jumpText');
            assert.equal(player.getState().choices.length, 2);
            assert.equal(jumpTo('2win').text, 'Win');
        })
    })


    /* TODO
        - Если есть доступные переходы
            - fail на критичных параметрах на Провальном типе (так же как на dead)
            - критичное успешное выдаёт успех (не как fail/dead)

        - Критичный минимум (win/fail/dead)
        
        - Критичные значения на переходе
            - ? как в TGE - обрабатывать всегда, или
                 как в теории - обработать локацию и проверить наличие переходов 



    */

    describe(`Last test`, () => {
        it(`Set flag`, () => { lastTestOk = true })
    })

    after(function () {
        if (!lastTestOk) {
            console.info(player.getState())
        }
    })
})

describe('Player on test.qm', function () {
    this.timeout(20 * 1000);

    let save1: GameState;


    it(`Reads and parses quest`, () => {
        const data = fs.readFileSync(__dirname + '/../../src/test/test.qm');
        const qm = parse(data);
        player = new QMPlayer(qm, undefined, 'rus'); // true
        player.start();
    })

    it(`Have first state`, () => {
        const state1 = player.getState();
        assert.ok(state1.text);
        assert.ok(state1.gameState === 'running');
    })
    it(`Jumps to accept`, () => {
        player.performJump(JUMP_I_AGREE);
    })

    it(`Starting location jumps count`, () => {
        const state2 = player.getState()
        // console.info(JSON.stringify(state2, null, 4));
        assert.equal(state2.choices.filter(x => x.active).length, 2);
        assert.equal(state2.choices.filter(x => !x.active).length, 5);
        assert.ok(state2.choices[0].text.indexOf('p2 / 5') > -1);
        assert.ok(state2.choices[6].text.indexOf('Видно активен по формуле') > -1);
    })
    it(`Jumps on jumpid > 2`, () => {
        const state2 = player.getState()

        player.performJump(state2.choices.filter(x => x.jumpId > 2)[0].jumpId);
        const state3 = player.getState();
        //console.info(JSON.stringify(state3, null, 4));

        // На описании P10
        player.performJump(state3.choices.shift()!.jumpId);
    })
    it(`Next jumps, hideme param show/hide`, () => {
        const state4 = player.getState();
        assert.ok(state4.paramsState[5].indexOf('hideme') < 0);
        //console.info(JSON.stringify(state4, null, 4));
        assert.equal(state4.text, 'Текст на переходе')

        player.performJump(state4.choices.shift()!.jumpId);
        const state5 = player.getState();
        //console.info(JSON.stringify(state5, null, 4));
        assert.ok(state5.paramsState[5].indexOf('hideme') > -1);
    })
    it(`Пустая1`, () => assert.equal(jumpTo('Пустая1').text, 'Пустая1'))

    it(`Пустая 2`, () => {
        const st7 = jumpTo('Пустая 2');
        assert.equal(st7.text, 'Пустая 2 замещенный');
        assert.equal(st7.choices.length, 4);
    })

    it(`Пустой проверка`, () => {
        const save = player.getSaving()
        const st8 = jumpTo('пустой проверка');
        assert.equal(st8.text, 'HangsHere');
        assert.equal(st8.choices.length, 1, 'One choice');
        assert.equal(st8.choices.filter(x => x.active).length, 0, 'Inactive');
        player.loadSaving(save);
    })
    it(`EmptyJumps`, () => {
        jumpTo('EmptyJumps');
        jumpTo('');
        jumpTo('');
        assert.equal(player.getState().text, 'Пустая 2');
    })
    it(`На тест критичных`, () => {
        jumpTo('тест')
        assert.equal(player.getState().text, 'Тест критичных параметров');
    })
    it(`Делаем сохранение`, () => {
        save1 = player.getSaving();
    })

    it(`OnJumpWithoutDescription`, () => {
        jumpTo('OnJumpWithoutDescription');
        assert.equal(player.getState().text, 'CritInJump');
        jumpTo('');
        //console.info(player.getState());
        assert.equal(player.getState().gameState, 'win');
        player.loadSaving(save1);
    })
    // console.info('After load\n\n', player.getState(), 'saved state itself\n\n', save1);

    it(`win`, () => {
        jumpTo('win');
        assert.equal(player.getState().text, 'YouAreWinner');
        jumpTo('')
        assert.equal(player.getState().gameState, 'win');
        player.loadSaving(save1);
    })
    it(`fail`, () => {
        jumpTo('fail');
        assert.equal(player.getState().text, 'You failed');
        assert.equal(player.getState().gameState, 'fail');
        player.loadSaving(save1);
    })
    it(`dead`, () => {
        jumpTo('dead');
        assert.equal(player.getState().text, 'You are dead');
        assert.equal(player.getState().gameState, 'dead');
        player.loadSaving(save1);
    })
    it(`OnJumpWithDescription`, () => {
        jumpTo('OnJumpWithDescription');
        assert.equal(player.getState().text, 'Blablabla');
        //console.info(`State = ${player.getSaving().state}`)
        jumpTo('');
        //console.info(`State = ${player.getSaving().state}`)
        jumpTo('')
        assert.equal(player.getState().gameState, 'win');
        player.loadSaving(save1);
    })
    it(`Спорные и лимит переходов`, () => {
        jumpTo('Спорные');
        jumpTo('2times');
        jumpTo('2times');
        jumpTo('2times');
        jumpTo('2times');
        assert.ok(player.getState().choices.length <= 2);
    })
    it(`Спорные, проверка вероятнотей`, () => {
        let randomJumpCount = 0;
        for (let i = 0; i < 700; i++) {
            // console.info(`i=${i}, f=${((i+2) % 3) + 1} val=${parseInt(player.getState().text)}`);
            assert.equal(((i+2) % 3) + 1, parseInt(player.getState().text), "X1");
            randomJumpCount += player.getState().choices.filter(x => x.text.indexOf('random') > -1).length
            jumpTo('oooo');
            // console.info(`~~~~~~~~~~~~~~~~~~~~~~~~~~ i=${i} f=${((i) % 6) + 3} state=${parseInt(player.getState().text)}`)
            assert.equal(((i) % 6) + 3, parseInt(player.getState().text), "X2");
            jumpTo('back');
        }
        const st10 = player.getState();
        const n4 = parseInt(st10.paramsState[3].replace('<clr>', '').replace('<clrEnd>', ''))
        const n5 = parseInt(st10.paramsState[4].replace('<clr>', '').replace('<clrEnd>', ''))
        const n6 = parseInt(st10.paramsState[5].replace('<clr>', '').replace('<clrEnd>', ''))
        assert.ok(n4 > 50 && n4 < 150);
        assert.ok(n5 > 350 && n5 < 450);
        assert.ok(n6 > 150 && n6 < 250);
        assert.ok(randomJumpCount > 100 && randomJumpCount < 200)
        player.loadSaving(save1);
    })

    it(`LocationCritOnEmpty -> ToLocationWhichSetsCritParam-WithoutDesc`, () => {
        jumpTo('LocationCritOnEmpty');
        jumpTo('ToLocationWhichSetsCritParam-WithoutDesc');
        assert.equal(player.getState().text, 'That location have crit param');
        assert.equal(player.getState().choices.length, 1);
        jumpTo('');
        assert.equal(player.getState().text, 'CritLocationMessage');
        jumpTo('')
        assert.equal(player.getState().gameState, 'win');
        player.loadSaving(save1);
    })

    it(`LocationCritOnEmpty -> ToLocationWhichSetsCritParam-WithDesc`, () => {
        jumpTo('LocationCritOnEmpty');
        jumpTo('ToLocationWhichSetsCritParam-WithDesc');
        assert.equal(player.getState().text, 'Description');
        assert.equal(player.getState().choices.length, 1);
        jumpTo('');
        assert.equal(player.getState().text, 'That location have crit param');
        assert.equal(player.getState().choices.length, 1);
        jumpTo('');
        assert.equal(player.getState().text, 'CritLocationMessage');
        jumpTo('')
        assert.equal(player.getState().gameState, 'win');
        player.loadSaving(save1);
    })

    it(`LocationCritOnEmpty -> ToEmptyLocationWhichSetsCritParam-WithoutDesc`, () => {
        jumpTo('LocationCritOnEmpty');
        // console.info(`State === ` + player.getSaving().state);
        jumpTo('ToEmptyLocationWhichSetsCritParam-WithoutDesc')
        // console.info(`State === ` + player.getSaving().state);;
        assert.equal(player.getState().text, 'CritEmptyLocationMessage');
        jumpTo('')
        assert.equal(player.getState().gameState, 'win');
        player.loadSaving(save1);
    })

    it(`LocationCritOnEmpty -> ToEmptyLocationWhichSetsCritParam-WithDesc`, () => {
        jumpTo('LocationCritOnEmpty');
        jumpTo('ToEmptyLocationWhichSetsCritParam-WithDesc');
        assert.equal(player.getState().text, 'Description');
        assert.equal(player.getState().choices.length, 1);
        jumpTo('');
        jumpTo('')
        assert.equal(player.getState().gameState, 'win');
        player.loadSaving(save1);
    })
})