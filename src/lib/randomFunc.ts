export type RandomFunc = (decimalLimit?: number) => number;

export const randomFromMathRandom: RandomFunc = n => n !== undefined ? Math.floor(Math.random() * n) : Math.random();