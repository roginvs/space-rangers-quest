import classNames from "classnames";
import * as React from "react";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { Quest } from "../../../lib/qmplayer/funcs";
import { Overlay } from "./overlay";

// tslint:disable-next-line:no-useless-cast
const TABS = ["main", "params", "strings", "grid", "jumps", "version"] as const;

/*
type QuestNumberFlags<ALL extends keyof Quest = keyof Quest> = Quest[ALL] extends number
  ? ALL
  : never;
*/
type QuestNumberFlags = "givingRace";
function CheckboxFlagsSet<T extends QuestNumberFlags>({
  quest,
  setQuest,
  labels,
  questKey,
}: {
  quest: Quest;
  setQuest: (newQuest: Quest) => void;
  labels: (string | null)[];
  questKey: T;
}) {
  return (
    <>
      {labels.map((label, i) => {
        if (label === null) {
          return null;
        }
        const isChecked = !!(quest[questKey] & (1 << i));
        const toggle = () => {
          const newValue = isChecked ? quest[questKey] - (1 << i) : quest[questKey] + (1 << i);
          setQuest({ ...quest, [questKey]: newValue });
        };
        return (
          <div className="ml-3 form-check form-check-inline" key={i}>
            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                checked={isChecked}
                onChange={toggle}
              />
              {label}
            </label>
          </div>
        );
      })}
    </>
  );
}

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

  const givingRaceNames = ["Малоки", "Пеленги", "Люди", "Фэяне", "Гаальцы"];
  const playerRaceNames = ["Малок", "Пеленг", "Человек", "Фэянин", "Гаалец"];
  const planetRaceNames = ["Малоки", "Пеленги", "Люди", "Фэяне", "Гаальцы", null, "Незаселённая"];
  const playerCareerNames = ["Торговец", "Пират", "Воин"];

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
              <h4>Tab 1 Contents</h4>
              <div className="row">
                <div className="col-4>">
                  <div className="text-center">Раса, дающаяя квест</div>
                  <CheckboxFlagsSet
                    quest={quest}
                    setQuest={setQuest}
                    questKey="givingRace"
                    labels={givingRaceNames}
                  />
                </div>
              </div>
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
