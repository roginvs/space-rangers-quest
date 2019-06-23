import * as React from "react";
import { Store } from "../store";
import { QM } from "../../lib/qmreader";
import { observer } from "mobx-react";

@observer
export class Editor extends React.Component<{
  store: Store;
  quest: QM;
}> {
  render() {
    return <div>todo</div>;
  }
}
