"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var qmreader_1 = require("../lib/qmreader");
var fs = __importStar(require("fs"));
var assert = __importStar(require("assert"));
require("mocha");
var _loop_1 = function (ext) {
    describe("Player on qmreader-1." + ext, function () {
        var qm;
        before(function () {
            var data = fs.readFileSync(__dirname + ("/../../src/test/qmreader-1." + ext));
            qm = qmreader_1.parse(data);
        });
        it('Basic values', function () {
            assert.equal(qm.hardness, 68);
            assert.equal(qm.taskText, 'TaskText');
            assert.equal(qm.successText, 'SuccessText');
            assert.equal(qm.strings.Ranger, 'R');
            assert.equal(qm.strings.ToPlanet, 'TP');
            assert.equal(qm.strings.ToStar, 'TS');
            assert.equal(qm.strings.FromPlanet, 'FP');
            assert.equal(qm.strings.FromStar, 'FS');
            assert.equal(qm.defaultJumpCountLimit, 34);
        });
        describe('Param definitions', function () {
            it('param1', function () {
                assert.ok(qm.params[0].active);
                assert.equal(qm.params[0].name, 'param1');
                assert.equal(qm.params[0].type, qmreader_1.ParamType.Обычный);
                assert.equal(qm.params[0].showWhenZero, true);
                assert.equal(qm.params[0].min, 0);
                assert.equal(qm.params[0].max, 1);
                assert.equal(qm.params[0].isMoney, false);
            });
            it('param2', function () {
                var param = qm.params[1];
                assert.ok(param.active);
                assert.equal(param.name, 'param2success');
                assert.equal(param.type, qmreader_1.ParamType.Успешный);
                assert.equal(param.critType, qmreader_1.ParamCritType.Минимум);
                assert.equal(param.critValueString, 'def_param2_msg');
                if (ext === 'qmm') {
                    assert.equal(param.img, 'p2img');
                    assert.equal(param.track, 'p2track');
                    assert.equal(param.sound, 'p2sound');
                }
                else {
                    assert.strictEqual(param.img, undefined);
                    assert.strictEqual(param.track, undefined);
                    assert.strictEqual(param.sound, undefined);
                }
            });
            it('param3', function () {
                var param = qm.params[2];
                assert.ok(param.active);
                assert.equal(param.name, 'param3fail');
                assert.equal(param.type, qmreader_1.ParamType.Провальный);
                assert.equal(param.critType, qmreader_1.ParamCritType.Максимум);
                assert.equal(param.critValueString, 'p3_def_msg');
                if (ext === 'qmm') {
                    assert.equal(param.img, 'p3img');
                    assert.equal(param.track, 'p3track');
                    assert.equal(param.sound, 'p3sound');
                }
                else {
                    assert.strictEqual(param.img, undefined);
                    assert.strictEqual(param.track, undefined);
                    assert.strictEqual(param.sound, undefined);
                }
            });
            it('param4', function () {
                var param = qm.params[3];
                assert.ok(param.active);
                assert.equal(param.name, 'param4dead');
                assert.equal(param.type, qmreader_1.ParamType.Смертельный);
            });
            it('param5', function () {
                var param = qm.params[4];
                assert.ok(param.active);
                assert.equal(param.name, 'param5hidezero');
                assert.equal(param.showWhenZero, false);
            });
            it('param6startingval', function () {
                var param = qm.params[5];
                assert.ok(param.active);
                assert.equal(param.name, 'param6startingval');
                assert.equal(param.min, 40);
                assert.equal(param.max, 60);
                assert.equal(param.starting, '[41]');
            });
            it('param7showingranges', function () {
                var param = qm.params[6];
                assert.ok(param.active);
                assert.equal(param.name, 'param7showingranges');
                assert.equal(param.showingRangesCount, 3);
                assert.equal(param.showingInfo.length, 3);
                assert.equal(param.showingInfo[0].from, 0);
                assert.equal(param.showingInfo[0].to, 2);
                assert.equal(param.showingInfo[0].str, 'range1 <>');
                assert.equal(param.showingInfo[1].from, 3);
                assert.equal(param.showingInfo[1].to, 5);
                assert.equal(param.showingInfo[1].str, 'range2 <>');
                assert.equal(param.showingInfo[2].from, 6);
                assert.equal(param.showingInfo[2].to, 10);
                assert.equal(param.showingInfo[2].str, 'range3 <>');
            });
            it('param8money', function () {
                var param = qm.params[7];
                assert.ok(param.active);
                assert.equal(param.name, 'param8money');
                assert.equal(param.isMoney, true);
            });
            describe('Locations', function () {
                it('Starting loc id=2', function () {
                    var loc = qm.locations.find(function (x) { return x.id === 2; });
                    assert.equal(loc.texts[0], 'loc2start');
                    assert.ok(loc.isStarting);
                    assert.equal(loc.maxVisits, 0);
                });
                it('Text and sounds', function () {
                    var loc = qm.locations.find(function (x) { return x.id === 1; });
                    if (!loc) {
                        throw new Error('Location not found!');
                    }
                    assert.ok(!loc.isStarting);
                    if (ext === 'qmm') {
                        assert.equal(loc.texts.length, 3);
                        assert.equal(loc.media.length, 3);
                    }
                    else {
                        assert.equal(loc.texts.length, 10);
                        assert.equal(loc.media.length, 10);
                    }
                    for (var i = 0; i < 3; i++) {
                        assert.equal(loc.texts[i], "loc1text" + (i + 1));
                        if (ext === 'qmm') {
                            assert.equal(loc.media[i].img, "loc1text" + (i + 1) + "img");
                            assert.equal(loc.media[i].track, "loc1text" + (i + 1) + "track");
                            assert.equal(loc.media[i].sound, "loc1text" + (i + 1) + "sound");
                        }
                        else {
                            assert.strictEqual(loc.media[i].img, undefined);
                            assert.strictEqual(loc.media[i].track, undefined);
                            assert.strictEqual(loc.media[i].sound, undefined);
                        }
                    }
                    assert.equal(loc.isTextByFormula, false);
                });
                it('Text and sounds by formula', function () {
                    var loc = qm.locations.find(function (x) { return x.id === 3; });
                    if (!loc) {
                        throw new Error('Location not found!');
                    }
                    assert.equal(loc.isTextByFormula, true);
                    assert.equal(loc.textSelectFurmula, '[p1]+1');
                });
                it('Empty loc', function () {
                    assert.ok(qm.locations.find(function (x) { return x.id === 5; }).isEmpty);
                });
                it('Success loc', function () {
                    assert.ok(qm.locations.find(function (x) { return x.id === 6; }).isSuccess);
                });
                it('Fail loc', function () {
                    assert.ok(qm.locations.find(function (x) { return x.id === 7; }).isFaily);
                });
                it('Dead loc', function () {
                    assert.ok(qm.locations.find(function (x) { return x.id === 8; }).isFailyDeadly);
                });
                it('Daypassed loc', function () {
                    assert.ok(qm.locations.find(function (x) { return x.id === 9; }).dayPassed);
                });
                it('Visit limit loc id=10', function () {
                    assert.equal(qm.locations.find(function (x) { return x.id === 10; }).maxVisits, ext === 'qmm' ? 78 : 0);
                });
                it('Visit limit loc id=5', function () {
                    assert.equal(qm.locations.find(function (x) { return x.id === 5; }).maxVisits, ext === 'qmm' ? 312 : 0);
                });
                describe('Location param change', function () {
                    var loc;
                    before(function () {
                        var loc4 = qm.locations.find(function (x) { return x.id === 4; });
                        if (!loc4) {
                            throw new Error('Location id=4 not found');
                        }
                        loc = loc4;
                    });
                    it('param1 no change', function () {
                        var param = loc.paramsChanges[0];
                        assert.equal(param.change, 0);
                        assert.equal(param.isChangeFormula, false);
                        assert.equal(param.isChangePercentage, false);
                        assert.equal(param.isChangeValue, false);
                        assert.equal(param.showingType, qmreader_1.ParameterShowingType.НеТрогать);
                    });
                    it('param2 changes', function () {
                        var param = loc.paramsChanges[1];
                        assert.equal(param.change, -1);
                        assert.equal(param.isChangeFormula, false);
                        assert.equal(param.isChangePercentage, false);
                        assert.equal(param.isChangeValue, false);
                        assert.equal(param.showingType, qmreader_1.ParameterShowingType.Скрыть);
                        assert.equal(param.critText, 'l4_param2_msg');
                        if (ext === 'qmm') {
                            assert.equal(param.img, 'l4p2img');
                            assert.equal(param.sound, 'l4p2sound');
                            assert.equal(param.track, 'l4p2track');
                        }
                        else {
                            assert.strictEqual(param.img, undefined);
                            assert.strictEqual(param.track, undefined);
                            assert.strictEqual(param.sound, undefined);
                        }
                    });
                    it('param3 changes', function () {
                        var param = loc.paramsChanges[2];
                        assert.equal(param.change, 44);
                        assert.equal(param.isChangeFormula, false);
                        assert.equal(param.isChangePercentage, true);
                        assert.equal(param.isChangeValue, false);
                        assert.equal(param.showingType, qmreader_1.ParameterShowingType.Показать);
                        assert.equal(param.critText, 'l4_p3_msg');
                    });
                    it('param6 changes', function () {
                        var param = loc.paramsChanges[5];
                        assert.equal(param.change, 53);
                        assert.equal(param.isChangeFormula, false);
                        assert.equal(param.isChangePercentage, false);
                        assert.equal(param.isChangeValue, true);
                    });
                    it('param7 changes', function () {
                        var param = loc.paramsChanges[6];
                        assert.equal(param.changingFormula, '[p3]-[p1]');
                        assert.equal(param.isChangeFormula, true);
                        assert.equal(param.isChangePercentage, false);
                        assert.equal(param.isChangeValue, false);
                    });
                });
            });
            describe('Jumps', function () {
                it('Jump id=2', function () {
                    var jump = qm.jumps.find(function (x) { return x.id === 2; });
                    if (!jump) {
                        throw new Error("Jump not found");
                    }
                    assert.equal(jump.text, 'J2text');
                    assert.ok(!jump.description);
                    assert.equal(jump.fromLocationId, 2);
                    assert.equal(jump.toLocationId, 1);
                    assert.ok(!jump.formulaToPass);
                    assert.equal(jump.dayPassed, false);
                    assert.equal(jump.alwaysShow, false);
                    assert.equal(jump.jumpingCountLimit, 0);
                    assert.ok(Math.abs(jump.prio - 1) < 0.000001, "Jump prio");
                    assert.equal(jump.showingOrder, 4);
                });
                it('Jump id=3', function () {
                    var jump = qm.jumps.find(function (x) { return x.id === 3; });
                    if (!jump) {
                        throw new Error("Jump not found");
                    }
                    assert.equal(jump.text, 'J3text');
                    assert.equal(jump.description, 'J3desciption');
                    assert.equal(jump.fromLocationId, 7);
                    assert.equal(jump.toLocationId, 9);
                    assert.equal(jump.formulaToPass, '[p4]*[p2]');
                    if (ext === 'qmm') {
                        assert.equal(jump.img, 'j3_img');
                        assert.equal(jump.track, 'j3_track');
                        assert.equal(jump.sound, 'j3_sound');
                    }
                    else {
                        assert.strictEqual(jump.img, undefined);
                        assert.strictEqual(jump.track, undefined);
                        assert.strictEqual(jump.sound, undefined);
                    }
                    assert.equal(jump.dayPassed, true);
                    assert.equal(jump.alwaysShow, false);
                    assert.equal(jump.jumpingCountLimit, 34);
                    assert.ok(Math.abs(jump.prio - 1.5) < 0.000001, "Jump prio");
                    assert.equal(jump.showingOrder, 5);
                });
                it('Jump id=4', function () {
                    var jump = qm.jumps.find(function (x) { return x.id === 4; });
                    if (!jump) {
                        throw new Error("Jump not found");
                    }
                    assert.equal(jump.text, 'alwaysShow');
                    assert.equal(jump.alwaysShow, true);
                    assert.equal(jump.jumpingCountLimit, 78);
                    assert.ok(Math.abs(jump.prio - 0.2) < 0.000001, "Jump prio");
                    assert.equal(jump.showingOrder, 9);
                });
                describe('Jump params requirenments at jump5', function () {
                    var jump;
                    before(function () {
                        var jump5 = qm.jumps.find(function (x) { return x.id === 5; });
                        if (!jump5) {
                            throw new Error("Jump not found");
                        }
                        jump = jump5;
                    });
                    it('Param 6 fullrange permit', function () {
                        var param = jump.paramsConditions[5];
                        assert.equal(param.mustFrom, qm.params[5].min);
                        assert.equal(param.mustTo, qm.params[5].max);
                        assert.equal(param.mustEqualValues.length, 0);
                        assert.equal(param.mustModValues.length, 0);
                    });
                    it('Param 9 min and max only', function () {
                        var param = jump.paramsConditions[8];
                        assert.equal(param.mustFrom, 77);
                        assert.equal(param.mustTo, 222);
                        assert.equal(param.mustEqualValues.length, 0);
                        assert.equal(param.mustModValues.length, 0);
                    });
                    it('Param 10 values list', function () {
                        var param = jump.paramsConditions[9];
                        assert.deepEqual(param.mustEqualValues, [56, 58, 81]);
                        assert.equal(param.mustEqualValuesEqual, true);
                    });
                    it('Param 11 values list', function () {
                        var param = jump.paramsConditions[10];
                        assert.deepEqual(param.mustEqualValues, [66, 69]);
                        assert.equal(param.mustEqualValuesEqual, false);
                    });
                    it('Param 12 values list', function () {
                        var param = jump.paramsConditions[11];
                        assert.deepEqual(param.mustModValues, [44]);
                        assert.equal(param.mustModValuesMod, true);
                    });
                    it('Param 13 values list', function () {
                        var param = jump.paramsConditions[12];
                        assert.deepEqual(param.mustModValues, [45, 46]);
                        assert.equal(param.mustModValuesMod, false);
                    });
                });
                describe('Jump params change at jump6', function () {
                    var jump;
                    before(function () {
                        var jump6 = qm.jumps.find(function (x) { return x.id === 6; });
                        if (!jump6) {
                            throw new Error("Jump not found");
                        }
                        jump = jump6;
                    });
                    it('Param 6', function () {
                        var param = jump.paramsChanges[5];
                        assert.equal(param.showingType, qmreader_1.ParameterShowingType.НеТрогать);
                        assert.equal(param.change, 0);
                        assert.equal(param.isChangeValue, false);
                        assert.equal(param.isChangePercentage, false);
                        assert.equal(param.isChangeFormula, false);
                    });
                    it('Param 9', function () {
                        var param = jump.paramsChanges[8];
                        assert.equal(param.showingType, qmreader_1.ParameterShowingType.Скрыть);
                        assert.equal(param.change, -46);
                        assert.equal(param.isChangeValue, false);
                        assert.equal(param.isChangePercentage, true);
                        assert.equal(param.isChangeFormula, false);
                    });
                    it('Param 10', function () {
                        var param = jump.paramsChanges[9];
                        assert.equal(param.showingType, qmreader_1.ParameterShowingType.Показать);
                        assert.equal(param.change, 48);
                        assert.equal(param.isChangeValue, true);
                        assert.equal(param.isChangePercentage, false);
                        assert.equal(param.isChangeFormula, false);
                    });
                    it('Param 11', function () {
                        var param = jump.paramsChanges[10];
                        assert.equal(param.showingType, qmreader_1.ParameterShowingType.НеТрогать);
                        // assert.equal(param.change, 0);
                        assert.equal(param.isChangeValue, false);
                        assert.equal(param.isChangePercentage, false);
                        assert.equal(param.isChangeFormula, true);
                        assert.equal(param.changingFormula, '[p10]-[p4]+[p2]');
                    });
                    it('Param 12', function () {
                        var param = jump.paramsChanges[11];
                        assert.equal(param.showingType, qmreader_1.ParameterShowingType.НеТрогать);
                        assert.equal(param.change, 27);
                        assert.equal(param.isChangeValue, false);
                        assert.equal(param.isChangePercentage, false);
                        assert.equal(param.isChangeFormula, false);
                    });
                    it('Param 3 crits', function () {
                        var param = jump.paramsChanges[2];
                        assert.equal(param.critText, 'j6_p3_fail_msg');
                        if (ext === 'qmm') {
                            assert.equal(param.img, 'j6p3img');
                            assert.equal(param.track, 'j6p3track');
                            assert.equal(param.sound, 'j6p3sound');
                        }
                        else {
                            assert.strictEqual(param.img, undefined);
                            assert.strictEqual(param.track, undefined);
                            assert.strictEqual(param.sound, undefined);
                        }
                    });
                });
            });
        });
    });
};
for (var _i = 0, _a = ['qm', 'qmm']; _i < _a.length; _i++) {
    var ext = _a[_i];
    _loop_1(ext);
}
