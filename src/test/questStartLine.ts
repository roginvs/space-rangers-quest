import * as assert from "assert";
import "mocha";
import { getQuestStartLine, QuestStartFlags } from "../lib/questStartLine";

function line(flags: Omit<QuestStartFlags, "lang">, lang: QuestStartFlags["lang"] = "rus") {
  return getQuestStartLine({ ...flags, lang });
}

describe("quest start line", () => {
  it("Photorobot: partial races, two careers, one player race, reputation", () => {
    assert.deepStrictEqual(
      line({ givingRace: 28, planetRace: 8, playerCareer: 5, playerRace: 4, reputationChange: 5 }),
      {
        from: "Люди, Фэяне, Гаальцы",
        to: "Фэяне",
        who: "Торговец, Воин, Человек",
        reputation: "+5 репутации",
      },
    );
  });

  it("omits every player race, every career and zero reputation", () => {
    assert.deepStrictEqual(
      line({ givingRace: 2, planetRace: 4, playerCareer: 7, playerRace: 31, reputationChange: 0 }),
      {
        from: "Пеленги",
        to: "Люди",
        who: "",
        reputation: "",
      },
    );
  });

  it("all givers and all inhabited planets", () => {
    assert.deepStrictEqual(
      line({
        givingRace: 31,
        planetRace: 31,
        playerCareer: 7,
        playerRace: 31,
        reputationChange: 75,
      }),
      {
        from: "Все",
        to: "Все заселённые",
        who: "",
        reputation: "+75 репутации",
      },
    );
  });

  it("keeps a partial career list", () => {
    assert.deepStrictEqual(
      line({
        givingRace: 31,
        planetRace: 31,
        playerCareer: 5,
        playerRace: 31,
        reputationChange: 50,
      }),
      {
        from: "Все",
        to: "Все заселённые",
        who: "Торговец, Воин",
        reputation: "+50 репутации",
      },
    );
  });

  it("planet of every race including uninhabited is Все", () => {
    assert.deepStrictEqual(
      line({
        givingRace: 29,
        planetRace: 95,
        playerCareer: 7,
        playerRace: 20,
        reputationChange: -20,
      }),
      {
        from: "Малоки, Люди, Фэяне, Гаальцы",
        to: "Все",
        who: "Человек, Гаалец",
        reputation: "−20 репутации",
      },
    );
  });

  it("uninhabited planet only", () => {
    assert.deepStrictEqual(
      line({
        givingRace: 28,
        planetRace: 64,
        playerCareer: 7,
        playerRace: 31,
        reputationChange: -100,
      }),
      {
        from: "Люди, Фэяне, Гаальцы",
        to: "Незаселённая",
        who: "",
        reputation: "−100 репутации",
      },
    );
  });
});
