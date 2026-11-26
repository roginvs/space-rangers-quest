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
 * Signatures of the lines from the previous render. It is owned by the caller
 * so it survives remounts of the animated text.
 */
export type WordWaveMemory = React.MutableRefObject<string[] | undefined>;

export interface WaveLine {
  /** Lines with the same index and signature as in the previous text are not animated */
  signature: string;
  /** Texts of the styled runs of this line */
  runs: string[];
}

/**
 * Splits lines into words and schedules the word wave: words of the changed lines
 * fade in one by one, from the left to the right and from the top to the bottom.
 *
 * Returns the content for every run of every line: `result[line][run]`.
 * A word which spans several runs gets the same timing in every run.
 */
export function useWordWave(lines: WaveLine[], memory: WordWaveMemory): React.ReactNode[][][] {
  const signatures = lines.map((line) => line.signature);
  const signaturesKey = JSON.stringify(signatures);
  const chunks = lines.map((line) => splitRunsIntoChunks(line.runs));

  const schedule = React.useMemo(
    () =>
      computeWordWaveSchedule(
        chunks.map((lineChunks, index) => ({
          signature: signatures[index],
          words: chunksWordsChars(lineChunks),
        })),
        memory.current,
      ),
    [signaturesKey],
  );
  React.useEffect(() => {
    memory.current = signatures;
  }, [signaturesKey]);

  return lines.map((line, lineIndex) =>
    renderWaveLine(line, chunks[lineIndex], schedule[lineIndex]),
  );
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
