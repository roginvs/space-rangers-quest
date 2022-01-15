import * as fs from "fs";
import { QMPlayer } from "../lib/qmplayer";
import { Quest } from "../lib/qmplayer/funcs";
import { getImagesListFromQmm, parse, QM } from "../lib/qmreader";
import { Index, PQIParsed } from "./defs";
import { DEBUG_SPEEDUP_SKIP_COPING } from "./flags";

/*
TODO to test:
  - SR1 quests have images
    - location
    - jumps
    - critParams
  - SR2 quests have images
  - SR2 eng quests have images

Check English have eng quests origin

Check that images prop is removed from Game

*/

/**
 * If quest have images then do nothing
 *
 * If there is PQI images then repack it to QMM and add images.
 *    Check that images are in existing images list
 *
 * If there is a donor quest then copy all images from donor
 *    Check that images are in existing images list
 *
 * Elsewhere push warning and do nothing
 */
export function addImagesToQuestIfNeeded(
  questRaw: Buffer,
  sr1PQI: PQIParsed,
  sr2PQI: PQIParsed,
  donorQuestRaw: Buffer | null,
  existingImages: string[],
  warns: string[],
) {
  const quest = parse(questRaw);

  // Why do we need to do this?
  const player = new QMPlayer(quest, undefined, "rus");
  player.start();

  const qmmImagesList = getImagesListFromQmm(quest);

  if (qmmImagesList.length > 0) {
    return questRaw;
  }

  return questRaw;
  // TODO
}
