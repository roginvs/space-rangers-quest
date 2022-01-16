import { QM } from "../qmreader";
import { PQImages } from "../pqImages";

export { JUMP_I_AGREE, JUMP_NEXT, JUMP_GO_BACK_TO_SHIP } from "./defs";
export { GameState, initGame, performJump, validateWinningLog, getGameLog } from "./funcs";

import { PlayerState, GameState, initGame, getUIState, performJump } from "./funcs";
import { DEFAULT_RUS_PLAYER, DEFAULT_ENG_PLAYER } from "./player";

export class QMPlayer {
  private readonly player = this.lang === "rus" ? DEFAULT_RUS_PLAYER : DEFAULT_ENG_PLAYER;
  private state: GameState;
  constructor(private readonly quest: QM, private readonly lang: "rus" | "eng") {
    this.state = initGame(this.quest, Math.random().toString(36));
  }

  public start() {
    this.state = initGame(this.quest, Math.random().toString(36));
  }

  public getState(): PlayerState {
    return getUIState(this.quest, this.state, this.player);
  }
  performJump(jumpId: number) {
    this.state = performJump(jumpId, this.quest, this.state);
  }

  getSaving() {
    return this.state;
  }
  loadSaving(state: GameState) {
    this.state = state;
  }
}
