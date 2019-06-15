export type Lang = "rus" | "eng";

export interface Player {
  Ranger: string;
  Player: string;
  Money: string;
  FromPlanet: string;
  FromStar: string;
  ToPlanet: string;
  ToStar: string;
  lang: Lang;
}
export const DEFAULT_RUS_PLAYER: Player = {
  // TODO: move from this file
  Ranger: "Греф",
  Player: "Греф",
  FromPlanet: "Земля",
  FromStar: "Солнечная",
  ToPlanet: "Боннасис",
  ToStar: "Процион",
  Money: "65535",
  lang: "rus"
};
export const DEFAULT_ENG_PLAYER: Player = {
  // TODO: move from this file
  Ranger: "Ranger",
  Player: "Player",
  FromPlanet: "FromPlanet",
  FromStar: "FromStar",
  ToPlanet: "ToPlanet",
  ToStar: "ToStar",
  Money: "65535",

  lang: "eng"
};
