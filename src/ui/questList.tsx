import * as React from "react";
import { Loader, DivFadeinCss } from "./common";
import { LangTexts } from "./lang";
import { WonProofs } from "./db/defs";
import { Player, Lang } from "../lib/qmplayer/player";
import { Index, Game } from "../packGameData/defs";
import { ButtonDropdown, DropdownMenu, DropdownToggle, DropdownItem } from "reactstrap";
import { observer } from "mobx-react";
import { Store, QUEST_SEARCH_ALL, QUEST_SEARCH_OWN } from "./store";

import { AppNavbar } from "./appNavbar";
import { getGameTaskText } from "../lib/getGameTaskText";
import { DEFAULT_DAYS_TO_PASS_QUEST } from "../lib/qmplayer/defs";
import { SRDateToString } from "../lib/qmplayer/funcs";
import { QuestReplaceTags } from "./questReplaceTags";
import { getMagicSlots } from "./questList.magicSlots";

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
  render() {
    const { l, player, index } = this.props.store;
    const passedQuests = this.props.store.wonProofs;
    const store = this.props.store;

    const origins = index.quests
      .filter((x) => x.lang === player.lang)
      .map((x) => x.questOrigin)
      .reduce((acc, d) => (acc.indexOf(d) > -1 ? acc : acc.concat(d)), [] as string[]);

    const allQuestsForThisUser = index.quests
      .filter((quest) => quest.lang === player.lang)
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
        taskText: getGameTaskText(quest.taskText, player),
      }));

    const questsToShow = allQuestsForThisUser
      .filter((quest) =>
        store.questsListTab !== QUEST_SEARCH_ALL ? quest.questOrigin === store.questsListTab : true,
      )
      .filter((quest) =>
        store.questsListSearch
          ? quest.gameName.toLowerCase().indexOf(store.questsListSearch.toLowerCase()) > -1 ||
            quest.taskText.toLowerCase().indexOf(store.questsListSearch.toLowerCase()) > -1
          : true,
      );
    const questsToShowUnpassed = questsToShow.filter((x) => x.passedAt === false);

    const allGamesInPseudoRandomOrder = allQuestsForThisUser
      .map((quest) => ({
        gameName: quest.gameName,
        orderValue: quest.gameName
          .split("")
          .map((char) => char.charCodeAt(0))
          .map((charCode, index) => charCode * 953 * (index % 7) + quest.hardness * 449)
          .reduce((acc, val) => (acc + val) % 1000, 0),
      }))
      .sort((a, b) => a.orderValue - b.orderValue)
      .map((x) => x.gameName);
    const passedGamesInPassingOrder = allQuestsForThisUser
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
    console.info(allGamesInPseudoRandomOrder, passedGamesInPassingOrder, proposedSlots);

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
                  {origins.map((originName) => (
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
          {questsToShow.length > 0 ? (
            <>
              <button
                className="btn btn-block btn-primary mb-3"
                style={{
                  whiteSpace: "normal",
                }}
                disabled={questsToShowUnpassed.length === 0}
                onClick={() => {
                  const idx = Math.floor(Math.random() * questsToShowUnpassed.length);
                  const quest = questsToShowUnpassed[idx];
                  if (!quest) {
                    return;
                  }
                  location.href = `#/quests/${quest.gameName}`;
                }}
              >
                <div className="d-flex align-items-center justify-content-center">
                  {questsToShowUnpassed.length > 0 ? (
                    <>
                      <span className="mr-1">
                        <i className="fa fa-random fa-fw" />
                      </span>
                      <span>
                        {l.startRandomUnpassed} ({questsToShow.length - questsToShowUnpassed.length}
                        /{questsToShow.length})
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="mr-1">
                        <i className="fa fa-thumbs-up  fa-fw" />
                      </span>
                      <span>
                        {l.allQuestPassed} ({questsToShow.length})
                      </span>
                    </>
                  )}
                </div>
              </button>

              <div className="list-group">
                {questsToShow.map((quest) => (
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
