import {
  parse,
  QM,
  ParamType,
  ParamCritType,
  Location,
  Jump,
  ParameterShowingType,
} from "../lib/qmreader";

import * as fs from "fs";
import * as assert from "assert";
import "mocha";

for (const ext of ["qm", "qmm"] as ("qm" | "qmm")[]) {
  describe(`Player on qmreader-1.${ext}`, function () {
    let qm: QM;
    before(() => {
      const data = fs.readFileSync(__dirname + `/../../src/test/qmreader-1.${ext}`);
      qm = parse(data);
    });

    it("Basic values", () => {
      assert.strictEqual(qm.hardness, 68);
      assert.strictEqual(qm.taskText, "TaskText");
      assert.strictEqual(qm.successText, "SuccessText");

      assert.strictEqual(qm.strings.Ranger, "R");
      assert.strictEqual(qm.strings.ToPlanet, "TP");
      assert.strictEqual(qm.strings.ToStar, "TS");
      assert.strictEqual(qm.strings.FromPlanet, "FP");
      assert.strictEqual(qm.strings.FromStar, "FS");

      assert.strictEqual(qm.defaultJumpCountLimit, 34);
    });
    describe("Param definitions", () => {
      it("param1", () => {
        assert.ok(qm.params[0].active);
        assert.strictEqual(qm.params[0].name, "param1");
        assert.strictEqual(qm.params[0].type, ParamType.Обычный);
        assert.strictEqual(qm.params[0].showWhenZero, true);
        assert.strictEqual(qm.params[0].min, 0);
        assert.strictEqual(qm.params[0].max, 1);
        assert.strictEqual(qm.params[0].isMoney, false);
      });

      it("param2", () => {
        const param = qm.params[1];
        assert.ok(param.active);
        assert.strictEqual(param.name, "param2success");
        assert.strictEqual(param.type, ParamType.Успешный);
        assert.strictEqual(param.critType, ParamCritType.Минимум);
        assert.strictEqual(param.critValueString, "def_param2_msg");
        if (ext === "qmm") {
          assert.strictEqual(param.img, "p2img");
          assert.strictEqual(param.track, "p2track");
          assert.strictEqual(param.sound, "p2sound");
        } else {
          assert.strictEqual(param.img, undefined);
          assert.strictEqual(param.track, undefined);
          assert.strictEqual(param.sound, undefined);
        }
      });

      it("param3", () => {
        const param = qm.params[2];
        assert.ok(param.active);
        assert.strictEqual(param.name, "param3fail");
        assert.strictEqual(param.type, ParamType.Провальный);
        assert.strictEqual(param.critType, ParamCritType.Максимум);
        assert.strictEqual(param.critValueString, "p3_def_msg");
        if (ext === "qmm") {
          assert.strictEqual(param.img, "p3img");
          assert.strictEqual(param.track, "p3track");
          assert.strictEqual(param.sound, "p3sound");
        } else {
          assert.strictEqual(param.img, undefined);
          assert.strictEqual(param.track, undefined);
          assert.strictEqual(param.sound, undefined);
        }
      });

      it("param4", () => {
        const param = qm.params[3];
        assert.ok(param.active);
        assert.strictEqual(param.name, "param4dead");
        assert.strictEqual(param.type, ParamType.Смертельный);
      });

      it("param5", () => {
        const param = qm.params[4];
        assert.ok(param.active);
        assert.strictEqual(param.name, "param5hidezero");
        assert.strictEqual(param.showWhenZero, false);
      });

      it("param6startingval", () => {
        const param = qm.params[5];
        assert.ok(param.active);
        assert.strictEqual(param.name, "param6startingval");
        assert.strictEqual(param.min, 40);
        assert.strictEqual(param.max, 60);
        assert.strictEqual(param.starting, "[41]");
      });
      it("param7showingranges", () => {
        const param = qm.params[6];
        assert.ok(param.active);
        assert.strictEqual(param.name, "param7showingranges");

        // assert.strictEqual(param.showingRangesCount, 3);
        assert.strictEqual(param.showingInfo.length, 3);

        assert.strictEqual(param.showingInfo[0].from, 0);
        assert.strictEqual(param.showingInfo[0].to, 2);
        assert.strictEqual(param.showingInfo[0].str, "range1 <>");

        assert.strictEqual(param.showingInfo[1].from, 3);
        assert.strictEqual(param.showingInfo[1].to, 5);
        assert.strictEqual(param.showingInfo[1].str, "range2 <>");

        assert.strictEqual(param.showingInfo[2].from, 6);
        assert.strictEqual(param.showingInfo[2].to, 10);
        assert.strictEqual(param.showingInfo[2].str, "range3 <>");
      });

      it("param8money", () => {
        const param = qm.params[7];
        assert.ok(param.active);
        assert.strictEqual(param.name, "param8money");
        assert.strictEqual(param.isMoney, true);
      });

      describe("Locations", () => {
        it("Starting loc id=2", () => {
          const loc = qm.locations.find((x) => x.id === 2);
          assert.strictEqual(loc!.texts[0], "loc2start");
          assert.ok(loc!.isStarting);
          assert.strictEqual(loc!.maxVisits, 0);
        });

        it("Text and sounds", () => {
          const loc = qm.locations.find((x) => x.id === 1);
          if (!loc) {
            throw new Error("Location not found!");
          }
          assert.ok(!loc.isStarting);
          if (ext === "qmm") {
            assert.strictEqual(loc.texts.length, 3);
            assert.strictEqual(loc.media.length, 3);
          } else {
            assert.strictEqual(loc.texts.length, 10);
            assert.strictEqual(loc.media.length, 10);
          }
          for (let i = 0; i < 3; i++) {
            assert.strictEqual(loc.texts[i], `loc1text${i + 1}`);
            if (ext === "qmm") {
              assert.strictEqual(loc.media[i].img, `loc1text${i + 1}img`);
              assert.strictEqual(loc.media[i].track, `loc1text${i + 1}track`);
              assert.strictEqual(loc.media[i].sound, `loc1text${i + 1}sound`);
            } else {
              assert.strictEqual(loc.media[i].img, undefined);
              assert.strictEqual(loc.media[i].track, undefined);
              assert.strictEqual(loc.media[i].sound, undefined);
            }
          }
          assert.strictEqual(loc.isTextByFormula, false);
        });
        it("Text and sounds by formula", () => {
          const loc = qm.locations.find((x) => x.id === 3);
          if (!loc) {
            throw new Error("Location not found!");
          }
          assert.strictEqual(loc.isTextByFormula, true);
          assert.strictEqual(loc.textSelectFormula, "[p1]+1");
        });

        it("Empty loc", () => {
          assert.ok(qm.locations.find((x) => x.id === 5)!.isEmpty);
        });
        it("Success loc", () => {
          assert.ok(qm.locations.find((x) => x.id === 6)!.isSuccess);
        });
        it("Fail loc", () => {
          assert.ok(qm.locations.find((x) => x.id === 7)!.isFaily);
        });
        it("Dead loc", () => {
          assert.ok(qm.locations.find((x) => x.id === 8)!.isFailyDeadly);
        });
        it("Daypassed loc", () => {
          assert.ok(qm.locations.find((x) => x.id === 9)!.dayPassed);
        });
        it("Visit limit loc id=10", () => {
          assert.strictEqual(
            qm.locations.find((x) => x.id === 10)!.maxVisits,
            ext === "qmm" ? 78 : 0,
          );
        });
        it("Visit limit loc id=5", () => {
          assert.strictEqual(
            qm.locations.find((x) => x.id === 5)!.maxVisits,
            ext === "qmm" ? 312 : 0,
          );
        });

        describe("Location param change", () => {
          let loc: Location;
          before(() => {
            const loc4 = qm.locations.find((x) => x.id === 4);
            if (!loc4) {
              throw new Error("Location id=4 not found");
            }
            loc = loc4;
          });
          it("param1 no change", () => {
            const param = loc.paramsChanges[0];
            assert.strictEqual(param.change, 0);
            assert.strictEqual(param.isChangeFormula, false);
            assert.strictEqual(param.isChangePercentage, false);
            assert.strictEqual(param.isChangeValue, false);
            assert.strictEqual(param.showingType, ParameterShowingType.НеТрогать);
          });
          it("param2 changes", () => {
            const param = loc.paramsChanges[1];
            assert.strictEqual(param.change, -1);
            assert.strictEqual(param.isChangeFormula, false);
            assert.strictEqual(param.isChangePercentage, false);
            assert.strictEqual(param.isChangeValue, false);
            assert.strictEqual(param.showingType, ParameterShowingType.Скрыть);
            assert.strictEqual(param.critText, "l4_param2_msg");
            if (ext === "qmm") {
              assert.strictEqual(param.img, "l4p2img");
              assert.strictEqual(param.sound, "l4p2sound");
              assert.strictEqual(param.track, "l4p2track");
            } else {
              assert.strictEqual(param.img, undefined);
              assert.strictEqual(param.track, undefined);
              assert.strictEqual(param.sound, undefined);
            }
          });
          it("param3 changes", () => {
            const param = loc.paramsChanges[2];
            assert.strictEqual(param.change, 44);
            assert.strictEqual(param.isChangeFormula, false);
            assert.strictEqual(param.isChangePercentage, true);
            assert.strictEqual(param.isChangeValue, false);
            assert.strictEqual(param.showingType, ParameterShowingType.Показать);
            assert.strictEqual(param.critText, "l4_p3_msg");
          });
          it("param6 changes", () => {
            const param = loc.paramsChanges[5];
            assert.strictEqual(param.change, 53);
            assert.strictEqual(param.isChangeFormula, false);
            assert.strictEqual(param.isChangePercentage, false);
            assert.strictEqual(param.isChangeValue, true);
          });
          it("param7 changes", () => {
            const param = loc.paramsChanges[6];
            assert.strictEqual(param.changingFormula, "[p3]-[p1]");
            assert.strictEqual(param.isChangeFormula, true);
            assert.strictEqual(param.isChangePercentage, false);
            assert.strictEqual(param.isChangeValue, false);
          });
        });
      });
      describe("Jumps", () => {
        it("Jump id=2", () => {
          const jump = qm.jumps.find((x) => x.id === 2);
          if (!jump) {
            throw new Error(`Jump not found`);
          }
          assert.strictEqual(jump.text, "J2text");
          assert.ok(!jump.description);
          assert.strictEqual(jump.fromLocationId, 2);
          assert.strictEqual(jump.toLocationId, 1);
          assert.ok(!jump.formulaToPass);
          assert.strictEqual(jump.dayPassed, false);
          assert.strictEqual(jump.alwaysShow, false);
          assert.strictEqual(jump.jumpingCountLimit, 0);
          assert.ok(Math.abs(jump.priority - 1) < 0.000001, `Jump prio`);
          assert.strictEqual(jump.showingOrder, 4);
        });
        it("Jump id=3", () => {
          const jump = qm.jumps.find((x) => x.id === 3);
          if (!jump) {
            throw new Error(`Jump not found`);
          }
          assert.strictEqual(jump.text, "J3text");
          assert.strictEqual(jump.description, "J3desciption");
          assert.strictEqual(jump.fromLocationId, 7);
          assert.strictEqual(jump.toLocationId, 9);
          assert.strictEqual(jump.formulaToPass, "[p4]*[p2]");
          if (ext === "qmm") {
            assert.strictEqual(jump.img, "j3_img");
            assert.strictEqual(jump.track, "j3_track");
            assert.strictEqual(jump.sound, "j3_sound");
          } else {
            assert.strictEqual(jump.img, undefined);
            assert.strictEqual(jump.track, undefined);
            assert.strictEqual(jump.sound, undefined);
          }
          assert.strictEqual(jump.dayPassed, true);
          assert.strictEqual(jump.alwaysShow, false);
          assert.strictEqual(jump.jumpingCountLimit, 34);
          assert.ok(Math.abs(jump.priority - 1.5) < 0.000001, `Jump prio`);
          assert.strictEqual(jump.showingOrder, 5);
        });
        it("Jump id=4", () => {
          const jump = qm.jumps.find((x) => x.id === 4);
          if (!jump) {
            throw new Error(`Jump not found`);
          }
          assert.strictEqual(jump.text, "alwaysShow");
          assert.strictEqual(jump.alwaysShow, true);
          assert.strictEqual(jump.jumpingCountLimit, 78);
          assert.ok(Math.abs(jump.priority - 0.2) < 0.000001, `Jump prio`);
          assert.strictEqual(jump.showingOrder, 9);
        });

        describe("Jump params requirenments at jump5", () => {
          let jump: Jump;
          before(() => {
            const jump5 = qm.jumps.find((x) => x.id === 5);
            if (!jump5) {
              throw new Error(`Jump not found`);
            }
            jump = jump5;
          });
          it("Param 6 fullrange permit", () => {
            const param = jump.paramsConditions[5];
            assert.strictEqual(param.mustFrom, qm.params[5].min);
            assert.strictEqual(param.mustTo, qm.params[5].max);
            assert.strictEqual(param.mustEqualValues.length, 0);
            assert.strictEqual(param.mustModValues.length, 0);
          });

          it("Param 9 min and max only", () => {
            const param = jump.paramsConditions[8];
            assert.strictEqual(param.mustFrom, 77);
            assert.strictEqual(param.mustTo, 222);
            assert.strictEqual(param.mustEqualValues.length, 0);
            assert.strictEqual(param.mustModValues.length, 0);
          });
          it("Param 10 values list", () => {
            const param = jump.paramsConditions[9];
            assert.deepStrictEqual(param.mustEqualValues, [56, 58, 81]);
            assert.strictEqual(param.mustEqualValuesEqual, true);
          });
          it("Param 11 values list", () => {
            const param = jump.paramsConditions[10];
            assert.deepStrictEqual(param.mustEqualValues, [66, 69]);
            assert.strictEqual(param.mustEqualValuesEqual, false);
          });
          it("Param 12 values list", () => {
            const param = jump.paramsConditions[11];
            assert.deepStrictEqual(param.mustModValues, [44]);
            assert.strictEqual(param.mustModValuesMod, true);
          });
          it("Param 13 values list", () => {
            const param = jump.paramsConditions[12];
            assert.deepStrictEqual(param.mustModValues, [45, 46]);
            assert.strictEqual(param.mustModValuesMod, false);
          });
        });

        describe("Jump params change at jump6", () => {
          let jump: Jump;
          before(() => {
            const jump6 = qm.jumps.find((x) => x.id === 6);
            if (!jump6) {
              throw new Error(`Jump not found`);
            }
            jump = jump6;
          });
          it("Param 6", () => {
            const param = jump.paramsChanges[5];
            assert.strictEqual(param.showingType, ParameterShowingType.НеТрогать);
            assert.strictEqual(param.change, 0);
            assert.strictEqual(param.isChangeValue, false);
            assert.strictEqual(param.isChangePercentage, false);
            assert.strictEqual(param.isChangeFormula, false);
          });
          it("Param 9", () => {
            const param = jump.paramsChanges[8];
            assert.strictEqual(param.showingType, ParameterShowingType.Скрыть);
            assert.strictEqual(param.change, -46);
            assert.strictEqual(param.isChangeValue, false);
            assert.strictEqual(param.isChangePercentage, true);
            assert.strictEqual(param.isChangeFormula, false);
          });
          it("Param 10", () => {
            const param = jump.paramsChanges[9];
            assert.strictEqual(param.showingType, ParameterShowingType.Показать);
            assert.strictEqual(param.change, 48);
            assert.strictEqual(param.isChangeValue, true);
            assert.strictEqual(param.isChangePercentage, false);
            assert.strictEqual(param.isChangeFormula, false);
          });
          it("Param 11", () => {
            const param = jump.paramsChanges[10];
            assert.strictEqual(param.showingType, ParameterShowingType.НеТрогать);
            // assert.strictEqual(param.change, 0);
            assert.strictEqual(param.isChangeValue, false);
            assert.strictEqual(param.isChangePercentage, false);
            assert.strictEqual(param.isChangeFormula, true);
            assert.strictEqual(param.changingFormula, "[p10]-[p4]+[p2]");
          });
          it("Param 12", () => {
            const param = jump.paramsChanges[11];
            assert.strictEqual(param.showingType, ParameterShowingType.НеТрогать);
            assert.strictEqual(param.change, 27);
            assert.strictEqual(param.isChangeValue, false);
            assert.strictEqual(param.isChangePercentage, false);
            assert.strictEqual(param.isChangeFormula, false);
          });

          it("Param 3 crits", () => {
            const param = jump.paramsChanges[2];
            assert.strictEqual(param.critText, "j6_p3_fail_msg");
            if (ext === "qmm") {
              assert.strictEqual(param.img, "j6p3img");
              assert.strictEqual(param.track, "j6p3track");
              assert.strictEqual(param.sound, "j6p3sound");
            } else {
              assert.strictEqual(param.img, undefined);
              assert.strictEqual(param.track, undefined);
              assert.strictEqual(param.sound, undefined);
            }
          });
        });
      });
    });
  });
}
