"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var qmreader_1 = require("../lib/qmreader");
var qmmDir = 'c:\\R.G. Catalyst\\Space Rangers HD A War Apart2.1.2170\\DATA\\questsRus\\Data\\Quest\\Rus\\';
var _loop_1 = function (fileName) {
    console.info("Loading qmm quest " + fileName);
    var qmmData = fs.readFileSync(qmmDir + fileName);
    var qmmQuest = qmreader_1.parse(qmmData);
    if (qmmQuest.majorVersion !== undefined) {
        console.info("v" + qmmQuest.majorVersion + "." + qmmQuest.minorVersion + ": " + qmmQuest.changeLogString);
    }
    var images = {};
    var tracks = [];
    var sounds = [];
    var addImg = function (name, place) {
        if (!name) {
            return;
        }
        if (images[name]) {
            images[name].push(place);
        }
        else {
            images[name] = [place];
        }
    };
    qmmQuest.params.map(function (p, pid) {
        addImg(p.img, "Param p" + pid);
        tracks.push(p.track);
        sounds.push(p.sound);
    });
    var _loop_2 = function (l) {
        l.media.map(function (x) { return x.img; }).map(function (x) { return addImg(x, "Loc " + l.id); });
        tracks.concat.apply(tracks, l.media.map(function (x) { return x.track; }));
        sounds.concat.apply(sounds, l.media.map(function (x) { return x.sound; }));
        l.paramsChanges.map(function (p, pid) {
            l.media.map(function (x) { return x.img; }).map(function (x) { return addImg(x, "Loc " + l.id + " p" + (pid + 1)); });
            tracks.push(p.track);
            sounds.push(p.sound);
        });
    };
    for (var _i = 0, _a = qmmQuest.locations; _i < _a.length; _i++) {
        var l = _a[_i];
        _loop_2(l);
    }
    qmmQuest.jumps.map(function (j, jid) {
        addImg(j.img, "Jump " + jid);
        tracks.push(j.track);
        sounds.push(j.sound);
        j.paramsChanges.map(function (p, pid) {
            addImg(p.img, "Jump " + jid + " p" + pid);
            tracks.push(p.track);
            sounds.push(p.sound);
        });
    });
    tracks = tracks.filter(function (x) { return x; });
    sounds = sounds.filter(function (x) { return x; });
    /*
    if (Object.keys(images).length === 0) {
        console.info(`No images inside`)
    } else {
        console.info(`Images:`);
       // Object.keys(images).map(img => {
       //     console.info(`        ${img}: ${images[img].join(', ')}`)
       // })
    }
    */
    if (tracks.length > 0) {
        console.info("Tracks: " + tracks.join(', '));
    }
    if (sounds.length > 0) {
        console.info("Scounds: " + sounds.join(', '));
    }
    // */
    console.info('\n');
};
for (var _i = 0, _a = fs.readdirSync(qmmDir); _i < _a.length; _i++) {
    var fileName = _a[_i];
    _loop_1(fileName);
}
