interface PQImage {
  filename: string;
  locationIds?: number[]; // 0 === начальная? UPDATE: Вряд ли
  jumpIds?: number[];
  critParams?: number[];
}
export type PQImages = PQImage[];
