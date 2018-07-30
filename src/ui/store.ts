import { observable, computed, action } from 'mobx';
import { Index } from '../packGameData';
import { DB , GameWonProofs} from './db';
import {
    Player
} from "../lib/qmplayer/player";
import { getLang } from './lang';


export class Store {
    constructor(public index: Index, 
        public app: firebase.app.App,
        public db: DB, 
        player: Player) {
        window.onhashchange = () => this.setPath();        
        this.setPath();
        this.player = player;
    }

    @observable player: Player;

    private setPath() {
        const hash = location.hash.replace(/^#/, '').replace(/^\//, '');
        if (this.hash === hash) {
            return
        }
        this.hash = hash;        
    }
    
    @observable
    private hash: string = '';
    
    @computed
    get path() {
        const arr = this.hash.split('/');
        return {
            tab0: arr[0],
            tab1: arr[1],
            tab2: arr[2],
        }
    }

    @observable
    firebaseLoggedIn: firebase.User | null | undefined = null;

    @observable
    firebaseSyncing: boolean = false;
    
    @computed
    get l() {
        return getLang(this.player.lang);
    }

    @observable
    wonProofs: Map<string, GameWonProofs | undefined> | undefined;

    async loadWinProofsFromLocal() {
        const m = new Map<string, GameWonProofs | undefined>();
        await Promise.all(
            this.index.quests.map(async quest => {
                const passed = await this.db.isGamePassedLocal(quest.gameName);
                m.set(quest.gameName, passed);
            }));  
        this.wonProofs = m;              
    }

    async syncWithFirebase() {
        if (this.firebaseSyncing) { // TODO: retry sync when first finished
            return
        }
        this.firebaseSyncing = true;
        await this.db.syncWithFirebase();
        
        // console.info: renew all cached values
        const player = await this.db.getConfigLocal("player");
        if (player) {
            this.player = player
        }

        await this.loadWinProofsFromLocal();

        this.firebaseSyncing = false;
    }
}