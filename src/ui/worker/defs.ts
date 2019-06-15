import { GameLog } from "../../lib/qmplayer/funcs";

export interface WorkerMsgRequest {
  id: number;
  method: string;
  data: any;
}

export interface WorkerMsgResponce {
  id: number;
  method: string;
  data: any;
  errorMessage?: string;
}

export const METHOD_CHECK_QUEST = "Check quest";
export interface CheckQuestRequest {
  questUrl: string;
  logs: {
    [seed: string]: GameLog;
  };
}
export type CheckQuestResponce = "validated" | "failed";
