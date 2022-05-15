import * as React from "react";
import { Loader, DivFadeinCss } from "./common";
import { LangTexts } from "./lang";
import { WonProofs } from "./db/defs";
import { Player, Lang } from "../lib/qmplayer/player";
import { Index, Game } from "../packGameData/defs";
import { ButtonDropdown, DropdownMenu, DropdownToggle, DropdownItem, Progress } from "reactstrap";
import { observer } from "mobx-react";
import { Store, QUEST_SEARCH_ALL, QUEST_SEARCH_OWN } from "./store";

import { AppNavbar } from "./appNavbar";
import { getGameTaskText } from "../lib/getGameTaskText";
import { DEFAULT_DAYS_TO_PASS_QUEST } from "../lib/qmplayer/defs";
import { SRDateToString } from "../lib/qmplayer/funcs";
import { QuestReplaceTags } from "./questReplaceTags";
import { getMagicSlots } from "./questList.magicSlots";
import { computed } from "mobx";

interface QuestListState {
  dropdownOpen: boolean;
}

@observer
export class QuestList extends React.Component<
  {
    store: Store;
  },
  QuestListState
> {
  state: QuestListState = {
    dropdownOpen: false,
  };
  onScroll = () => {
    this.props.store.lastQuestListScroll = window.scrollY;
  };
  componentWillUnmount() {
    window.removeEventListener("scroll", this.onScroll);
  }
  componentDidMount() {
    window.addEventListener("scroll", this.onScroll);
    if (this.props.store.lastQuestListScroll) {
      window.scrollTo(0, this.props.store.lastQuestListScroll);
    }
  }

  @computed
  get origins() {
    return this.props.store.index.quests
      .filter((x) => x.lang === this.props.store.player.lang)
      .map((x) => x.questOrigin)
      .reduce((acc, d) => (acc.indexOf(d) > -1 ? acc : acc.concat(d)), [] as string[]);
  }

  @computed
  get allQuestsForThisUser() {
    const passedQuests = this.props.store.wonProofs;
    return this.props.store.index.quests
      .filter((quest) => quest.lang === this.props.store.player.lang)
      .map((quest) => ({
        ...quest,
        passedAt: (() => {
          // Returns:
          //  - undefined if still loading
          //  - false if not passed
          //  - Date object when first passed
          //  - true is passed but date is unknown

          if (!passedQuests) {
            return undefined;
          }
          const passed = passedQuests.get(quest.gameName);
          if (typeof passed !== "object" || Object.keys(passed).length < 1) {
            return false;
          }
          const firstPassedAt = Math.min(
            ...Object.keys(passed).map(
              (key) => passed[key].performedJumps.slice(-1).pop()?.dateUnix || Infinity,
            ),
          );
          if (firstPassedAt === Infinity) {
            return true;
          }
          return new Date(firstPassedAt);
        })(),
        taskText: getGameTaskText(quest.taskText, this.props.store.player),
      }));
  }

  @computed
  get questsToShow() {
    const store = this.props.store;
    return this.allQuestsForThisUser
      .filter((quest) =>
        store.questsListTab !== QUEST_SEARCH_ALL ? quest.questOrigin === store.questsListTab : true,
      )
      .filter((quest) =>
        store.questsListSearch
          ? quest.gameName.toLowerCase().indexOf(store.questsListSearch.toLowerCase()) > -1 ||
            quest.taskText.toLowerCase().indexOf(store.questsListSearch.toLowerCase()) > -1
          : true,
      );
  }

  @computed
  get proposedSlots() {
    const allGamesInPseudoRandomOrder = this.allQuestsForThisUser
      .map((quest) => {
        // Tried to find combination which moves some nice quests to the beginning
        // const somePrimeNumbers = [3, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503];
        // const somePrimeNumbers = [439, 443, 467, 479, 487, 491, 499, 503];
        // const somePrimeNumbers = [953, 967, 971, 977, 983, 991, 997];
        const somePrimeNumbers = [967, 971, 977, 983, 991, 997];

        const isQuestFromTheGame =
          quest.questOrigin.startsWith("SR ") || quest.questOrigin.startsWith("КР ");

        const computedOrderValue = quest.gameName
          .split("")
          .map((char) => char.charCodeAt(0))
          .map(
            (charCode, index) =>
              charCode * somePrimeNumbers[index % somePrimeNumbers.length] + quest.hardness * 727,
          )
          .reduce((acc, val) => (acc + val) % 1000, 0);
        const hardcodedOrderValueForFansQuests = 2000;
        const orderValue = isQuestFromTheGame
          ? computedOrderValue
          : hardcodedOrderValueForFansQuests;

        return {
          gameName: quest.gameName,
          orderValue,
        };
      })
      .sort((a, b) => a.orderValue - b.orderValue || (a.gameName > b.gameName ? 1 : -1))
      .map((x) => x.gameName);
    const passedGamesInPassingOrder = this.allQuestsForThisUser
      .map((quest, index) => ({
        gameName: quest.gameName,
        order:
          quest.passedAt === undefined || quest.passedAt === false
            ? 0
            : quest.passedAt === true
            ? index
            : quest.passedAt.getTime(),
      }))
      .filter((x) => x.order > 0)
      .sort((a, b) => a.order - b.order)
      .map((x) => x.gameName);

    const proposedSlots = getMagicSlots(allGamesInPseudoRandomOrder, passedGamesInPassingOrder, 3);

    return proposedSlots;
  }

  render() {
    const { l } = this.props.store;

    const store = this.props.store;

    const allQuestsForThisUser = this.allQuestsForThisUser;
    const allQuestsForThisUserPassed = this.allQuestsForThisUser.filter((quest) => quest.passedAt);

    // console.info(allGamesInPseudoRandomOrder, passedGamesInPassingOrder, proposedSlots);

    return (
      <AppNavbar store={this.props.store}>
        <DivFadeinCss key="quest list" className="container mb-5">
          <div className="text-center mb-3">
            <h5>{l.welcomeHeader}</h5>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <ButtonDropdown
                style={{
                  display: "block",
                }}
                isOpen={this.state.dropdownOpen}
                toggle={() =>
                  this.setState({
                    dropdownOpen: !this.state.dropdownOpen,
                  })
                }
              >
                <DropdownToggle color="info" caret block>
                  {store.questsListTab === QUEST_SEARCH_ALL
                    ? l.all
                    : store.questsListTab === QUEST_SEARCH_OWN
                    ? l.own
                    : store.questsListTab}
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem onClick={() => (store.questsListTab = QUEST_SEARCH_ALL)}>
                    {l.all}
                  </DropdownItem>
                  <DropdownItem divider />
                  {this.origins.map((originName) => (
                    <DropdownItem
                      key={originName}
                      onClick={() => (store.questsListTab = originName)}
                    >
                      {originName}
                    </DropdownItem>
                  ))}
                  {/*
                                    <DropdownItem divider />
                                    
                                    <DropdownItem
                                        onClick={() =>
                                            this.setState({
                                                tab: OWN
                                            })
                                        }
                                    >
                                        {l.own}
                                    </DropdownItem>
                                    */}
                </DropdownMenu>
              </ButtonDropdown>
            </div>
            <div className="col-md-6 mb-3">
              <input
                className="form-control"
                value={store.questsListSearch}
                onChange={(e) => (store.questsListSearch = e.target.value)}
                onKeyUp={(e) =>
                  e.which === 27 /* ESC */ ? (store.questsListSearch = "") : undefined
                }
                placeholder={l.search}
              />
            </div>
          </div>

          {this.questsToShow.length > 0 ? (
            <>
              <div className="row mb-2 mt-0">
                {this.proposedSlots.filter((x) => x).length > 0 && true ? (
                  this.proposedSlots.map((slotGameName) =>
                    slotGameName ? (
                      <div className="col-md-4 col-12" key={slotGameName}>
                        <button
                          className="btn btn-block btn-primary py-2 mb-1"
                          style={{
                            whiteSpace: "normal",
                          }}
                          onClick={() => {
                            location.href = `#/quests/${slotGameName}`;
                          }}
                        >
                          <i className="fa fa-fw fa-star mr-1" />
                          {slotGameName}
                        </button>
                      </div>
                    ) : null,
                  )
                ) : (
                  <div className="col-12 text-center text-success">{l.allQuestPassed}</div>
                )}
              </div>

              <div className="mb-4">
                <div className="text-center">
                  {allQuestsForThisUserPassed.length}/{allQuestsForThisUser.length}
                </div>
                <Progress
                  value={(allQuestsForThisUserPassed.length / allQuestsForThisUser.length) * 100}
                />
              </div>

              <div className="list-group">
                {this.questsToShow.map((quest) => (
                  <a
                    href={`#/quests/${quest.gameName}`}
                    key={quest.gameName}
                    className="list-group-item list-group-item-action flex-column align-items-start"
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <h5 className="mb-1">{quest.gameName}</h5>
                      <small>
                        {quest.passedAt === undefined ? (
                          <i className="text-muted fa fa-spin circle-o-notch" />
                        ) : quest.passedAt !== false ? (
                          <span>{l.passed}</span>
                        ) : null}
                      </small>
                    </div>
                    <p className="mb-1 bootstrap-style">
                      <QuestReplaceTags str={quest.taskText} />
                    </p>
                    <small>{quest.smallDescription}</small>
                  </a>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center">
              <i className="fa fa-circle-o" /> {l.nothingFound}
            </div>
          )}
        </DivFadeinCss>
      </AppNavbar>
    );
  }
}
