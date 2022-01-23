import classNames from "classnames";
import * as React from "react";
import { assertNever } from "../../../../../assertNever";
import {
  HEADER_QMM_6,
  HEADER_QMM_7,
  HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR,
  HEADER_QM_2,
  HEADER_QM_3,
  HEADER_QM_4,
} from "../../../../../lib/qmreader";
import { QuestSettingsTabProps } from "./props";

export function CompatabilitySettings({ quest, setQuest }: QuestSettingsTabProps) {
  return (
    <div className="p-4">
      {quest.header === HEADER_QMM_7_WITH_OLD_TGE_BEHAVIOUR ||
      quest.header === HEADER_QM_2 ||
      quest.header === HEADER_QM_3 ||
      quest.header === HEADER_QM_4 ? (
        <div className="">
          <p>
            Этот файл был импортирован из .qm квеста и сейчас имеет нестандартный формат вида .qm с
            картинками.
          </p>
          <p>
            Этот нестандартный формат нужен для того, чтобы плеер мог понять когда нужно включать
            старое поведение TGE (версии 4). На некоторых квестах это отличие может быть критично,
            допустим TGE4 позволяет продолжить игру если параметр достиг критичного значения но с
            локации есть переходы которые допускают критичное значение параметра.
          </p>
          <p>
            Если вы хотите сохранить .qmm файл чтобы подключить его к игре, то нужно преобразовать
            его в .qmm. Это действие необратимо, и после этого этот плеер будет играть его как
            играет TGE 5.
          </p>
          <div>
            <button
              className="btn btn-warning"
              onClick={() =>
                setQuest({
                  ...quest,
                  header: HEADER_QMM_7,
                })
              }
            >
              Преобразовать
            </button>
          </div>
        </div>
      ) : quest.header === HEADER_QMM_6 || quest.header === HEADER_QMM_7 ? (
        <div className="">Этот файл полностью совместим с форматом оригинальной игры.</div>
      ) : (
        assertNever(quest.header)
      )}
    </div>
  );
}
