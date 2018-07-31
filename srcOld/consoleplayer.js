"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var readline = __importStar(require("readline"));
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var qmreader_1 = require("./lib/qmreader");
var fs = __importStar(require("fs"));
var qmplayer_1 = require("./lib/qmplayer");
var data = fs.readFileSync(__dirname + '/../../Boat.qm');
//const data = fs.readFileSync('../Bank.qm');
var qm = qmreader_1.parse(data);
var player = new qmplayer_1.QMPlayer(qm, undefined, 'rus'); // true
player.start();
function showAndAsk() {
    var state = player.getState();
    console.info(state);
    rl.question('> ', function (answer) {
        var id = parseInt(answer);
        if (!isNaN(id) && state.choices.find(function (x) { return x.jumpId === id; })) {
            player.performJump(id);
        }
        else {
            console.info("Wrong input!");
        }
        showAndAsk();
    });
}
showAndAsk();
