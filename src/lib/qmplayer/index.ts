import { QM } from '../qmreader';
import { PQImages } from '../pqImages';

export { JUMP_I_AGREE, JUMP_NEXT, JUMP_GO_BACK_TO_SHIP } from './defs';
export { Player, GameState} from './funcs';
import { PlayerState, GameState, DEFAULT_RUS_PLAYER, DEFAULT_ENG_PLAYER, initGame, getAllImagesToPreload, getUIState, performJump} from './funcs';


export class QMPlayer {
    private player = this.lang === 'rus' ? DEFAULT_RUS_PLAYER : DEFAULT_ENG_PLAYER;
    private state: GameState;
    constructor(
        private quest: QM,   
        private images: PQImages = [],
        private lang: "rus" | "eng",
        private oldTgeBehaviour: boolean,
    ) {
        this.state = initGame(this.quest, Math.random().toString(36));
    }

    public start() {
        this.state = initGame(this.quest, Math.random().toString(36));
    }

    public getAllImagesToPreload() {
        return getAllImagesToPreload(this.quest, this.images);
    }
    public getState(): PlayerState {
        return getUIState(this.quest, this.state, this.player)
    }
    performJump(jumpId: number) {
        this.state = performJump(jumpId, this.quest, this.state, this.images); //this.oldTgeBehaviour)
    }

    getSaving() {        
        return this.state;
    }
    loadSaving(state: GameState) {
        this.state = state;
    }
}