import { Quest, GameState, getUIState, performJump } from "../lib/qmplayer/funcs";
import { Player } from "../lib/qmplayer/player";
import { DeepImmutable } from "../lib/qmplayer/deepImmutable";
import { splitStringToTokens } from "./questReplaceTags.split";
import { formatTokens } from "./questReplaceTags.format";

/** Matches names using the same formatting as the displayed choices. */
export function normalizeForLinkMatch(str: string) {
  return formatTokens(splitStringToTokens(str))
    .map((token) => (token.type === "text" ? token.text : "\n"))
    .join("")
    .trim();
}

/**
 * Runs named jumps in order, using the choices available after each step.
 * Stops on missing or ambiguous choices, keeping already performed jumps.
 */
export function performLinkJumps(
  jumps: readonly string[],
  quest: Quest,
  startState: GameState,
  player: DeepImmutable<Player>,
  dateUnix = new Date().getTime(),
): GameState {
  let state = startState;

  for (let step = 0; step < jumps.length; step++) {
    const jumpName = jumps[step];
    const uiState = getUIState(quest, state, player);

    if (uiState.gameState !== "running") {
      break;
    }

    const wanted = normalizeForLinkMatch(jumpName);

    const matches = uiState.choices.filter(
      (choice) => choice.active && normalizeForLinkMatch(choice.text) === wanted,
    );

    if (matches.length !== 1) {
      console.warn(
        `<link>: ${
          matches.length === 0 ? "Transition not found or inactive" : "Ambiguous transition"
        }: ` +
          `${JSON.stringify(jumpName)} (step ${step + 1}/${jumps.length}, ` +
          `location ${state.locationId}, state ${state.state}, active matches ${matches.length})`,
      );
      break;
    }

    state = performJump(matches[0].jumpId, quest, state, dateUnix);
  }

  return state;
}
