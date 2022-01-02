import * as fs from "fs";

import { parse, ParamType, ParamCritType } from "../lib/qmreader";

import * as assert from "assert";
const qmmDir =
  "c:\\R.G. Catalyst\\Space Rangers HD A War Apart2.1.2170\\DATA\\questsRus\\Data\\Quest\\Rus\\";
for (const fileName of fs.readdirSync(qmmDir)) {
  console.info(`Loading qmm quest ${fileName}`);
  const qmmData = fs.readFileSync(qmmDir + fileName);
  const qmmQuest = parse(qmmData);

  if (qmmQuest.majorVersion !== undefined) {
    console.info(`v${qmmQuest.majorVersion}.${qmmQuest.minorVersion}: ${qmmQuest.changeLogString}`);
  }

  const images: {
    [imageName: string]: string[];
  } = {};
  let tracks: (string | undefined)[] = [];
  let sounds: (string | undefined)[] = [];

  const addImg = (name: string | undefined, place: string) => {
    if (!name) {
      return;
    }
    if (images[name]) {
      images[name].push(place);
    } else {
      images[name] = [place];
    }
  };

  qmmQuest.params.forEach((p, pid) => {
    addImg(p.img, `Param p${pid}`);
    tracks.push(p.track);
    sounds.push(p.sound);
  });

  for (const l of qmmQuest.locations) {
    l.media.map((x) => x.img).forEach((x) => addImg(x, `Loc ${l.id}`));
    tracks = [...tracks, ...l.media.map((x) => x.track)];
    sounds = [...sounds, ...l.media.map((x) => x.sound)];

    l.paramsChanges.forEach((p, pid) => {
      l.media.map((x) => x.img).forEach((x) => addImg(x, `Loc ${l.id} p${pid + 1}`));
      tracks.push(p.track);
      sounds.push(p.sound);
    });
  }

  qmmQuest.jumps.forEach((j, jid) => {
    addImg(j.img, `Jump ${jid}`);

    tracks.push(j.track);
    sounds.push(j.sound);

    j.paramsChanges.forEach((p, pid) => {
      addImg(p.img, `Jump ${jid} p${pid}`);
      tracks.push(p.track);
      sounds.push(p.sound);
    });
  });

  tracks = tracks.filter((x) => x);
  sounds = sounds.filter((x) => x);

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
    console.info(`Tracks: ${tracks.join(", ")}`);
  }
  if (sounds.length > 0) {
    console.info(`Scounds: ${sounds.join(", ")}`);
  }
  // */
  console.info("\n");
}
