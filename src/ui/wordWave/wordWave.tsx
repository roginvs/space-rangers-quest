import * as React from "react";
import {
  chunksWordsChars,
  computeWordWaveSchedule,
  splitRunsIntoChunks,
} from "./wordWave.schedule";
import "./wordWave.css";

export interface WaveRun {
  text: string;
  /** Renders a part of this run's text with the run's style */
  render: (text: string, key: string) => React.ReactNode;
}

export interface WaveLine {
  /** Lines with the same index and signature as in the previous text are not animated */
  signature: string;
  /** Rendered before the line without animation, for example an indent */
  prefix?: React.ReactNode;
  runs: WaveRun[];
}

/**
 * Renders lines separated by line breaks. Words of the changed lines fade in
 * one by one, the wave goes from the left to the right and from the top to the bottom.
 */
export function WordWave(props: { lines: WaveLine[] }) {
  const { lines } = props;
  const signatures = lines.map((line) => line.signature);
  const signaturesKey = JSON.stringify(signatures);
  const chunks = lines.map((line) => splitRunsIntoChunks(line.runs.map((run) => run.text)));

  const prevSignatures = React.useRef<string[] | undefined>(undefined);
  const schedule = React.useMemo(
    () =>
      computeWordWaveSchedule(
        chunks.map((lineChunks, index) => ({
          signature: signatures[index],
          words: chunksWordsChars(lineChunks),
        })),
        prevSignatures.current,
      ),
    [signaturesKey],
  );
  React.useEffect(() => {
    prevSignatures.current = signatures;
  }, [signaturesKey]);

  return (
    <>
      {lines.map((line, lineIndex) => {
        const timings = schedule[lineIndex];
        let wordIndex = 0;
        return (
          <React.Fragment key={`${lineIndex}#${line.signature}`}>
            {lineIndex > 0 ? <br /> : null}
            {line.prefix}
            {chunks[lineIndex].map((chunk, chunkIndex) => {
              const pieces = chunk.pieces.map((piece, pieceIndex) =>
                line.runs[piece.run].render(piece.text, `${pieceIndex}`),
              );
              if (chunk.type === "space") {
                return <React.Fragment key={chunkIndex}>{pieces}</React.Fragment>;
              }
              const timing = timings ? timings[wordIndex++] : undefined;
              return (
                <span
                  key={chunkIndex}
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
                  {pieces}
                </span>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}
