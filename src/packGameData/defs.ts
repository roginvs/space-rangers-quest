import { PQImages } from "../lib/pqImages";
import { Lang } from "../lib/qmplayer/player";

export type Origin = string;

export interface Game {
  filename: string;
  taskText: string;
  smallDescription?: string;
  gameName: string;
  questOrigin: Origin;
  // oldTgeBehaviour: boolean,
  hardness: number;
  lang: Lang;
}

interface CacheFile {
  fileName: string;
  /** This path have ending slash */
  filePath: string;
  size: number;
}
interface CacheFileTrack extends CacheFile {
  useForRandomMusic: boolean;
}
export interface CacheFilesList<T extends CacheFile = CacheFile> {
  files: T[];
  totalSize: number;
}

export interface Index {
  quests: Game[];
  dir: {
    quests: CacheFilesList;
    images: CacheFilesList;
    track: CacheFilesList<CacheFileTrack>;
    sound: CacheFilesList;
  };
}

export interface PQIParsed {
  [questName: string]: PQImages;
}
