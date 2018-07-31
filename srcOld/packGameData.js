"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var qmreader_1 = require("./lib/qmreader");
var pako = __importStar(require("pako"));
var fs = __importStar(require("fs"));
var qmplayer_1 = require("./lib/qmplayer");
var pqiSR1Parsed = JSON.parse(fs.readFileSync(__dirname + '/../src/sr1-pqi.json').toString());
var warns = [];
var dataSrcPath = __dirname + '/../borrowed';
var dataDstPath = __dirname + '/../build-web/data';
var resultJsonFile = dataDstPath + '/index.json';
function readPqi(filename) {
    var result = {};
    if (!fs.existsSync(filename)) {
        warns.push("==========\nPQI file " + filename + " not found, will process without\n======");
        return result;
    }
    var content = fs.readFileSync(filename).toString();
    var currentName = '';
    var _loop_2 = function (line) {
        var _a;
        if (line.startsWith('//')) {
            currentName = line.slice(2).replace(/\.qm$/, '').toLowerCase();
            return "continue";
        }
        var _b = line.split('='), data1 = _b[0], data2 = _b[1];
        var filename_1 = data2.replace(/.*\./g, '').toLowerCase() + '.jpg';
        if (!fs.existsSync(dataDstPath + '/img/' + filename_1)) {
            warns.push("File '" + filename_1 + "' (" + (dataSrcPath + '/img/' + filename_1) + ") not found");
            return "continue";
        }
        var d = data1.split(',');
        d.shift();
        var type = d.shift();
        var indexes = d.map(function (x) { return parseInt(x); }).map(function (x) { return type === 'PAR' ? x - 1 : x; });
        if (!result[currentName]) {
            result[currentName] = [];
        }
        var indexesNames = type === 'L' ? 'locationIds' :
            type === 'P' ? 'jumpIds' : 'critParams';
        result[currentName].push((_a = {
                filename: filename_1
            },
            _a[indexesNames] = indexes,
            _a));
    };
    for (var _i = 0, _a = content.split(/\r\n|\n/)
        .map(function (x) { return x.replace(/ /g, ''); }).filter(function (x) { return x; }); _i < _a.length; _i++) {
        var line = _a[_i];
        _loop_2(line);
    }
    var newResult = {};
    for (var _b = 0, _c = Object.keys(result); _b < _c.length; _b++) {
        var k = _c[_b];
        var allImages_1 = {};
        for (var _d = 0, _e = result[k]; _d < _e.length; _d++) {
            var x = _e[_d];
            allImages_1[x.filename] = true;
        }
        newResult[k] = [];
        var _loop_3 = function (image) {
            var _a, _b, _c;
            newResult[k].push({
                filename: image,
                critParams: (_a = []).concat.apply(_a, result[k].filter(function (x) { return x.filename === image; }).map(function (x) { return x.critParams || []; })),
                locationIds: (_b = []).concat.apply(_b, result[k].filter(function (x) { return x.filename === image; }).map(function (x) { return x.locationIds || []; })),
                jumpIds: (_c = []).concat.apply(_c, result[k].filter(function (x) { return x.filename === image; }).map(function (x) { return x.jumpIds || []; })),
            });
        };
        for (var _f = 0, _g = Object.keys(allImages_1); _f < _g.length; _f++) {
            var image = _g[_f];
            _loop_3(image);
        }
    }
    return newResult;
}
function areThereAnyQmmImages(qmmQuest) {
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
    var _loop_4 = function (l) {
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
        _loop_4(l);
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
    return Object.keys(images);
}
console.info("Creating destination folders");
if (!fs.existsSync(dataDstPath)) {
    fs.mkdirSync(dataDstPath);
}
for (var _i = 0, _a = ['img', 'qm', 'music']; _i < _a.length; _i++) {
    var d = _a[_i];
    if (!fs.existsSync(dataDstPath + '/' + d)) {
        fs.mkdirSync(dataDstPath + '/' + d);
    }
}
var index = {
    quests: [],
    dir: {
        quests: { files: [], totalSize: 0 },
        images: { files: [], totalSize: 0 },
        music: { files: [], totalSize: 0 },
    }
};
var DEBUG_SPEEDUP_SKIP_COPING = false;
console.info("Scan and copy images");
var allImages = fs.readdirSync(dataSrcPath + '/img')
    .filter(function (x) { return fs.statSync(dataSrcPath + '/img/' + x).isFile(); })
    .map(function (imgShortName) {
    var filePath = 'img/' + imgShortName.toLowerCase();
    if (!DEBUG_SPEEDUP_SKIP_COPING) {
        fs.writeFileSync(dataDstPath + '/' + filePath, fs.readFileSync(dataSrcPath + '/img/' + imgShortName));
    }
    var fileSize = fs.statSync(dataSrcPath + '/img/' + imgShortName).size;
    index.dir.images.files.push({ path: filePath, size: fileSize });
    index.dir.images.totalSize += fileSize;
    return imgShortName.toLowerCase();
});
console.info("Copying music");
var music = fs.readdirSync(dataSrcPath + '/music')
    .filter(function (x) {
    var fullName = dataSrcPath + '/music/' + x;
    return fs.statSync(fullName).isFile && (fullName.toLowerCase().endsWith('.ogg') || fullName.toLowerCase().endsWith('.mp3'));
}).map(function (x) {
    var name = "music/" + x;
    if (!DEBUG_SPEEDUP_SKIP_COPING) {
        fs.writeFileSync(dataDstPath + '/' + name, fs.readFileSync(dataSrcPath + '/' + name));
    }
    var fileSize = fs.statSync(dataDstPath + '/' + name).size;
    index.dir.music.files.push({ path: name, size: fileSize });
    index.dir.music.totalSize += fileSize;
    return name;
});
var pqiSR2Parsed = readPqi(dataSrcPath + '/PQI.txt');
console.info("Found " + Object.keys(pqiSR2Parsed).length + " quests in PQI.txt");
//let pqiFound: string[] = [];
console.info("Scanning quests");
var seenQuests = [];
for (var _b = 0, _c = fs.readdirSync(dataSrcPath + '/qm'); _b < _c.length; _b++) {
    var origin = _c[_b];
    console.info("\n\nScanning origin " + origin);
    var qmDir = dataSrcPath + '/qm/' + origin + '/';
    var _loop_1 = function (qmShortName) {
        if (seenQuests.indexOf(qmShortName) > -1) {
            throw new Error("Duplicate file " + qmShortName + ". Please rename it!");
        }
        else {
            seenQuests.push(qmShortName);
        }
        var srcQmName = qmDir + qmShortName;
        var lang = origin.endsWith('eng') ? 'eng' : 'rus';
        var oldTge = qmShortName.endsWith('.qm') && lang !== 'eng'; //origin.startsWith('Tge');
        var gameName = qmShortName.replace(/(\.qm|\.qmm)$/, '')
            .replace(/_eng$/, '');
        console.info("Reading " + srcQmName + " (" + lang + ", oldTge=" + oldTge + ") gameName=" + gameName);
        var data = fs.readFileSync(srcQmName);
        if (!DEBUG_SPEEDUP_SKIP_COPING) {
            fs.writeFileSync(dataDstPath + '/qm/' + qmShortName + '.gz', new Buffer(pako.gzip(data)));
        }
        var quest = qmreader_1.parse(data);
        var player = new qmplayer_1.QMPlayer(quest, undefined, lang); // oldTge
        player.start();
        var probablyThisQuestImages = allImages
            .filter(function (x) { return x.toLowerCase().startsWith(gameName.toLowerCase()); });
        var randomImages = probablyThisQuestImages.map(function (filename, fileIndex) {
            return {
                filename: filename,
                locationIds: quest.locations
                    .map(function (loc) { return loc.id; })
                    .filter(function (id) { return (id - 1) % probablyThisQuestImages.length === fileIndex; })
            };
        });
        var qmmImagesList = qmreader_1.getImagesListFromQmm(quest);
        var pqi2Images = pqiSR2Parsed[gameName.toLowerCase()];
        var pqi1Images = pqiSR1Parsed[gameName];
        var images = qmmImagesList.length > 0 ? [] : (pqi2Images || pqi1Images || randomImages);
        if (images === randomImages) {
            warns.push("No images for " + qmShortName + ", using random");
        }
        //if (pqi[gameName.toLowerCase()]) {
        //pqiFound.push(gameName.toLowerCase());
        //}
        if (qmmImagesList.length > 0) {
            console.info("Have " + qmmImagesList.length + " qmm images");
        }
        for (var _i = 0, images_1 = images; _i < images_1.length; _i++) {
            var pqiImage = images_1[_i];
            if (allImages.indexOf(pqiImage.filename.toLowerCase()) < 0) {
                warns.push("Image " + pqiImage.filename + " is from PQI for " + qmShortName + ", " +
                    "but not found in img dir");
            }
        }
        var gameFilePath = 'qm/' + qmShortName + '.gz';
        var game = {
            filename: gameFilePath,
            description: player.getState().text.replace(/<clr>|<clrEnd>/g, ''),
            smallDescription: lang === 'rus' ? "\u0421\u043B\u043E\u0436\u043D\u043E\u0441\u0442\u044C: " + quest.hardness + ", \u0438\u0437 " + origin :
                "Hardness: " + quest.hardness + ", from " + origin,
            gameName: gameName,
            images: images,
            hardness: quest.hardness,
            questOrigin: origin,
            // oldTgeBehaviour: oldTge,
            lang: lang
        };
        index.quests.push(game);
        var gzFileSize = fs.statSync(dataDstPath + '/qm/' + qmShortName + '.gz').size;
        index.dir.quests.files.push({
            path: gameFilePath,
            size: gzFileSize
        });
        index.dir.quests.totalSize += gzFileSize;
    };
    for (var _d = 0, _e = fs.readdirSync(qmDir); _d < _e.length; _d++) {
        var qmShortName = _e[_d];
        _loop_1(qmShortName);
    }
}
index.quests = index.quests.sort(function (a, b) {
    return a.hardness - b.hardness || (a.gameName > b.gameName ? 1 : -1);
});
console.info("Done read, writing result into " + resultJsonFile);
// fs.writeFileSync(resultJsonFile, new Buffer(pako.gzip(JSON.stringify(index, null, 4))));
fs.writeFileSync(resultJsonFile, JSON.stringify(index));
if (warns.length === 0) {
    console.info('All done, no warnings');
}
else {
    console.info("Done with warnings:\n" + warns.join('\n'));
}
