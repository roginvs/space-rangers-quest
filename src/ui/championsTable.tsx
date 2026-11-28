import * as React from "react";
import { Loader, DivFadeinCss } from "./common";

import { observer } from "mobx-react";
import { observable, ObservableMap } from "mobx";
import { Store } from "./store";
import { ChampionPublic } from "./db/defs";
import { DATA_DIR } from "./consts";
import { WorkerPromise } from "./worker";
import { championSeeds, gameNamesList } from "./db/champions";
import { verifyChampionGame } from "./championsVerify";
import { ChampionsCursor } from "./db/championsPage";
import { NearBottomSentinel } from "./nearBottomSentinel";

import "./champions.css";

type QuestValidateStatus = "unknown" | "inprogress" | "validated" | "failed";

interface VerifyState {
  status: "idle" | "running" | "done";
  games: { gameName: string; validateStatus: QuestValidateStatus }[];
}

const VISIBLE_GAME_NAMES = 6;

@observer
export class ChampionsTabContainer extends React.Component<
  {
    store: Store;
  },
  {}
> {
  @observable
  champions: ChampionPublic[] | null | undefined = undefined;

  @observable
  verifyByUserId: ObservableMap<string, VerifyState> = observable.map();

  @observable
  hasMore = false;

  @observable
  loadingMore = false;

  private cursor: ChampionsCursor | null = null;
  private loadInFlight = false;
  private firstPageLoaded = false;

  private mounted = false;
  private readonly worker: WorkerPromise = new WorkerPromise("worker.js");
  private readonly onUnmount: (() => void)[] = [
    () => (this.mounted = false),
    () => this.worker.destroy(),
  ];
  componentWillUnmount() {
    this.onUnmount.forEach((f) => f());
  }

  componentDidMount() {
    this.mounted = true;
    this.loadMore().catch((e) => console.error(e));
  }

  private async loadMore() {
    if (this.loadInFlight) {
      return;
    }
    if (this.firstPageLoaded && !this.hasMore) {
      return;
    }
    this.loadInFlight = true;
    if (this.firstPageLoaded) {
      this.loadingMore = true;
    }
    try {
      const page = await this.props.store.db.getChampionsPage(this.cursor);
      if (!this.mounted) {
        return;
      }
      if (!page) {
        if (!this.firstPageLoaded) {
          this.champions = null;
        }
        this.hasMore = false;
        return;
      }
      const existing = this.champions || [];
      const seen: { [userId: string]: true } = {};
      for (const row of existing) {
        seen[row.userId] = true;
      }
      const added = page.rows.filter((row) => !seen[row.userId]);
      this.champions = existing.concat(added);
      this.cursor = page.cursor;
      this.hasMore = page.hasMore;
      this.firstPageLoaded = true;
    } catch (e) {
      console.warn(e);
      if (!this.firstPageLoaded) {
        this.champions = null;
      }
      this.hasMore = false;
    } finally {
      this.loadInFlight = false;
      this.loadingMore = false;
    }
  }

  async verifyPlayer(champion: ChampionPublic) {
    const existing = this.verifyByUserId.get(champion.userId);
    if (existing && existing.status === "running") {
      return;
    }
    const initialGames = gameNamesList(champion).map((gameName) => ({
      gameName,
      validateStatus: "unknown" as QuestValidateStatus,
    }));
    this.verifyByUserId.set(champion.userId, { status: "running", games: initialGames });

    try {
      const state = this.verifyByUserId.get(champion.userId);
      const games = state ? state.games : [];
      for (const gameInfo of games) {
        const game = this.props.store.index.quests.find((x) => x.gameName === gameInfo.gameName);
        const seeds = championSeeds(champion, gameInfo.gameName);
        if (!game || seeds.length === 0) {
          gameInfo.validateStatus = "failed";
          continue;
        }
        gameInfo.validateStatus = "inprogress";
        const { result } = await verifyChampionGame(
          seeds,
          (seed) => this.props.store.db.getChampionProof(champion.userId, gameInfo.gameName, seed),
          (seed, proof) =>
            this.worker.checkQuest({
              questUrl: DATA_DIR + game.filename,
              logs: { [seed]: proof },
            }),
        );
        gameInfo.validateStatus = result;
        if (!this.mounted) {
          return;
        }
      }
      if (this.mounted) {
        this.verifyByUserId.set(champion.userId, { status: "done", games: games.slice() });
      }
    } catch (e) {
      console.warn(e);
      if (this.mounted) {
        this.verifyByUserId.set(champion.userId, { status: "done", games: initialGames });
      }
    }
  }

  private renderGameNames(champion: ChampionPublic, verify?: VerifyState) {
    const l = this.props.store.l;
    if (verify && verify.games.length > 0) {
      return verify.games.map((gameInfo, idx) => {
        const comma = idx === 0 ? "" : ", ";
        const gameInfoView =
          gameInfo.validateStatus === "validated" ? (
            <a href={`#/quests/${gameInfo.gameName}`}>{gameInfo.gameName}</a>
          ) : gameInfo.validateStatus === "inprogress" ? (
            <span className="champions-blink text-warning">{gameInfo.gameName}</span>
          ) : gameInfo.validateStatus === "failed" ? (
            <s>{gameInfo.gameName}</s>
          ) : (
            <span>{gameInfo.gameName}</span>
          );
        return (
          <span key={gameInfo.gameName}>
            {comma}
            {gameInfoView}
          </span>
        );
      });
    }

    const names = gameNamesList(champion);
    const visible = names.slice(0, VISIBLE_GAME_NAMES);
    const hidden = names.length - visible.length;
    return (
      <span className="champions-games">
        {visible.map((gameName, idx) => (
          <span key={gameName}>
            {idx === 0 ? "" : ", "}
            <a href={`#/quests/${gameName}`}>{gameName}</a>
          </span>
        ))}
        {hidden > 0 ? (
          <span className="text-muted"> {l.championsAndMore.replace("{n}", String(hidden))}</span>
        ) : null}
      </span>
    );
  }

  render() {
    const store = this.props.store;
    const l = store.l;
    const champions = this.champions;

    if (champions === undefined) {
      return (
        <DivFadeinCss key="champions" className="text-center container my-3">
          <Loader text={l.championsLoading} />
        </DivFadeinCss>
      );
    }

    if (!champions || champions.length === 0) {
      return (
        <DivFadeinCss key="champions" className="text-center container my-3">
          <div className="alert alert-primary">{l.championsEmpty}</div>
          <p className="text-muted my-3">{l.championsFillHint}</p>
        </DivFadeinCss>
      );
    }

    return (
      <DivFadeinCss key="champions" className="text-center container my-3">
        <table className="table champions-table">
          <thead>
            <tr>
              <th>{l.championName}</th>
              <th>{l.championWonGames}</th>
              <th>{l.championGameNames}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {champions.map((champion) => {
              const verify = this.verifyByUserId.get(champion.userId);
              const itIsYou =
                !!store.firebaseLoggedIn && champion.userId === store.firebaseLoggedIn.uid;
              const name = champion.name || l.championNoName;
              const verifying = verify && verify.status === "running";
              return (
                <tr key={champion.userId} className={itIsYou ? "champions-you" : undefined}>
                  <td className="name">{itIsYou ? <b>{name}</b> : name}</td>
                  <td className="count" data-label={l.championWonGames + ":"}>
                    <span className="game-menu-row-passed">{champion.gamesWonCount}</span>
                  </td>
                  <td className="games">{this.renderGameNames(champion, verify)}</td>
                  <td className="verify">
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={verifying}
                      onClick={() => this.verifyPlayer(champion)}
                    >
                      {verifying ? (
                        <>
                          <i className="fa fa-spin fa-spinner" /> {l.championVerifying}
                        </>
                      ) : (
                        l.championVerify
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <NearBottomSentinel
          enabled={this.hasMore && !this.loadingMore}
          onNearBottom={() => this.loadMore()}
        />
        {this.loadingMore ? (
          <p className="text-muted my-3">
            <i className="fa fa-spin fa-spinner" /> {l.championsLoading}
          </p>
        ) : null}
        <p className="text-muted my-3">
          {l.championsShownPrefix} {champions.length}
          <br />
          {l.championsFillHint}
        </p>
      </DivFadeinCss>
    );
  }
}
