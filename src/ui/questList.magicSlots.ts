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
  // Quite stupid implementation

  // We can not iterate more than itemsInInitialOrder.length times
  // Because each iteraction we should replace one item in slots
  let healthCheckMaxIterations = itemsInInitialOrder.length + slotsCount + 10;

  const slots = itemsInInitialOrder.slice(0, slotsCount);
  let nextItemIndex = slots.length;
  while (true) {
    let slotCandidateIndex = -1;
    let removedCandidateIndex = -1;
    for (let i = 0; i < slots.length; i++) {
      if (!slots[i]) {
        // This slot is already empty
        continue;
      }
      const removedIndex = removedInChronologicalOrder.indexOf(slots[i]);
      if (removedIndex < 0) {
        // This slot is not passed, try next slot
        continue;
      }

      if (removedCandidateIndex === -1 || removedIndex < removedCandidateIndex) {
        // This slot was passed before, so it will be our new candidate

        slotCandidateIndex = i;
        removedCandidateIndex = removedIndex;
      }
    }

    if (slotCandidateIndex < 0 || removedCandidateIndex < 0) {
      // No more items to propose because all slots are not passed yet
      break;
    } else {
      slots[slotCandidateIndex] = itemsInInitialOrder[nextItemIndex];
      nextItemIndex++;
    }

    healthCheckMaxIterations--;
    if (healthCheckMaxIterations === 0) {
      console.error("Infinite loop detected");
      return new Array(slotsCount).fill(undefined);
    }
  }

  return slots;
}
