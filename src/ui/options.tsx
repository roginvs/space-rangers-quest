import * as React from "react";
import { Loader, DivFadeinCss } from "./common";
import { LangTexts } from "./lang";
import { DB } from "./db/db";
import { Player, Lang } from "../lib/qmplayer/player";
import { observer } from "mobx-react";
import { Store } from "./store";

interface OptionsState {
  Ranger: string;
  FromPlanet: string;
  FromStar: string;
  ToPlanet: string;
  ToStar: string;
  lang: Lang;

  busy: boolean;
}

@observer
export class OptionsTabContainer extends React.Component<
  {
    store: Store;
  },
  OptionsState
> {
  state = {
    ...this.props.store.player,
    busy: false,
  };
  render() {
    const l = this.props.store.l;
    if (this.state.busy) {
      return <Loader text={l.saving} />;
    }
    return (
      <DivFadeinCss key="options" className="text-center my-3 container">
        <form>
          <div className="row">
            <div className="form-group col-md-6">
              <label>{l.ranger}</label>
              <input
                type="text"
                className="form-control"
                placeholder=""
                value={this.state.Ranger}
                onChange={(e) => this.setState({ Ranger: e.target.value })}
              />
            </div>

            <div className="form-group col-md-6">
              <label>{l.lang}</label>
              <select
                className="form-control"
                value={this.state.lang}
                onChange={(e) => this.setState({ lang: e.target.value as Lang })}
              >
                <option value="rus">{l.rus}</option>
                <option value="eng">{l.eng}</option>
              </select>
            </div>

            <div className="form-group col-md-6">
              <label>{l.fromPlanet}</label>
              <input
                type="text"
                className="form-control"
                placeholder=""
                value={this.state.FromPlanet}
                onChange={(e) => this.setState({ FromPlanet: e.target.value })}
              />
            </div>

            <div className="form-group col-md-6">
              <label>{l.fromStar}</label>
              <input
                type="text"
                className="form-control"
                placeholder=""
                value={this.state.FromStar}
                onChange={(e) => this.setState({ FromStar: e.target.value })}
              />
            </div>

            <div className="form-group col-md-6">
              <label>{l.toPlanet}</label>
              <input
                type="text"
                className="form-control"
                placeholder=""
                value={this.state.ToPlanet}
                onChange={(e) => this.setState({ ToPlanet: e.target.value })}
              />
            </div>

            <div className="form-group col-md-6">
              <label>{l.toStar}</label>
              <input
                type="text"
                className="form-control"
                placeholder=""
                value={this.state.ToStar}
                onChange={(e) => this.setState({ ToStar: e.target.value })}
              />
            </div>
          </div>
        </form>
        <div className="text-center">
          <button
            className="btn btn-primary px-5"
            onClick={() => {
              this.setState({
                busy: true,
              });
              (async () => {
                const db = this.props.store.db;
                await db.setConfigBoth("player", {
                  Ranger: this.state.Ranger,
                  Money: this.props.store.player.Money,
                  Player: this.state.Ranger,
                  FromPlanet: this.state.FromPlanet,
                  FromStar: this.state.FromStar,
                  ToPlanet: this.state.ToPlanet,
                  ToStar: this.state.ToStar,
                  lang: this.state.lang,
                });
                await db.setOwnHighscoresName(this.state.Ranger);
                const player = await db.getConfigLocal("player");
                if (!player) {
                  throw new Error("Where is the player?");
                }
                this.props.store.player = player;
                this.setState({
                  busy: false,
                });
              })().catch((e) => location.reload());
            }}
          >
            <i className="fa fa-save" /> {l.save}
          </button>
        </div>
      </DivFadeinCss>
    );
  }
}
