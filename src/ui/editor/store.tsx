import { observable, computed } from "mobx";
import { QM } from "../../lib/qmreader";

export class EditorStore {
  constructor(quest: QM) {
    this.quest = quest;
  }

  @observable
  quest: QM;

  @computed
  get svgWidth() {
    return Math.max(...this.quest.locations.map(l => l.locX)) + 100;
  }
  @computed
  get svgHeight() {
    return Math.max(...this.quest.locations.map(l => l.locY)) + 100;
  }
}
