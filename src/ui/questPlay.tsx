import * as React from "react";
import { Loader, DivFadeinCss, Tabs } from "./common";
import { LangTexts } from "./lang";
import { DB } from "./db";
import { Player, Lang } from "../lib/qmplayer/player";
import { Index, Game } from "../packGameData";
import {
    ButtonDropdown,
    DropdownMenu,
    DropdownToggle,
    DropdownItem
} from "reactstrap";
import {
    HashRouter,
    Switch,
    Route,
    Redirect,
    RouteComponentProps
} from "react-router-dom";

export function replaceTags(str: string) {
    // Я не знаю как это сделать React-way

    /*  x.match(/\<format=(left|right|center),(\d+)\>(.*?)\<\/format\>/)
[ '<format=left,30>текст</format>',
'left',
'30',
'текст',
*/
    let cloneStr = str.slice();

    while (true) {
        const m = cloneStr.match(
            /\<format=(left|right|center),(\d+)\>(.*?)\<\/format\>/
        );
        if (!m) {
            break;
        }
        const [textToReplace, whereToPad, howManyPadStr, textInTags] = m;
        const howManyPad = parseInt(howManyPadStr);

        if (
            !(
                howManyPad &&
                (whereToPad === "left" ||
                    whereToPad === "right" ||
                    whereToPad === "center")
            )
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
                newText =
                    newText.length % 2 ? " " + newText : newText + " ";
            }
        }
        // console.info(`Replacing part '${textToReplace}' to '${newText}'`)
        cloneStr = cloneStr.replace(textToReplace, newText);
    }

    let s =
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
    return <span dangerouslySetInnerHTML={{
        __html: s
    }}/>
}
