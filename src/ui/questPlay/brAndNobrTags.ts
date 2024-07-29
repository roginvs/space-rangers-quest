/**
 * Split the text by <br> into separate lines
 * Join line with next if it ends with <nobr>
 */
export function brAndNobrTags(texts: string[]) {
  const out: string[] = [];
  let currentLine = "";
  let isNeedLastLineFlush = false;
  for (const text of texts) {
    for (const line of text.split("<br>")) {
      const rtimmedLine = line.trimRight();
      if (rtimmedLine.endsWith("<nobr>")) {
        currentLine += rtimmedLine.slice(0, rtimmedLine.length - "<nobr>".length);
        isNeedLastLineFlush = true;
      } else {
        out.push(currentLine + line);
        currentLine = "";
        isNeedLastLineFlush = false;
      }
    }
  }
  if (isNeedLastLineFlush) {
    out.push(currentLine);
  }
  return out;
}
