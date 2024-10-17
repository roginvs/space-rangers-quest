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

  /**
   * Allow back or debug button in the game
   */
  allowBackButton?: boolean | "debug";
}
export const DEFAULT_RUS_PLAYER: Player = {
  // TODO: move from this file
  Ranger: "Греф",
  Player: "Греф",
  FromPlanet: "Земля",
  FromStar: "Солнечная",
  ToPlanet: "Боннасис",
  ToStar: "Процион",
  Money: "10000",

  lang: "rus",
  allowBackButton: false,
};
export const DEFAULT_ENG_PLAYER: Player = {
  // TODO: move from this file
  Ranger: "Ranger",
  Player: "Player",
  FromPlanet: "FromPlanet",
  FromStar: "FromStar",
  ToPlanet: "ToPlanet",
  ToStar: "ToStar",
  Money: "10000",

  lang: "eng",
  allowBackButton: false,
};
