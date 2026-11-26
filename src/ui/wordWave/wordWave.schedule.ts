/**
 * Pure helpers for the "word wave" text animation.
 * Knows nothing about quests or tags: a line is a list of styled runs of text.
 */

/**
 * The wave is a beam with a fixed speed: a word starts this many ms after the previous
 * word per character passed (the word and a space), so one short line appears quickly
 * and a long text takes proportionally longer.
 */
export const WORD_WAVE_MS_PER_CHAR = 3;
/** A very long text is not longer than this, ms: the beam goes faster */
export const WORD_WAVE_MAX_MS = 4000;
/** Fade-in of every word, ms */
export const WORD_WAVE_DURATION_MS = 200;

export interface WaveRunPiece {
  /** Index of the run this piece belongs to */
  run: number;
  text: string;
}

export type WaveChunk =
  | { type: "space"; pieces: WaveRunPiece[] }
  | {
      type: "word";
      pieces: WaveRunPiece[];
      /** Visible characters count */
      chars: number;
    };

/**
 * Splits styled runs into words and whitespace. A word may span several runs
 * (for example when a tag starts in the middle of the word).
 */
export function splitRunsIntoChunks(runs: string[]): WaveChunk[] {
  const chunks: WaveChunk[] = [];
  runs.forEach((runText, run) => {
    for (const text of runText.split(/(\s+)/)) {
      if (text === "") {
        continue;
      }
      const type = /^\s/.test(text) ? "space" : "word";
      const last = chunks.length > 0 ? chunks[chunks.length - 1] : undefined;
      const piece = { run, text };
      if (last && last.type === type) {
        last.pieces.push(piece);
        if (last.type === "word") {
          last.chars += text.length;
        }
      } else {
        chunks.push(
          type === "word"
            ? { type, pieces: [piece], chars: text.length }
            : { type, pieces: [piece] },
        );
      }
    }
  });
  return chunks;
}

export function chunksWordsChars(chunks: WaveChunk[]): number[] {
  const words: number[] = [];
  for (const chunk of chunks) {
    if (chunk.type === "word") {
      words.push(chunk.chars);
    }
  }
  return words;
}

/** Beam speed for this count of characters, ms per character */
export function wordWaveMsPerChar(chars: number) {
  return Math.min(WORD_WAVE_MS_PER_CHAR, WORD_WAVE_MAX_MS / Math.max(chars, 1));
}

export interface WordTiming {
  delay: number;
  duration: number;
}

/**
 * Computes timings for words of changed lines. A line is unchanged when it has the
 * same signature as the line with the same index in the previous text, such lines
 * get `null` and are not taken into account. The wave goes through all changed lines
 * with the same speed in characters.
 *
 * @param lines Visible characters count of every word, and signature for every line
 */
export function computeWordWaveSchedule(
  lines: { signature: string; words: number[] }[],
  prevSignatures: string[] | undefined,
): (WordTiming[] | null)[] {
  const changed = lines.map(
    (line, index) => !prevSignatures || prevSignatures[index] !== line.signature,
  );
  // Every word is followed by a space
  const chars = lines.reduce(
    (sum, line, index) =>
      changed[index] ? line.words.reduce((lineSum, word) => lineSum + word + 1, sum) : sum,
    0,
  );
  const msPerChar = wordWaveMsPerChar(chars);
  let start = 0;
  return lines.map((line, index) => {
    if (!changed[index]) {
      return null;
    }
    return line.words.map((wordChars) => {
      const timing = { delay: start, duration: WORD_WAVE_DURATION_MS };
      start += (wordChars + 1) * msPerChar;
      return timing;
    });
  });
}

export function wordWaveTotalDuration(schedule: (WordTiming[] | null)[]) {
  let total = 0;
  for (const line of schedule) {
    for (const word of line || []) {
      total = Math.max(total, word.delay + word.duration);
    }
  }
  return total;
}
