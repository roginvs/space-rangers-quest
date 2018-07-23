import * as React from "react";
import { Loader, DivFadeinCss, Tabs } from "./common";
import { LangTexts } from "./lang";
import { DB } from "./db";
import { Player, Lang } from "../lib/qmplayer/player";
import { Index, Game } from "../packGameData";

interface QuestListState {    
    tab: string,
    search: string,
}

export class QuestList extends React.Component<
    {
        l: LangTexts;
        index: Index,
        player: Player,
        onQuestSelect: (gameName: string) => void,
    },
    QuestListState
> {
    state = {
        tab: "all",
        search: "",
    }
    render() {
        const l = this.props.l;

        const index = this.props.index;
        const origins = index.quests
        .filter(x => x.lang === this.props.player.lang)
        .map(x => x.questOrigin)
            .reduce((acc, d) => acc.indexOf(d) > -1  ? acc : acc.concat(d), [] as string[]);

        return (
            <DivFadeinCss key="quest list" className="">
            <div className="text-center"><h5>{l.welcomeHeader}</h5></div>
            <Tabs tabs={[l.all, ...origins, l.own].map(x => <span>{x}</span>)}>

            </Tabs>
            </DivFadeinCss>
        )
    }
}