import * as React from "react";
import { Loader, DivFadeinCss } from "./common";
import { LangTexts } from "./lang";
import { Container } from "reactstrap";

export class OfflineModeTabContainer extends React.Component<
    {
        l: LangTexts;
    },
    {}
> {
    render() {
        return (            
            <DivFadeinCss key="offlinemode" className="text-center container my-3">            
            TODO            
            </DivFadeinCss>            
        )
    }
}