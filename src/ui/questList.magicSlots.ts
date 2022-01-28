/**
 *
 * This is a function to propose player N games to play.
 * When games is passed it is added into removedInChronologicalOrder
 * Using this information we can determine which of 3 games was passed so we
 *   update slot with new game (if any)
 *
 * Example:
 * I have games A, B, C, D, E, F, G
 *   Nothing is passed yet, so user sees A, B, C as proposed game
 * User passed game B, so we add B to removedInChronologicalOrder
 *   Now proposed games are A, D, C
 * User passed game A, so we add A to removedInChronologicalOrder
 *   Now proposed games are E, D, C
 *
 * Order of removedInChronologicalOrder matters because it is used to determine
 *  which game slot was passed.
 *
 */
export function getMagicSlots<T>(
  itemsInInitialOrder: T[],
  removedInChronologicalOrder: T[],
  slotsCount = 3,
): T[] {
  const slots = itemsInInitialOrder.slice(0, slotsCount);

  let nextItemIndex = slots.length;
  for (const passedGame of removedInChronologicalOrder) {
    const indexInSlots = slots.indexOf(passedGame);
    if (indexInSlots < 0) {
      console.warn(`Cannot find item in array, maybe you duplicated object?`, passedGame);
      continue;
    }

    // We know that it might be out of bounds
    // It is fine - we return undefined in that case
    slots[indexInSlots] = itemsInInitialOrder[nextItemIndex];
    nextItemIndex++;
  }

  return slots;
}
