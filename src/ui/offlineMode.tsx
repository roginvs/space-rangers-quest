import * as React from "react";
import { Loader, DivFadeinCss } from "./common";
import { LangTexts } from "./lang";

export class OfflineMode extends React.Component<
    {
        l: LangTexts;
    },
    {}
> {
    render() {
        return (
            <DivFadeinCss key="offlinemode" className="text-center">
            TODO
            </DivFadeinCss>
        )
    }
}