export type RandomFunc = (decimalLimit: number) => number;

export const randomFromMathRandom: RandomFunc = n =>
  /* tslint:disable-next-line:strict-type-predicates */
  n !== undefined ? Math.floor(Math.random() * n) : Math.random();
