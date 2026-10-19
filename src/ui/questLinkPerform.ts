import { performJump } from "../lib/qmplayer";
import { Quest, GameState, getUIState } from "../lib/qmplayer/funcs";
import { Player } from "../lib/qmplayer/player";
import { DeepImmutable } from "../lib/qmplayer/deepImmutable";
import { splitStringToTokens } from "./questReplaceTags.split";

/**
 * The `<link>` tag feature.
 *
 * The tag holds a list of jump names. When the player clicks on it, all these
 * jumps are performed sequentially in one go. Each next jump is searched
 * in the choices list of the state produced by the previous jump,
 * exactly like the player would click them one after another.
 */

/** Removes the formatting tags known to the renderer from the string */
export function stripFormattingTags(str: string) {
  // The tokenizer is the source of truth about which tags are formatting:
  // everything else (unknown or broken tags) stays in the text,
  // so the matching simply will not find anything
  return splitStringToTokens(str)
    .map((token) => (token.type === "text" ? token.text : ""))
    .join("");
}

/** Normalizes both the jump name from the tag and the choice display text */
export function normalizeForLinkMatch(str: string) {
  return stripFormattingTags(str).trim();
}

/**
 * Performs the chain of jumps by their display names.
 * Returns the state after the whole chain (or after the last succeeded jump).
 *
 * Rules:
 *  - names are matched against the choices text (after substitutions and
 *    formatting tags removal), no substring search;
 *  - only actually provided and active choices are considered;
 *  - if some name has no exact unique active match, the chain stops;
 *  - jumps already performed are not reverted;
 *  - no additional jumps (like "Next") are performed automatically.
 */
export function performLinkJumps(
  jumps: readonly string[],
  quest: Quest,
  startState: GameState,
  player: DeepImmutable<Player>,
): GameState {
  let state = startState;

  for (const jumpName of jumps) {
    const uiState = getUIState(quest, state, player);

    if (uiState.gameState !== "running") {
      // The quest is over: no more jumps can be performed
      break;
    }

    const wanted = normalizeForLinkMatch(jumpName);

    const matches = uiState.choices.filter(
      (choice) => choice.active && normalizeForLinkMatch(choice.text) === wanted,
    );

    // Ambiguous or missing jumps stops the chain
    if (matches.length !== 1) {
      break;
    }

    state = performJump(
      matches[0].jumpId,
      quest,
      state,
      // The date is not important for links, intermediate states are not shown
      0,
    );
  }

  return state;
}
