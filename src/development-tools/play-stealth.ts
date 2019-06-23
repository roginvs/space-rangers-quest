import * as fs from "fs";

import { parse } from "../lib/qmreader";
import { getUIState, performJump } from "../lib/qmplayer/funcs";
import { DEFAULT_RUS_PLAYER } from "../lib/qmplayer/player";

const initialStateRaw = `{"state":"location","locationId":7,"lastJumpId":167,"critParamId":null,"possibleJumps":[{"active":true,"id":138},{"active":true,"id":139},{"active":true,"id":465},{"active":true,"id":402},{"active":true,"id":145},{"active":true,"id":220}],"paramValues":[17,50,96,2,0,72800000,0,60300000,0,0,0,1,99034000,99034000,99074000,99074000,99044000,99054000,99054000,0,0,99074000,0,0,0,0,0,0,0,0,0,0,0,2000,0,608,0,0,0,0,0,0,0,0,608,99034000,7,0],"paramShow":[true,false,true,true,false,true,true,true,true,false,true,true,false,false,true,true,false,false,false,false,false,true,false,false,true,true,true,true,true,true,true,true,true,false,true,false,false,true,false,false,false,false,false,false,false,false,false,false],"jumpedCount":{"2":1,"12":1,"15":1,"17":1,"18":3,"19":6,"20":84,"21":7,"22":7,"23":7,"24":7,"25":7,"26":7,"27":7,"28":56,"29":28,"31":56,"40":56,"42":56,"44":56,"55":56,"64":1,"66":1,"71":1,"73":1,"77":1,"80":1,"81":56,"86":7,"87":7,"88":7,"89":7,"90":7,"91":84,"97":7,"99":1,"100":1,"101":1,"102":1,"103":1,"135":1,"136":1,"153":7,"154":7,"155":7,"156":7,"157":7,"166":1,"167":1,"231":7,"232":7,"233":7,"234":7,"236":7,"335":1,"336":6,"337":1,"338":6,"339":1,"340":6,"341":1,"342":6,"343":1,"344":6,"345":1,"346":6,"347":1,"348":6,"350":7,"352":7,"353":1,"354":6,"356":7,"358":7},"locationVisitCount":{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"10":5,"15":6,"16":2,"18":6,"19":83,"21":83,"22":55,"23":55,"26":55,"27":55,"31":55,"39":83,"41":6,"42":6,"43":6,"44":6,"45":6,"46":6,"47":6,"48":6,"49":6,"51":0,"52":0,"53":0,"57":0,"61":0,"68":6,"69":6,"77":55,"79":0,"82":90,"83":6,"87":55,"157":6},"daysPassed":0,"imageFilename":"build_02.jpg","aleaState":[0.013226858573034406,0.802917416440323,0.14356148149818182,1880843],"aleaSeed":"2xv48aihz4khqlackfef0p","performedJumps":[{"dateUnix":1534598101954,"jumpId":-1},{"dateUnix":1534598104692,"jumpId":64},{"dateUnix":1534598106781,"jumpId":66},{"dateUnix":1534598114872,"jumpId":-2},{"dateUnix":1534598117336,"jumpId":71},{"dateUnix":1534598118633,"jumpId":73},{"dateUnix":1534598120025,"jumpId":77},{"dateUnix":1534598120990,"jumpId":12},{"dateUnix":1534598121906,"jumpId":2},{"dateUnix":1534598123838,"jumpId":15},{"dateUnix":1534598125768,"jumpId":17},{"dateUnix":1534598127700,"jumpId":135},{"dateUnix":1534598129285,"jumpId":136}]}`;

const quest = parse(
  fs.readFileSync(__dirname + "/../../borrowed/qm/КР 2 Доминаторы Перезагрузка/Stealth.qmm"),
);

// tslint:disable-next-line
let state = JSON.parse(initialStateRaw);

console.info(getUIState(quest, state, DEFAULT_RUS_PLAYER));
/*
state = performJump(402, quest, state);
state = performJump(190, quest, state);
state = performJump(96, quest, state);
state = performJump(362, quest, state);
console.info('========================');    
console.info(getUIState(quest, state, DEFAULT_RUS_PLAYER));
*/

/*



indexedDB.open("spacerangers2", 7).onsuccess = e => db = e.target.result;

tx = db.transaction('savedgames', 'readwrite');
 store = tx.objectStore('savedgames');
  
  store.add(item);
  return tx.complete;

*/
