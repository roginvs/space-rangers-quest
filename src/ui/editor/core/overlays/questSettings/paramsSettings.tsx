import classNames from "classnames";
import * as React from "react";
import { toast } from "react-toastify";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { DeepImmutable } from "../../../../../lib/qmplayer/deepImmutable";
import { Quest } from "../../../../../lib/qmplayer/funcs";
import {
  ParamCritType,
  ParamType,
  QMParam,
  QMParamShowInfo,
  QMParamShowInfoPart,
} from "../../../../../lib/qmreader";
import { addParameter, removeLastParameter, updateParamWithFixMaxMin } from "../../actions";
import { checkFormula, FormulaInput } from "../../common/formulaInput";
import { getParamStringInfo } from "../../hovers/paramsAndChangeConditionsSummary";
import { MediaEdit } from "../MediaEdit";
import { QuestSettingsTabProps } from "./props";

function StartingValueInput({
  className,
  value,
  onChange,
  disabled,
}: {
  className: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const visibleValue = value.replace(/^\[/, "").replace(/\]$/, "");

  // No parameters because parameter initial value can not reference other parameters
  const isError = checkFormula(value, []);

  return (
    <input
      disabled={disabled}
      className={classNames(className, isError ? "is-invalid" : "")}
      value={visibleValue}
      onChange={(e) => {
        if (!e.target.value) {
          onChange("[0]");
        } else {
          onChange(`[${e.target.value}]`);
        }
      }}
      title={(isError ? `${isError}\n` : "") + "Пример: 1; 2; 4; [22..55]; 70"}
    />
  );
}

function QuestParamShowingRangeSettings({
  param,
  setParam,
}: //quest,
{
  param: DeepImmutable<QMParam>;
  setParam: (newParam: DeepImmutable<QMParam>) => void;
  // quest: Quest;
}) {
  return (
    <>
      <div
        style={{
          overflowY: "scroll",
          height: 400,
        }}
      >
        <div className="d-flex align-items-center mb-2">
          <div className="text-center mr-3" style={{ width: "15%" }}>
            От
          </div>
          <div className="text-center mr-3" style={{ width: "15%" }}>
            До
          </div>
          <div className="text-center mr-2 ml-auto" style={{ width: "100%" }}>
            Текст
          </div>
          <div style={{ width: 16 }}></div>
        </div>
        {param.showingInfo.map((showingInfo, index) => {
          const fromDisabled = index === 0;
          const toDisabled = index === param.showingInfo.length - 1;

          const prevRange = index > 0 ? param.showingInfo[index - 1] : null;
          const nextRange =
            index < param.showingInfo.length - 1 ? param.showingInfo[index + 1] : null;

          const setShowingInfo = (newShowingInfo: DeepImmutable<QMParamShowInfoPart>) => {
            setParam({
              ...param,
              showingInfo: param.showingInfo.map((si, i) => (i === index ? newShowingInfo : si)),
            });
          };
          return (
            <div key={index} className="d-flex align-items-center mb-2">
              <input
                disabled={!param.active || fromDisabled}
                className="form-control mr-3"
                style={{ width: "15%" }}
                type="number"
                value={showingInfo.from}
                min={prevRange ? prevRange.to + 1 : param.min}
                max={showingInfo.to}
                onChange={(e) => setShowingInfo({ ...showingInfo, from: parseInt(e.target.value) })}
              />

              <input
                disabled={!param.active || toDisabled}
                className="form-control mr-3"
                style={{ width: "15%" }}
                type="number"
                min={showingInfo.from}
                max={nextRange ? nextRange.from - 1 : param.max}
                value={showingInfo.to}
                onChange={(e) => setShowingInfo({ ...showingInfo, to: parseInt(e.target.value) })}
              />

              <input
                disabled={!param.active}
                className="form-control w-100 mr-2"
                value={showingInfo.str}
                onChange={(e) => setShowingInfo({ ...showingInfo, str: e.target.value })}
              />

              <i
                className={classNames(
                  "fa fa-times ml-auto mr-2",
                  param.showingInfo.length > 1 ? "" : "text-muted",
                )}
                style={{
                  cursor: !param.active
                    ? ""
                    : param.showingInfo.length > 1
                    ? "pointer"
                    : "not-allowed",
                }}
                role="button"
                aria-disabled={!param.active || param.showingInfo.length <= 1}
                aria-label="Удалить диапазон"
                onClick={() => {
                  if (!param.active) {
                    return;
                  }
                  const newShowingInfos = param.showingInfo.filter((_, i) => i !== index);
                  const fixedRanges = newShowingInfos
                    .map((curr, idx) => {
                      const next =
                        idx < newShowingInfos.length - 1 ? newShowingInfos[idx + 1] : null;
                      if (next) {
                        if (curr.to + 1 < next.from) {
                          return {
                            from: curr.from,
                            to: next.from - 1,
                            str: curr.str,
                          };
                        }
                      }
                      return curr;
                    })
                    .map((curr, idx) => {
                      return {
                        from: idx === 0 ? param.min : curr.from,
                        to: idx === newShowingInfos.length - 1 ? param.max : curr.to,
                        str: curr.str,
                      };
                    });
                  setParam({
                    ...param,
                    showingInfo: fixedRanges,
                  });
                }}
              />
            </div>
          );
        })}

        <div className="d-flex mt-4 pb-3">
          <button
            className="ml-auto btn btn-light"
            disabled={param.max - param.min < param.showingInfo.length || !param.active}
            onClick={() => {
              // TODO: maybe more intelligent way to add new range
              setParam({
                ...param,
                showingInfo: [
                  ...param.showingInfo,
                  {
                    from: param.max,
                    to: param.max,
                    str: `<>`,
                  },
                ],
              });
            }}
          >
            + добавить диапазон
          </button>
        </div>
      </div>
    </>
  );
}

function QuestParamSettings({
  param,
  setParam,
  quest,
}: {
  param: DeepImmutable<QMParam>;
  setParam: (newParam: DeepImmutable<QMParam>) => void;
  quest: Quest;
}) {
  const paramTypeNames = ["Обычный", "Провальный", "Успешный", "Смертельный"];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <label className="form-check-label ml-4">
          <input
            className="form-check-input"
            type="checkbox"
            checked={param.active}
            onChange={(e) =>
              setParam({
                ...param,
                active: !param.active,
              })
            }
          />
          Включен
        </label>

        <label className="form-check-label ml-4">
          <input
            className="form-check-input"
            type="checkbox"
            checked={param.isMoney}
            onChange={(e) => {
              if (!param.isMoney) {
                const paramIdMoney = quest.params.findIndex((p, pId) => p.isMoney);
                if (paramIdMoney !== -1) {
                  toast(`Параметр [p${paramIdMoney + 1}] уже является деньгами игрока`);
                  return;
                }
              }
              setParam({
                ...param,
                isMoney: !param.isMoney,
              });
            }}
            disabled={!param.active}
          />
          Деньги игрока
        </label>

        <label className="form-check-label ml-4">
          <input
            className="form-check-input"
            type="checkbox"
            checked={param.showWhenZero}
            onChange={(e) =>
              setParam({
                ...param,
                showWhenZero: !param.showWhenZero,
              })
            }
            disabled={!param.active}
          />
          Показывать при нуле
        </label>
      </div>
      <div className="d-flex align-items-center mb-2">
        <label className="form-check-label" style={{ flexShrink: 0 }}>
          Рабочее название
        </label>
        <input
          disabled={!param.active}
          className="form-control w-100 ml-2"
          value={param.name}
          onChange={(e) => setParam({ ...param, name: e.target.value })}
        />
      </div>

      <div className="d-flex align-items-center justify-content-around mb-2">
        {paramTypeNames.map((typeName, typeIndex) => (
          <label key={typeIndex} className="form-check-label ml-4">
            <input
              className="form-check-input"
              type="radio"
              disabled={!param.active}
              checked={param.type === typeIndex}
              onChange={() =>
                setParam({
                  ...param,
                  type: typeIndex,
                })
              }
            />
            {typeName}
          </label>
        ))}
      </div>

      <div className="d-flex align-items-center justify-content-around mb-2 mt-3">
        <label className="form-check-label" style={{ flexShrink: 0 }}>
          Мин
        </label>
        <input
          disabled={!param.active}
          className="form-control ml-2 mr-3"
          type="number"
          value={param.min}
          onChange={(e) => setParam({ ...param, min: parseInt(e.target.value) })}
        />

        <label className="form-check-label" style={{ flexShrink: 0 }}>
          Макс
        </label>
        <input
          disabled={!param.active}
          className="form-control ml-2 mr-3"
          type="number"
          value={param.max}
          onChange={(e) => setParam({ ...param, max: parseInt(e.target.value) })}
        />
      </div>

      <div className="d-flex align-items-center mb-2">
        <label className="form-check-label" style={{ flexShrink: 0 }}>
          Стартовое значение
        </label>
        <StartingValueInput
          disabled={!param.active}
          className="form-control w-100 ml-2"
          value={param.starting}
          onChange={(newValue) => setParam({ ...param, starting: newValue })}
        />
      </div>

      {param.type !== ParamType.Обычный ? (
        <>
          <div className="d-flex align-items-center justify-content-around mt-3 mb-2">
            <label className="form-check-label ml-4 mr-2">
              <input
                className="form-check-input"
                type="radio"
                disabled={!param.active}
                checked={param.critType === ParamCritType.Минимум}
                onChange={(e) =>
                  setParam({
                    ...param,
                    critType: ParamCritType.Минимум,
                  })
                }
              />
              Критичный минимум
            </label>

            <label className="form-check-label ml-4">
              <input
                className="form-check-input"
                type="radio"
                disabled={!param.active}
                checked={param.critType === ParamCritType.Максимум}
                onChange={(e) =>
                  setParam({
                    ...param,
                    critType: ParamCritType.Максимум,
                  })
                }
              />
              Критичный максимум
            </label>
          </div>

          <textarea
            style={{
              resize: "none",
            }}
            className={classNames("form-control h-100")}
            rows={4}
            disabled={!param.active}
            value={param.critValueString}
            onChange={(e) => {
              setParam({ ...param, critValueString: e.target.value });
            }}
          />
          <MediaEdit
            disabled={!param.active}
            media={param}
            setMedia={(media) =>
              setParam({ ...param, img: media.img, track: media.track, sound: media.sound })
            }
          />
        </>
      ) : null}
    </div>
  );
}

export function QuestParamsSettings({ quest, setQuest }: QuestSettingsTabProps) {
  const [paramId, setParamId] = React.useState(0);

  const [activeTab, setActiveTab] = React.useState<"basic" | "strings">("basic");

  return (
    <>
      <div className="row mt-3">
        <div className="col-6">
          <select
            className="form-control"
            value={paramId}
            size={22}
            onChange={(e) => setParamId(parseInt(e.target.value))}
          >
            {quest.params.map((param, idx) => {
              const textName = `[p${idx + 1}] (${param.name})`;
              return (
                <option className={param.active ? "" : "text-muted"} value={idx} key={idx}>
                  {textName}
                </option>
              );
            })}
          </select>

          <div className="mt-2 d-flex justify-content-center">
            <button
              className="btn btn-danger mr-2"
              disabled={quest.params.length === 0 || paramId !== quest.paramsCount - 1}
              onClick={() => {
                setQuest(removeLastParameter(quest));
                setParamId(paramId - 1);
              }}
              title={
                quest.params.length === 0
                  ? "Нет параметров"
                  : paramId !== quest.paramsCount - 1
                  ? "Удалить можно только последний параметр"
                  : ""
              }
            >
              Удалить параметр
            </button>

            <button
              className="btn btn-light mr-2"
              onClick={() => {
                setQuest(addParameter(quest));
                setParamId(quest.paramsCount);
              }}
            >
              Добавить параметр
            </button>
          </div>
        </div>

        <div className="col-6">
          {quest.params[paramId] && (
            <>
              <Nav tabs>
                <NavItem>
                  <NavLink
                    className={classNames({ active: activeTab === "basic" })}
                    onClick={() => setActiveTab("basic")}
                  >
                    Основные характеристики
                  </NavLink>
                </NavItem>

                <NavItem>
                  <NavLink
                    className={classNames({ active: activeTab === "strings" })}
                    onClick={() => setActiveTab("strings")}
                  >
                    Формат вывода при игре
                  </NavLink>
                </NavItem>
              </Nav>
              <TabContent activeTab={activeTab}>
                <TabPane tabId="basic" className="pt-2">
                  <QuestParamSettings
                    param={quest.params[paramId]}
                    setParam={(newParam) => {
                      setQuest(updateParamWithFixMaxMin(quest, paramId, newParam));
                    }}
                    quest={quest}
                  />
                </TabPane>

                <TabPane tabId="strings" className="pt-2">
                  <QuestParamShowingRangeSettings
                    param={quest.params[paramId]}
                    setParam={(newParam) => {
                      setQuest({
                        ...quest,
                        params: quest.params.map((param, idx) =>
                          idx === paramId ? newParam : param,
                        ),
                      });
                    }}
                  />
                </TabPane>
              </TabContent>
            </>
          )}
        </div>
      </div>
    </>
  );
}
