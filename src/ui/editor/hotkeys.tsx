import * as React from "react";
import { EditorStore } from "./store";

export class Hotkeys extends React.Component<{
  store: EditorStore;
}> {
  onKeyPress = (e: KeyboardEvent) => {
    const store = this.props.store;
    if (e.key === "1") {
      store.mode = "select";
    } else if (e.key === "2") {
      store.mode = "move";
    } else if (e.key === "3") {
      store.mode = "newLocation";
    } else if (e.key === "4") {
      store.mode = "newJump";
    }
  };
  componentDidMount() {
    document.addEventListener("keypress", this.onKeyPress);
  }
  componentWillUnmount() {
    document.removeEventListener("keypress", this.onKeyPress);
  }
  render() {
    return null;
  }
}
