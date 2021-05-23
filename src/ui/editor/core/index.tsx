import * as React from "react";
import { Quest } from "../../../lib/qmplayer/funcs";

export interface EditorCoreProps {
  quest: Quest;
  onChange: (newQuest: Quest) => void;
  //onExit: () => void,
}

export function EditorCore({ quest, onChange }: EditorCoreProps) {
  return <div>todo</div>;
}
