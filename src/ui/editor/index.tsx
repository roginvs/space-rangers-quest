import * as React from "react";
import { Quest } from "../../lib/qmplayer/funcs";
import { QM, parse, JumpId } from "../../lib/qmreader";
import pako from "pako";
import { DATA_DIR } from "../consts";
import { EditorCore } from "./core";
import { emptyQmm } from "./core/emptyQmm";

function addSampleJumpsToQuest(quest: QM) {
  // Add some extra data
  const startLoc = quest.locations.find((loc) => loc.isStarting);
  if (!startLoc) {
    throw new Error("No starting location");
  }
  quest.jumps.push({
    img: undefined,
    sound: undefined,
    track: undefined,

    priority: 1,
    dayPassed: false,
    id: 100000 as JumpId,
    fromLocationId: startLoc.id,
    toLocationId: startLoc.id,
    alwaysShow: true,
    jumpingCountLimit: 0,
    showingOrder: 1,

    paramsConditions: [],
    formulaToPass: "",
    text: "test jump",
    description: "description",

    paramsChanges: [],
  });

  const successLoc = quest.locations.find((loc) => loc.isSuccess);
  if (!successLoc) {
    throw new Error("No success location");
  }
  for (const i of [1, 2, 3]) {
    quest.jumps.push({
      img: undefined,
      sound: undefined,
      track: undefined,

      priority: 1,
      dayPassed: false,
      id: (100000 + i) as JumpId,
      fromLocationId: successLoc.id,
      toLocationId: successLoc.id,
      alwaysShow: true,
      jumpingCountLimit: 0,
      showingOrder: 1,

      paramsConditions: [],
      formulaToPass: "",
      text: "test jump",
      description: "description",

      paramsChanges: [],
    });
  }
}

export function EditorContainer() {
  const [quest, setQuest] = React.useState<Quest | null>(null);

  React.useEffect(() => {
    //fetch(DATA_DIR + "qm/Xenolog.qmm.gz")
    fetch(DATA_DIR + "qm/Domoclan.qmm.gz")
      .then((x) => x.arrayBuffer())
      .then((questArrayBuffer) => {
        const quest = parse(Buffer.from(pako.ungzip(Buffer.from(questArrayBuffer))));

        // addSampleJumpsToQuest(quest);

        //setQuest(quest);
      })
      .catch((e) => {
        console.error("Lol");
      });
  }, []);

  React.useEffect(() => {
    const quest = parse(emptyQmm);
    console.info(quest);
    setQuest(quest);
  }, []);

  if (!quest) {
    return <div>Loading</div>;
  }

  return <EditorCore quest={quest} onChange={setQuest} />;
}
