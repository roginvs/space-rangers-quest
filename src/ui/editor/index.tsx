import * as React from "react";
import { Store } from "../store";
import { observable } from "mobx";
import { Quest } from "../../lib/qmplayer/funcs";
import { QM, parse } from "../../lib/qmreader";
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

export function EditorContainer() {
  const [quest, setQuest] = React.useState<Quest | null>(null);

  React.useEffect(() => {
    fetch(DATA_DIR + "qm/Xenolog.qmm.gz")
      .then(x => x.arrayBuffer())
      .then(questArrayBuffer => {
        const quest = parse(Buffer.from(pako.ungzip(Buffer.from(questArrayBuffer))));
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
