import { Player } from "../../lib/qmplayer/player";
import { GameLog } from "../../lib/qmplayer/funcs";

export const FIREBASE_USERS_PRIVATE = `usersPrivate`;
export const FIREBASE_USERS_PUBLIC = `usersPublic`;
export const FIREBASE_PUBLIC_WON_PROOF = "wonProofs";

export interface ConfigLocalOnly {
  lastLocation: string;
}

export interface ConfigBoth extends ConfigLocalOnly {
  player: Player;
  noMusic: boolean;
}

export interface GameWonProofs {
  [seed: string]: GameLog;
}
export interface WonProofs {
  [gameId: string]: GameWonProofs;
}
export interface FirebasePublic {
  info: {
    name: string;
  };
  gamesWonCount: number;
  gamesWonProofs: WonProofs;
  userId: string;
}

export interface WonProofTableRow {
  userId: string;
  createdAt: number;
  gameName: string;
  proof: GameLog;
}
