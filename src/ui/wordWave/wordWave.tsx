import * as React from "react";
import {
  chunksWordsChars,
  computeWordWaveSchedule,
  splitRunsIntoChunks,
  WaveChunk,
  WordTiming,
} from "./wordWave.schedule";
import "./wordWave.css";

/**
 * Signatures of the lines from the previous render. By default it is kept inside the
 * component, pass your own ref if the animated text can be remounted.
 */
export type WordWaveMemory = React.MutableRefObject<string[] | undefined>;

export interface WaveLine {
  /** Lines with the same index and signature as in the previous text are not animated */
  signature: string;
  /** Texts of the styled runs of this line */
  runs: string[];
}

/** Returns the content of one run of one line: plain whitespace and word spans */
export type WordWaveRenderRun = (line: number, run: number) => React.ReactNode[];

/**
 * Splits lines into words and schedules the word wave: words of the changed lines
 * fade in one by one, from the left to the right and from the top to the bottom.
 * A word which spans several runs gets the same timing in every run.
 */
export function useWordWave(lines: WaveLine[], memory?: WordWaveMemory): WordWaveRenderRun {
  const ownMemory: WordWaveMemory = React.useRef<string[]>();
  const prev = memory || ownMemory;

  const signatures = lines.map((line) => line.signature);
  // Length-prefixed, so different lists of signatures always give different keys
  const signaturesKey = signatures.map((signature) => `${signature.length}:${signature}`).join("");
  const chunks = lines.map((line) => splitRunsIntoChunks(line.runs));

  const schedule = React.useMemo(
    () =>
      computeWordWaveSchedule(
        chunks.map((lineChunks, index) => ({
          signature: signatures[index],
          words: chunksWordsChars(lineChunks),
        })),
        prev.current,
      ),
    // Runs also count: when tags change without changing the text, the word spans
    // are remounted, they must not get the timings of the previous change
    [signaturesKey, lines.map((line) => line.runs.map((run) => run.length).join()).join(";")],
  );
  React.useEffect(() => {
    prev.current = signatures;
  }, [signaturesKey]);

  const rendered = lines.map((line, lineIndex) =>
    renderWaveLine(line, chunks[lineIndex], schedule[lineIndex]),
  );
  return (line, run) => rendered[line][run];
}

function renderWaveLine(line: WaveLine, chunks: WaveChunk[], timings: WordTiming[] | null) {
  const runs: React.ReactNode[][] = line.runs.map(() => []);
  let wordIndex = 0;
  chunks.forEach((chunk, chunkIndex) => {
    const timing = chunk.type === "word" && timings ? timings[wordIndex++] : undefined;
    chunk.pieces.forEach((piece, pieceIndex) => {
      // Signature in the key remounts words of a changed line, so the animation restarts
      const key = `${line.signature}#${chunkIndex}#${pieceIndex}`;
      runs[piece.run].push(
        chunk.type === "space" ? (
          <React.Fragment key={key}>{piece.text}</React.Fragment>
        ) : (
          <span
            key={key}
            className={timing ? "word-wave-word" : undefined}
            style={
              timing
                ? {
                    animationDelay: `${Math.round(timing.delay)}ms`,
                    animationDuration: `${Math.round(timing.duration)}ms`,
                  }
                : undefined
            }
          >
            {piece.text}
          </span>
        ),
      );
    });
  });
  return runs;
}
