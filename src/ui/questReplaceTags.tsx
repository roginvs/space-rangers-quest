import classNames from "classnames";
import * as React from "react";
import { formatTokens } from "./questReplaceTags.format";
import { splitStringToTokens } from "./questReplaceTags.split";

export function QuestReplaceTags(props: { str: string }) {
  const tags = formatTokens(splitStringToTokens(props.str));

  return (
    <>
      <span className="game-text"> </span>
      {tags.map((tag) => (
        <span
          className={classNames("game-text", {
            "game-fix": tag.isFix,
            "text-success": tag.isClr,
          })}
          // TODO color
        >
          {tag.text}
        </span>
      ))}
    </>
  );
}
/**
 *
 * Replaces:
 *   - <clr> bla bla <clrEnd>
 *   - <fix> bla bla </fix>
 *   - <format=left,30>  bla bla </format>
 *
 *   - TODO <color=R,G,B> bla bla </color>
 */
export function QuestReplaceTags1(props: { str: string }) {
  // Я не знаю как это сделать React-way

  /*  x.match(/\<format=(left|right|center),(\d+)\>(.*?)\<\/format\>/)
[ '<format=left,30>текст</format>',
'left',
'30',
'текст',
*/
  let cloneStr = props.str.slice();

  while (true) {
    const m = cloneStr.match(/\<format=(left|right|center),(\d+)\>(.*?)\<\/format\>/);
    if (!m) {
      break;
    }
    const [textToReplace, whereToPad, howManyPadStr, textInTags] = m;
    const howManyPad = parseInt(howManyPadStr);

    if (
      !(howManyPad && (whereToPad === "left" || whereToPad === "right" || whereToPad === "center"))
    ) {
      cloneStr = cloneStr.replace(textToReplace, textInTags);
      continue;
    }
    let newText = textInTags.slice();
    while (true) {
      if (newText.replace(/\<.*?\>/g, "").length >= howManyPad) {
        break;
      }
      if (whereToPad === "left") {
        newText = " " + newText;
      } else if (whereToPad === "right") {
        newText = newText + " ";
      } else {
        newText = newText.length % 2 ? " " + newText : newText + " ";
      }
    }
    // console.info(`Replacing part '${textToReplace}' to '${newText}'`)
    cloneStr = cloneStr.replace(textToReplace, newText);
  }

  const s =
    "&nbsp" +
    cloneStr
      .replace(/\r\n/g, "<br/>&nbsp")
      .replace(/\n/g, "<br/>&nbsp")
      .replace(/<clr>/g, '<span class="text-success">')
      .replace(/<clrEnd>/g, "</span>")
      .replace(/<fix>/g, '<span class="game-fix">')
      .replace(/<\/fix>/g, "</span>");

  // console.info('Replace', str, s)
  //return {
  //    __html: s
  //};
  return (
    <span
      dangerouslySetInnerHTML={{
        __html: s,
      }}
    />
  );
}
