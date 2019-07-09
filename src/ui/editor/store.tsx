import { observable, computed } from "mobx";
import { QM, JumpId, LocationId } from "../../lib/qmreader";
import { CANVAS_PADDING } from "./consts";

export const EDITOR_MODES = ["select", "move", "newLocation", "newJump", "remove"] as const;
export type EditorMode = typeof EDITOR_MODES[number];
export class EditorStore {
  constructor(quest: QM) {
    this.quest = quest;
  }

  @observable
  quest: QM;

  @computed
  get svgWidth() {
    return Math.max(...this.quest.locations.map(l => l.locX)) + CANVAS_PADDING;
  }
  @computed
  get svgHeight() {
    return Math.max(...this.quest.locations.map(l => l.locY)) + CANVAS_PADDING;
  }

  @observable
  selected?: {
    id: JumpId | LocationId;
    type: "location" | "jump_start" | "jump_end";
    initialX: number;
    initialY: number;
    currentX: number;
    currentY: number;
    moving: boolean;
  };

  @computed
  get gridX() {
    return Math.floor(this.quest.screenSizeX / this.quest.widthSize);
  }
  @computed
  get grixXoffset() {
    return Math.floor(this.gridX / 2);
  }
  @computed
  get gridY() {
    return Math.floor(this.quest.screenSizeY / this.quest.heightSize);
  }
  @computed
  get grixYoffset() {
    return Math.floor(this.gridY / 2);
  }

  @computed
  get moving() {
    return this.selected ? this.selected.moving : false;
  }

  @observable
  mode: EditorMode = "select";
}
