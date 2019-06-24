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

@observer
export class EditorContainer extends React.Component<{
  store: Store;
}> {
  @observable
  store?: EditorStore;

  componentDidMount() {
    const questInfo = this.props.store.index.quests.find(x => x.gameName === "Ministry");
    if (!questInfo) {
      throw new Error("TODO");
    }
    fetch(DATA_DIR + questInfo.filename)
      .then(x => x.arrayBuffer())
      .then(questArrayBuffer => {
        const quest = parse(Buffer.from(pako.ungzip(Buffer.from(questArrayBuffer))));
        this.store = new EditorStore(quest);
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
