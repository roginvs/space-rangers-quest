import { PQImages } from "../lib/pqImages";
import { Lang } from "../lib/qmplayer/player";

export type Origin = string;

export interface Game {
  filename: string;
  taskText: string;
  smallDescription?: string;
  gameName: string;
  images: PQImages;
  questOrigin: Origin;
  // oldTgeBehaviour: boolean,
  hardness: number;
  lang: Lang;
}

export interface CacheFilesList {
  files: {
    path: string;
    size: number;
  }[];
  totalSize: number;
}

export interface Index {
  quests: Game[];
  dir: {
    quests: CacheFilesList;
    images: CacheFilesList;
    music: CacheFilesList;
  };
}
