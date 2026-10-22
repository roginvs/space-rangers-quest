import { Lang } from "./qmplayer/player";

export interface QuestStartFlags {
  givingRace: number;
  planetRace: number;
  playerCareer: number;
  playerRace: number;
  reputationChange: number;
  lang: Lang;
}

export interface QuestStartLineParts {
  from: string;
  to: string;
  who: string;
  reputation: string;
}

const ALL_RACES = 0b11111;
const ALL_CAREERS = 0b111;
const UNOCCUPIED = 1 << 6;

interface LineCopy {
  giving: string[];
  player: string[];
  career: string[];
  planet: Array<string | null>;
  all: string;
  allInhabited: string;
  reputation: string;
}

const COPY: { [key in Lang]: LineCopy } = {
  rus: {
    giving: ["Малоки", "Пеленги", "Люди", "Фэяне", "Гаальцы"],
    player: ["Малок", "Пеленг", "Человек", "Фэянин", "Гаалец"],
    career: ["Торговец", "Пират", "Воин"],
    planet: ["Малоки", "Пеленги", "Люди", "Фэяне", "Гаальцы", null, "Незаселённая"],
    all: "Все",
    allInhabited: "Все заселённые",
    reputation: "репутации",
  },
  eng: {
    giving: ["Maloqs", "Pelengs", "Humans", "Faeyans", "Gaalians"],
    player: ["Maloq", "Peleng", "Human", "Faeyan", "Gaalian"],
    career: ["Trader", "Pirate", "Warrior"],
    planet: ["Maloqs", "Pelengs", "Humans", "Faeyans", "Gaalians", null, "Uninhabited"],
    all: "All",
    allInhabited: "All inhabited",
    reputation: "reputation",
  },
};

function namesFromMask(mask: number, names: ReadonlyArray<string | null>): string[] {
  const selected: string[] = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (name && (mask & (1 << i)) !== 0) {
      selected.push(name);
    }
  }
  return selected;
}

function sideLabel(mask: number, names: ReadonlyArray<string>, all: string): string {
  if ((mask & ALL_RACES) === ALL_RACES) {
    return all;
  }
  return namesFromMask(mask & ALL_RACES, names).join(", ");
}

function planetLabel(mask: number, copy: LineCopy): string {
  const inhabited = mask & ALL_RACES;
  const unoccupied = (mask & UNOCCUPIED) !== 0;
  if (inhabited === ALL_RACES && unoccupied) {
    return copy.all;
  }
  if (inhabited === ALL_RACES) {
    return copy.allInhabited;
  }
  return namesFromMask(mask, copy.planet).join(", ");
}

/** Full set, or nothing selected: the restriction does not narrow the quest. */
function limitedList(mask: number, names: ReadonlyArray<string>, allBits: number): string {
  const bits = mask & allBits;
  if (bits === 0 || bits === allBits) {
    return "";
  }
  return namesFromMask(bits, names).join(", ");
}

export function getQuestStartLine(quest: QuestStartFlags): QuestStartLineParts {
  const copy = COPY[quest.lang];
  const career = limitedList(quest.playerCareer, copy.career, ALL_CAREERS);
  const player = limitedList(quest.playerRace, copy.player, ALL_RACES);
  const whoParts: string[] = [];
  if (career) {
    whoParts.push(career);
  }
  if (player) {
    whoParts.push(player);
  }

  let reputation = "";
  if (quest.reputationChange !== 0) {
    const sign = quest.reputationChange > 0 ? "+" : "−";
    reputation = `${sign}${Math.abs(quest.reputationChange)} ${copy.reputation}`;
  }

  return {
    from: sideLabel(quest.givingRace, copy.giving, copy.all),
    to: planetLabel(quest.planetRace, copy),
    who: whoParts.join(", "),
    reputation,
  };
}

export function questStartLineIsEmpty(parts: QuestStartLineParts): boolean {
  return !parts.from && !parts.to && !parts.who && !parts.reputation;
}
