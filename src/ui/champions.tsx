import * as React from "react";
import { Loader, DivFadeinCss } from "./common";
import { LangTexts } from "./lang";
import { Progress } from "reactstrap";

import { observer } from "mobx-react";
import { observable, computed } from "mobx";
import { Store } from "./store";
import { ChampionPublic, FirebasePublic, GameWonProofs, WonProofTableRow } from "./db/defs";
import { DATA_DIR } from "./consts";
import { WorkerPromise } from "./worker";
import { assertNever } from "../assertNever";
import { gameNamesList } from "./db/champions";

import "./champions.css";

type QuestValidateStatus = "unknown" | "inprogress" | "validated" | "failed";
interface FirebasePublicWithValidateStatus extends FirebasePublic {
  validatedQuests: {
    gameName: string;
    validateStatus: QuestValidateStatus;
  }[];
}

interface VerifyState {
  status: "idle" | "running" | "done";
  games: { gameName: string; validateStatus: QuestValidateStatus }[];
}

const VISIBLE_GAME_NAMES = 6;

function groupProofsByGame(rows: Record<string, WonProofTableRow> | null): {
  [gameName: string]: GameWonProofs;
} {
  const grouped: { [gameName: string]: GameWonProofs } = {};
  if (!rows) {
    return grouped;
  }
  for (const key of Object.keys(rows)) {
    const row = rows[key];
    if (!row || !row.gameName || !row.proof) {
      continue;
    }
    const seed = row.proof.aleaSeed || key;
    if (!grouped[row.gameName]) {
      grouped[row.gameName] = {};
    }
    grouped[row.gameName][seed] = {
      ...row.proof,
      created: row.createdAt,
    };
  }
  return grouped;
}

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
  verifyByUserId: { [userId: string]: VerifyState } = {};

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
    this.props.store.db
      .getChampionsLeaderboard()
      .catch((e) => {
        console.warn(e);
        return null;
      })
      .then((champions) => {
        if (!this.mounted) {
          return;
        }
        this.champions = champions;
      })
      .catch((e) => console.error(e));
  }

  async verifyPlayer(champion: ChampionPublic) {
    const existing = this.verifyByUserId[champion.userId];
    if (existing && existing.status === "running") {
      return;
    }
    const initialGames = gameNamesList(champion).map((gameName) => ({
      gameName,
      validateStatus: "unknown" as QuestValidateStatus,
    }));
    this.verifyByUserId[champion.userId] = { status: "running", games: initialGames };

    try {
      const proofs = await this.props.store.db.getRemotePassings(champion.userId);
      const grouped = groupProofsByGame(proofs);
      const gameNames = Array.from(
        new Set([...gameNamesList(champion), ...Object.keys(grouped)]),
      ).sort();
      const games = gameNames.map((gameName) => ({
        gameName,
        validateStatus: "unknown" as QuestValidateStatus,
      }));
      this.verifyByUserId[champion.userId] = { status: "running", games };

      for (const gameInfo of games) {
        const game = this.props.store.index.quests.find((x) => x.gameName === gameInfo.gameName);
        const thisGameProofs = grouped[gameInfo.gameName];
        if (!game || !thisGameProofs) {
          gameInfo.validateStatus = "failed";
          continue;
        }
        try {
          gameInfo.validateStatus = "inprogress";
          const validationResult = await this.worker.checkQuest({
            questUrl: DATA_DIR + game.filename,
            logs: thisGameProofs,
          });
          gameInfo.validateStatus = validationResult === "validated" ? "validated" : "failed";
        } catch (e) {
          console.warn(`Champion verify failed`, e);
          gameInfo.validateStatus = "failed";
        }
        if (!this.mounted) {
          return;
        }
      }
      if (this.mounted) {
        this.verifyByUserId[champion.userId] = { status: "done", games };
      }
    } catch (e) {
      console.warn(e);
      if (this.mounted) {
        this.verifyByUserId[champion.userId] = { status: "done", games: initialGames };
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
        <DivFadeinCss key="champions" className="text-center">
          <Loader text={l.championsLoading} />
        </DivFadeinCss>
      );
    }

    if (!champions || champions.length === 0) {
      return (
        <DivFadeinCss key="champions" className="text-center">
          <div className="alert alert-primary">{l.championsEmpty}</div>
          <p className="champions-note">{l.championsFillHint}</p>
        </DivFadeinCss>
      );
    }

    return (
      <DivFadeinCss key="champions" className="text-center">
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
              const verify = this.verifyByUserId[champion.userId];
              const itIsYou =
                !!store.firebaseLoggedIn && champion.userId === store.firebaseLoggedIn.uid;
              const name = champion.name || l.championNoName;
              const verifying = verify && verify.status === "running";
              return (
                <tr key={champion.userId} className={itIsYou ? "champions-you" : undefined}>
                  <td className="name">{itIsYou ? <b>{name}</b> : name}</td>
                  <td className="count" data-label={l.championWonGames + ":"}>
                    <span className="champions-count">{champion.gamesWonCount}</span>
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
        <p className="champions-note">
          {l.championsShownPrefix} {champions.length}
          <br />
          {l.championsFillHint}
        </p>
      </DivFadeinCss>
    );
  }
}

@observer
export class ChampionsTabContainerOld extends React.Component<
  {
    store: Store;
  },
  {}
> {
  @observable
  champions: FirebasePublicWithValidateStatus[] | null | undefined = undefined;

  @computed
  get validationIsInProgress() {
    return this.champions
      ? this.champions.filter((champion) => {
          const validatingQuests = champion.validatedQuests.filter(
            (x) => x.validateStatus === "inprogress",
          );
          return validatingQuests.length > 0;
        }).length > 0
      : false;
  }

  @computed
  get haveValidationFailed() {
    return this.champions
      ? this.champions.filter((champion) => {
          const validateFailedQuests = champion.validatedQuests.filter(
            (x) => x.validateStatus === "failed",
          );
          return validateFailedQuests.length > 0;
        }).length > 0
      : false;
  }

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

    const validatedUnknown: QuestValidateStatus = "unknown";
    this.props.store.db
      .getFirebasePublicHighscores()
      .catch((e) => {
        console.warn(e);
        return null;
      })
      .then((champions) => {
        this.champions = champions
          ? champions
              .filter(
                (champion) =>
                  champion.gamesWonCount > 0 &&
                  // tslint:disable-next-line:strict-type-predicates
                  typeof champion.gamesWonProofs === "object",
              )
              .map((champion) => ({
                ...champion,
                validatedQuests: Object.keys(champion.gamesWonProofs).map((gameName) => ({
                  gameName,
                  validateStatus: validatedUnknown,
                })),
              }))
          : null;
      })
      .catch((e) => console.error(e));
  }

  async validateAll() {
    if (this.validationIsInProgress) {
      return;
    }
    const champions = this.champions;
    if (!champions) {
      return;
    }
    for (const champion of champions) {
      for (const questToValidate of champion.validatedQuests) {
        const game = this.props.store.index.quests.find(
          (x) => x.gameName === questToValidate.gameName,
        );
        if (!game) {
          questToValidate.validateStatus = "failed";
          continue;
        }
        try {
          // console.info(`User ${champion.userId} validating game=${questToValidate.gameName}`);
          questToValidate.validateStatus = "inprogress";

          const thisGameProofs = champion.gamesWonProofs[questToValidate.gameName];

          const validationResult = await this.worker.checkQuest({
            questUrl: DATA_DIR + game.filename,
            logs: thisGameProofs,
          });
          questToValidate.validateStatus =
            validationResult === "validated" ? "validated" : "failed";
        } catch (e) {
          console.warn(`Champion failed: `, e);
          questToValidate.validateStatus = "failed";
        }
        if (!this.mounted) {
          return;
        }
      }
    }
  }

  private validateWasStarted = false;
  private doInitialValidation() {
    if (this.validateWasStarted) {
      return;
    }
    this.validateWasStarted = true;
    this.validateAll().catch((e) => console.warn(e));
  }

  render() {
    const store = this.props.store;
    const l = store.l;
    const champions = this.champions;
    // console.info(champions);
    return (
      <DivFadeinCss key="champions" className="text-center container my-3">
        {champions ? (
          <div onClick={() => this.doInitialValidation()}>
            {this.haveValidationFailed ? (
              <div className="alert alert-primary">{l.questValidationErrorsInfo}</div>
            ) : null}
            <div className="mb-3">
              {!this.validationIsInProgress ? (
                <h5>{l.validationComplete}</h5>
              ) : (
                <i>{l.validatingInfo}</i>
              )}
            </div>

            <table className="table table-responsive">
              <thead>
                <tr>
                  <th>{l.championName}</th>
                  <th>{l.championWonGames}</th>
                  <th>{l.championGameNames}</th>
                </tr>
              </thead>
              <tbody>
                {champions
                  .slice()
                  .sort((a, b) => {
                    return (
                      b.validatedQuests.filter((x) => x.validateStatus !== "failed").length -
                      a.validatedQuests.filter((x) => x.validateStatus !== "failed").length
                    );
                  })
                  .map((champion) => {
                    try {
                      const nonFailedValidatedCount = champion.validatedQuests.filter(
                        (x) => x.validateStatus !== "failed",
                      ).length;
                      const championIsValidating =
                        champion.validatedQuests.filter((x) => x.validateStatus === "inprogress")
                          .length > 0;
                      const championHaveValidatedQuests =
                        champion.validatedQuests.filter((x) => x.validateStatus === "validated")
                          .length > 0;
                      const itIsYou =
                        store.firebaseLoggedIn && champion.userId === store.firebaseLoggedIn.uid;
                      const name = (champion.info && champion.info.name) || l.championNoName;
                      return (
                        <tr key={champion.userId}>
                          <td>{itIsYou ? <b>{name}</b> : name}</td>
                          <td
                            className={
                              !championIsValidating && championHaveValidatedQuests
                                ? "text-success"
                                : ""
                            }
                          >
                            {nonFailedValidatedCount}{" "}
                            {!championIsValidating && championHaveValidatedQuests ? (
                              <i className="fa fa-check" />
                            ) : championIsValidating ? (
                              <i className="fa fa-spin fa-spinner" />
                            ) : null}
                            <br />
                          </td>
                          <td>
                            {champion.validatedQuests.map((gameInfo, idx) => {
                              const comma = idx === 0 ? "" : ", ";

                              const gameInfoView =
                                gameInfo.validateStatus === "validated" ? (
                                  <a href={`#/quests/${gameInfo.gameName}`}>{gameInfo.gameName}</a>
                                ) : gameInfo.validateStatus === "inprogress" ? (
                                  <span className="champions-blink text-warning">
                                    {gameInfo.gameName}
                                  </span>
                                ) : gameInfo.validateStatus === "failed" ? (
                                  <span>
                                    <s>{gameInfo.gameName}</s>
                                  </span>
                                ) : gameInfo.validateStatus === "unknown" ? (
                                  <span>{gameInfo.gameName}</span>
                                ) : (
                                  assertNever(gameInfo.validateStatus)
                                );
                              return (
                                <span key={gameInfo.gameName}>
                                  {comma}
                                  {gameInfoView}
                                </span>
                              );
                            })}
                          </td>
                        </tr>
                      );
                    } catch (e) {
                      console.warn(`User error`, e);
                      return null;
                    }
                  })}
              </tbody>
            </table>
            <div className="my-3 text-center">
              <i>
                {l.championsTotal} {champions.length}
              </i>
            </div>
          </div>
        ) : (
          <Loader text={l.championsLoading} />
        )}
      </DivFadeinCss>
    );
  }
}
