import * as React from "react";
import { Loader, DivFadeinCss } from "./common";
import { LangTexts } from "./lang";
import { Progress } from "reactstrap";
import "./version";
import { observer } from "mobx-react";
import { Store } from "./store";

const GITHUB_LINK = "https://github.com/roginvs/space-rangers-quest";
const PIKABU_LINK =
  "https://pikabu.ru/story/kvestyi_iz_kosmicheskikh_reyndzherov_v_brauzere_5526211";

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
      <DivFadeinCss key="about" className="text-center container my-3">
        <h5 className="mb-3" style={{ wordWrap: "break-word" }}>
          <a href={GITHUB_LINK}>{GITHUB_LINK}</a>
        </h5>
        <div className="mb-3">
          <div>{l.linkForBugreports}</div>
          <div style={{ wordWrap: "break-word" }}>
            <a href={PIKABU_LINK}>{PIKABU_LINK}</a>
          </div>
        </div>
        <div className="mb-3">
          {l.builtAt} {new Date(__VERSION__).toLocaleString()}
        </div>
      </DivFadeinCss>
    );
  }
}
