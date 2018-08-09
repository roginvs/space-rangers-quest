import "../lib.webworker";
import {
    WorkerMsgRequest,
    WorkerMsgResponce,
    METHOD_CHECK_QUEST
} from "./defs";
import { checkQuest } from "./workerCheckQuest";

self.onmessage = e => {
    const msg = JSON.parse(e.data) as WorkerMsgRequest;
    (async () => {
        if (msg.method === METHOD_CHECK_QUEST) {
            return checkQuest(msg.data);
        } else {
            throw new Error(`Unknown method ${msg.method}`);
        }
    })()
        .then(resultData => {
            const result: WorkerMsgResponce = {
                id: msg.id,
                method: msg.method,
                data: resultData
            };
            self.postMessage(JSON.stringify(result), "*");
        })
        .catch(e => {
            const result: WorkerMsgResponce = {
                id: msg.id,
                method: msg.method,
                data: null,
                errorMessage: e.message
            };
            self.postMessage(JSON.stringify(result), "*");
        });
};
