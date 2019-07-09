import { observable, computed, reaction, toJS, runInAction } from "mobx";
import { QM, JumpId, LocationId } from "../../lib/qmreader";
import { CANVAS_PADDING } from "./consts";

export const EDITOR_MODES = ["select", "move", "newLocation", "newJump", "remove"] as const;
export type EditorMode = typeof EDITOR_MODES[number];
export class EditorStore {
  constructor(quest: QM) {
    this.quest = quest;
    this.initReactionForUndo(true);
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
  mouseMode: EditorMode = "select";

  @observable
  private readonly projectChangeHistory: QM[] = [];

  @observable
  private undoPosition = 0;

  private stopReactionForUndoCallback: undefined | (() => void) = undefined;

  private initReactionForUndo(fireImmediately: boolean) {
    const HISTORY_LIMIT = 100;
    if (this.stopReactionForUndoCallback) {
      throw new Error("Reaction already exists!");
    }
    this.stopReactionForUndoCallback = reaction(
      () => {
        return toJS(this.quest);
      },
      currentState => {
        while (this.projectChangeHistory.length - 1 > this.undoPosition) {
          this.projectChangeHistory.pop();
        }
        this.projectChangeHistory.push(currentState);
        while (this.projectChangeHistory.length > HISTORY_LIMIT) {
          this.projectChangeHistory.shift();
        }
        this.undoPosition = this.projectChangeHistory.length - 1;
      },
      {
        delay: 1000,
        fireImmediately,
      },
    );
  }
  private stopReactionForUndo() {
    if (!this.stopReactionForUndoCallback) {
      throw new Error("Where is reaction for undo?");
    }
    this.stopReactionForUndoCallback();
    this.stopReactionForUndoCallback = undefined;
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
      this.updateWithNoUndoRedo(newState);
    });
  }
  redo() {
    runInAction(() => {
      if (!this.canRedo) {
        return;
      }
      this.undoPosition++;
      const newState = toJS(this.projectChangeHistory[this.undoPosition]);
      this.updateWithNoUndoRedo(newState);
    });
  }

  protected updateWithNoUndoRedo(quest: QM) {
    this.stopReactionForUndo();
    this.quest = quest;
    this.initReactionForUndo(false);
  }
}
