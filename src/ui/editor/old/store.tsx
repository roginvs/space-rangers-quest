import { observable, computed, reaction, toJS, runInAction } from "mobx";
import { QM, JumpId, LocationId } from "../../../lib/qmreader";
import { CANVAS_PADDING } from "./consts";
import { computedFn } from "mobx-utils";

// False-positive from old tslint rule
// tslint:disable-next-line:no-useless-cast
export const EDITOR_MODES = ["select", "move", "newLocation", "newJump", "remove"] as const;
export type EditorMode = typeof EDITOR_MODES[number];

interface SelectedCommon {
  initialX: number;
  initialY: number;
  currentX: number;
  currentY: number;
  moving: boolean;
  opened: boolean;
}

interface SelectedLocation extends SelectedCommon {
  id: LocationId;
  type: "location";
}
interface SelectedJump extends SelectedCommon {
  id: JumpId;
  type: "jump_start" | "jump_end";
}

type Selected = SelectedLocation | SelectedJump;

export class EditorStore {
  constructor(quest: QM) {
    this.quest = quest;
    this.pushUndo();
  }

  @observable
  quest: QM;

  @computed
  get svgWidth() {
    return Math.max(...this.quest.locations.map((l) => l.locX)) + CANVAS_PADDING;
  }
  @computed
  get svgHeight() {
    return Math.max(...this.quest.locations.map((l) => l.locY)) + CANVAS_PADDING;
  }

  @observable
  selected?: Selected;

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
  mouseMode: EditorMode = "select";

  @observable
  private readonly projectChangeHistory: QM[] = [];

  @observable
  private undoPosition = 0;

  public pushUndo() {
    const HISTORY_LIMIT = 100;

    const currentState = toJS(this.quest);
    while (this.projectChangeHistory.length - 1 > this.undoPosition) {
      this.projectChangeHistory.pop();
    }
    this.projectChangeHistory.push(currentState);
    while (this.projectChangeHistory.length > HISTORY_LIMIT) {
      this.projectChangeHistory.shift();
    }
    this.undoPosition = this.projectChangeHistory.length - 1;
  }

  @computed
  get canUndo() {
    return this.undoPosition > 0;
  }
  @computed
  get canRedo() {
    return this.undoPosition < this.projectChangeHistory.length - 1;
  }
  undo() {
    runInAction(() => {
      if (!this.canUndo) {
        return;
      }
      this.undoPosition--;
      const newState = toJS(this.projectChangeHistory[this.undoPosition]);
      this.quest = newState;
    });
  }
  redo() {
    runInAction(() => {
      if (!this.canRedo) {
        return;
      }
      this.undoPosition++;
      const newState = toJS(this.projectChangeHistory[this.undoPosition]);
      this.quest = newState;
    });
  }

  readonly jumpById = computedFn((jumpId: JumpId) => this.quest.jumps.find((j) => j.id === jumpId));

  readonly locationById = computedFn((locationId: LocationId) =>
    this.quest.locations.find((l) => l.id === locationId),
  );
}
