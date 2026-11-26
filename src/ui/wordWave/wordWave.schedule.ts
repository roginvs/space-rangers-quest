/**
 * Pure helpers for the "word wave" text animation.
 * Knows nothing about quests or tags: a line is a list of styled runs of text.
 */

/** A long text appears in about this time, ms */
export const WORD_WAVE_TOTAL_MS = 2200;
/** Delay from the start of a word to the start of the next word is the same for all words */
export const WORD_WAVE_MIN_STEP_MS = 14;
export const WORD_WAVE_MAX_STEP_MS = 45;
/** Fade-in of a word lasts this many steps, so ~5 words fade in at once */
export const WORD_DURATION_TO_STEP = 5;
/** Very short fade-in is not visible */
export const WORD_WAVE_MIN_DURATION_MS = 150;

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

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Step between words when the wave goes through this count of words */
export function wordWaveStep(wordsCount: number) {
  return clamp(
    WORD_WAVE_TOTAL_MS / Math.max(wordsCount, 1),
    WORD_WAVE_MIN_STEP_MS,
    WORD_WAVE_MAX_STEP_MS,
  );
}

export function wordWaveDuration(step: number) {
  return Math.max(WORD_WAVE_MIN_DURATION_MS, step * WORD_DURATION_TO_STEP);
}

export interface WordTiming {
  delay: number;
  duration: number;
}

/**
 * Computes timings for words of changed lines. A line is unchanged when it has the
 * same signature as the line with the same index in the previous text, such lines
 * get `null` and are not taken into account. The wave goes through all changed lines,
 * one word after another with the same step: the more words, the shorter the step.
 *
 * @param lines Visible characters count of every word (only the count is used), and signature
 */
export function computeWordWaveSchedule(
  lines: { signature: string; words: number[] }[],
  prevSignatures: string[] | undefined,
): (WordTiming[] | null)[] {
  const changed = lines.map(
    (line, index) => !prevSignatures || prevSignatures[index] !== line.signature,
  );
  const wordsCount = lines.reduce(
    (sum, line, index) => sum + (changed[index] ? line.words.length : 0),
    0,
  );
  const step = wordWaveStep(wordsCount);
  const duration = wordWaveDuration(step);
  let start = 0;
  return lines.map((line, index) => {
    if (!changed[index]) {
      return null;
    }
    return line.words.map(() => {
      const timing = { delay: start, duration };
      start += step;
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
