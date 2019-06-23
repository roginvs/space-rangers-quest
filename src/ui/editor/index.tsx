import * as React from "react";
import { Store } from "../store";
import { observable } from "mobx";
import { Quest } from "../../lib/qmplayer/funcs";
import { QM, parse } from "../../lib/qmreader";
import pako from "pako";
import { DATA_DIR } from "../consts";
import { Editor } from "./editor";
import { observer } from "mobx-react";

@observer
export class EditorContainer extends React.Component<{
  store: Store;
}> {
  @observable
  quest?: QM;

  componentDidMount() {
    const questInfo = this.props.store.index.quests.find(
      x => x.gameName === "Park"
    );
    if (!questInfo) {
      throw new Error("TODO");
    }
    fetch(DATA_DIR + questInfo.filename)
      .then(x => x.arrayBuffer())
      .then(questArrayBuffer => {
        const quest = parse(
          Buffer.from(pako.ungzip(Buffer.from(questArrayBuffer)))
        ) as QM;
        this.quest = quest;
      })
      .catch(e => {
        console.error("Lol");
      });
  }

  render() {
    if (!this.quest) {
      return <div>Loading</div>;
    }
    return <Editor store={this.props.store} quest={this.quest} />;
  }
}
