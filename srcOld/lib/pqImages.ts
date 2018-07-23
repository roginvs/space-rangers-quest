interface PQImage {
    filename: string;
    locationIds?: number[]; // 0 === начальная?
    jumpIds?: number[];
    critParams?: number[];
}
export type PQImages = PQImage[];

