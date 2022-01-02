export type RandomFunc = (decimalLimit: number) => number;

export const randomFromMathRandom: RandomFunc = (n) =>
  /* tslint:disable-next-line:strict-type-predicates */
  n !== undefined ? Math.floor(Math.random() * n) : Math.random();

export function createDetermenisticRandom(randomValues: number[]) {
  let randomId = -1;
  const random = (n: number | undefined) => {
    if (n === undefined) {
      throw new Error("todo this test");
    }

    randomId++;
    if (randomId >= randomValues.length) {
      throw new Error("Lots of randoms");
    }
    const randomValue = randomValues[randomId];

    if (randomValue >= n) {
      throw new Error(`Why stored random value is greater?`);
    }

    return randomValue;
  };
  return random;
}
