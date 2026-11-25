/**
 * Pure helpers for the "word wave" text animation.
 * Knows nothing about quests or tags: a line is a list of styled runs of text.
 */

/**
 * Delay from the start of a word to the start of the next word, per visible
 * character, ms. Tuned so in a medium location text (~500 visible chars,
 * ~75 words) the last word starts at ~450 ms.
 */
export const WORD_WAVE_STEP_MS_PER_CHAR = 0.9;
/** Short words still need some step, ms */
export const WORD_WAVE_MIN_STEP_MS = 4;
/** Fade-in duration of a word is this times its step */
export const WORD_DURATION_TO_STEP = 10;

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

export function wordWaveStep(chars: number) {
  return Math.max(WORD_WAVE_MIN_STEP_MS, chars * WORD_WAVE_STEP_MS_PER_CHAR);
}

export interface WordTiming {
  delay: number;
  duration: number;
}

/**
 * Computes timings for words of changed lines. A line is unchanged when it has the
 * same signature as the line with the same index in the previous text, such lines
 * get `null` and are not taken into account. The wave goes through all changed lines.
 *
 * @param lines Visible characters count of every word, and signature for every line
 */
export function computeWordWaveSchedule(
  lines: { signature: string; words: number[] }[],
  prevSignatures: string[] | undefined,
): (WordTiming[] | null)[] {
  let start = 0;
  return lines.map((line, index) => {
    if (prevSignatures && prevSignatures[index] === line.signature) {
      return null;
    }
    return line.words.map((chars) => {
      const step = wordWaveStep(chars);
      const timing = { delay: start, duration: step * WORD_DURATION_TO_STEP };
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
