import * as React from "react";
import { Store } from "../store";
import { observable } from "mobx";
import { Quest } from "../../lib/qmplayer/funcs";
import { QM, parse, JumpId } from "../../lib/qmreader";
import pako from "pako";
import { DATA_DIR } from "../consts";
import { Editor } from "./editor";
import { observer } from "mobx-react";
import { EditorStore } from "./store";
import { EditorCore } from "./core";

//import { hot } from "react-hot-loader/root";
@observer
export class EditorContainerOld extends React.Component<{
  store: Store;
}> {
  @observable
  store?: EditorStore;

  componentDidMount() {
    const questInfo = this.props.store.index.quests.find(x => x.gameName === "Xenolog");
    if (!questInfo) {
      throw new Error("TODO");
    }
    fetch(DATA_DIR + questInfo.filename)
      .then(x => x.arrayBuffer())
      .then(questArrayBuffer => {
        const quest = parse(Buffer.from(pako.ungzip(Buffer.from(questArrayBuffer))));
        const store = new EditorStore(quest);
        (window as any).es = store;
        this.store = store;
      })
      .catch(e => {
        console.error("Lol");
      });
  }

  render() {
    if (!this.store) {
      return <div>Loading</div>;
    }
    return <Editor store={this.store} />;
  }
}

function addSampleJumpsToQuest(quest: QM) {
  // Add some extra data
  const startLoc = quest.locations.find(loc => loc.isStarting);
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

  const successLoc = quest.locations.find(loc => loc.isSuccess);
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
    fetch(DATA_DIR + "qm/Xenolog.qmm.gz")
      .then(x => x.arrayBuffer())
      .then(questArrayBuffer => {
        const quest = parse(Buffer.from(pako.ungzip(Buffer.from(questArrayBuffer))));

        addSampleJumpsToQuest(quest);

        setQuest(quest);
      })
      .catch(e => {
        console.error("Lol");
      });
  }, []);

  if (!quest) {
    return <div>Loading</div>;
  }

  return <EditorCore quest={quest} onChange={setQuest} />;
}
