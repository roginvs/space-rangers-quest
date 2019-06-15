import { Player } from "./player";

export interface PlayerSubstitute extends Player {
  /** Дата дедлайна */
  Date: string;
  /**  Кол-во дней */
  Day: string;
  /**  Текущая дата */
  CurDate: string;
}
