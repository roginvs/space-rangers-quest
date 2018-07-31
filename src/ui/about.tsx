import * as React from "react";
import { Loader, DivFadeinCss } from "./common";
import { LangTexts } from "./lang";
import { Progress } from "reactstrap";
import "./version";
import { observer } from "mobx-react";
import { Store } from "./store";

@observer
export class AboutTabContainer extends React.Component<
    {
        store: Store;
    },
    {}
> {
    render() {
        const store = this.props.store;
        const l = store.l;
        return (
            <DivFadeinCss
                key="about"
                className="text-center container my-3"
            >
                    <h5>
                        <a href="https://github.com/roginvs/space-rangers-quest">https://github.com/roginvs/space-rangers-quest</a>
                    </h5>
                    <div>
                        {l.buildAt}{" "}{new Date(__VERSION__).toLocaleString()}
                        </div>
            </DivFadeinCss>
        );
    }
}
