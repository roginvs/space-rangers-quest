import { QM } from '../qmreader';
import { PQImages } from '../pqImages';

export { JUMP_I_AGREE, JUMP_NEXT, JUMP_GO_BACK_TO_SHIP } from './defs';
export { Player, GameState} from './funcs';
import { PlayerState, GameState} from './funcs';


export class QMPlayer {
    constructor(
        private quest: QM,   
        private images: PQImages = [],
        private lang: "rus" | "eng",
        private oldTgeBehaviour: boolean // removeme
    ) {

    }

    public start() {

    }

    public getAllImagesToPreload() {
        return []
    }
    public getState(): PlayerState {
        return {
            
        } as any as PlayerState
    }
    performJump(jumpId: number) {
    }

    getSaving() {        
        return {} as any as GameState;
    }
    loadSaving(state: GameState) {
        
    }

}