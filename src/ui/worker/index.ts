import {
  WorkerMsgRequest,
  WorkerMsgResponce,
  CheckQuestRequest,
  CheckQuestResponce,
  METHOD_CHECK_QUEST,
} from "./defs";

export class WorkerPromise {
  private readonly worker = new Worker(this.workerUrl);
  private id = 0;
  constructor(private readonly workerUrl: string) {
    this.worker.addEventListener("error", (e) => {
      const msg = `${e.message} at ${e.lineno}:${e.colno}`;
      const err = new Error(msg);
      this.waiters.forEach(({ reject }) => reject(err));
      this.waiters.clear();
    });
    this.worker.addEventListener("message", (e) => {
      const result = JSON.parse(e.data) as WorkerMsgResponce;
      const waiter = this.waiters.get(result.id);
      this.waiters.delete(result.id);
      if (waiter) {
        if (!result.errorMessage) {
          waiter.resolve(result.data);
        } else {
          waiter.reject(new Error(result.errorMessage));
        }
      } else {
        console.warn(`Unknown message from webworker`, e.data);
      }
    });
  }

  destroy() {
    this.worker.terminate();
  }

  private readonly waiters = new Map<
    number,
    {
      resolve: (data: any) => void;
      reject: (e: Error) => void;
    }
  >();

  private call(methodName: string, data: any) {
    // tslint:disable-next-line:promise-must-complete
    return new Promise<any>((resolve, reject) => {
      this.id++;
      this.waiters.set(this.id, { resolve, reject });
      const raw: WorkerMsgRequest = {
        id: this.id,
        method: methodName,
        data,
      };
      this.worker.postMessage(JSON.stringify(raw));
    });
  }

  checkQuest(data: CheckQuestRequest) {
    return this.call(METHOD_CHECK_QUEST, data) as Promise<CheckQuestResponce>;
  }
}
