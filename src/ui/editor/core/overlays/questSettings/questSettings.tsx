import classNames from "classnames";
import * as React from "react";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { Quest } from "../../../../../lib/qmplayer/funcs";
import { WhenDone } from "../../../../../lib/qmreader";
import { Overlay } from "../../overlay";
import { QuestMainSettings } from "./mainSettings";

// tslint:disable-next-line:no-useless-cast
const TABS = ["main", "params", "strings", "grid", "jumps", "version"] as const;

export function QuestSettings({
  initialQuest,
  onClose,
}: {
  initialQuest: Quest;
  onClose: (newQuest: Quest | undefined) => void;
}) {
  const [quest, setQuest] = React.useState(initialQuest);

  React.useEffect(() => {
    setQuest(initialQuest);
  }, [initialQuest]);

  const [isPrompting, setIsPrompting] = React.useState(false);
  React.useEffect(() => {
    if (!isPrompting) {
      return;
    }
    const timerId = window.setTimeout(() => setIsPrompting(false), 5000);
    return () => window.clearTimeout(timerId);
  });

  const isChanged = quest !== initialQuest;

  const onCloseWithPrompt = React.useCallback(() => {
    if (!isChanged) {
      onClose(undefined);
      return;
    }

    if (isPrompting) {
      onClose(undefined);
    } else {
      setIsPrompting(true);
    }
  }, [isChanged, isPrompting]);

  const [activeTab, setActiveTab] = React.useState<typeof TABS[number]>("main");

  const tabLabels: Record<typeof TABS[number], string> = {
    main: "Основные",
    params: "Параметры",
    strings: "Строки",
    grid: "Сетка",
    jumps: "Переходы",
    version: "Версия",
  };

  return (
    <Overlay
      wide
      position="absolute"
      headerText={`Общая информация по квесту`}
      onClose={onCloseWithPrompt}
    >
      <div>
        <div>
          <Nav tabs>
            {TABS.map((tab) => (
              <NavItem key={tab}>
                {" "}
                <NavLink
                  className={classNames({ active: activeTab === tab })}
                  onClick={() => setActiveTab(tab)}
                >
                  {tabLabels[tab]}
                </NavLink>
              </NavItem>
            ))}
          </Nav>
          <TabContent activeTab={activeTab}>
            <TabPane tabId="main">
              <QuestMainSettings quest={quest} setQuest={setQuest} />
            </TabPane>
            <TabPane tabId="params">lol2</TabPane>
          </TabContent>
        </div>

        <div className="d-flex">
          <div />
          <button
            className="btn btn-primary ml-auto mr-2"
            disabled={!isChanged}
            onClick={() => onClose(quest)}
          >
            Сохранить
          </button>
          <button className="btn btn-danger" onClick={onCloseWithPrompt}>
            {!isPrompting ? "Закрыть" : "Точно закрыть?"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
