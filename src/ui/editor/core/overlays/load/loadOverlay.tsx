import classNames from "classnames";
import * as pako from "pako";
import * as React from "react";
import { toast } from "react-toastify";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { Quest } from "../../../../../lib/qmplayer/funcs";
import { parse } from "../../../../../lib/qmreader";
import { Game } from "../../../../../packGameData";
import { DATA_DIR } from "../../../../consts";
import { Overlay } from "../../overlay";

export function LoadOverlay({
  onClose,
  questsToLoad,
}: {
  onClose: (newQuest: Quest | undefined) => void;
  questsToLoad: Game[];
}) {
  const [existingId, setExistingId] = React.useState(0);
  return (
    <Overlay
      wide
      position="absolute"
      headerText={`Загрузка квеста`}
      onClose={() => onClose(undefined)}
    >
      <div className="row">
        <div className="col-6">
          <label>Загрузить квест из существующих</label>
          <select
            className="form-control mb-1"
            value={existingId}
            size={20}
            onChange={(e) => setExistingId(parseInt(e.target.value))}
          >
            {questsToLoad.map((game, idx) => {
              return (
                <option value={idx} key={idx}>
                  {game.gameName} ({game.questOrigin})
                </option>
              );
            })}
          </select>
          <button
            className="btn btn-primary w-100"
            disabled={!questsToLoad[existingId]}
            onClick={() => {
              fetch(DATA_DIR + questsToLoad[existingId].filename)
                .then((res) => res.arrayBuffer())
                .then((questArrayBuffer) => {
                  const quest = parse(Buffer.from(pako.ungzip(Buffer.from(questArrayBuffer))));
                  onClose(quest);
                })
                .catch((e) => toast(e.message));
            }}
          >
            Загрузить {questsToLoad[existingId]?.gameName || ""}
          </button>
        </div>

        <div className="col-6">
          <label>Загрузить квест из файла</label>
          <input
            type="file"
            className="form-control-file"
            accept=".qm,.qmm,.qmm.gz,.qm.gz"
            onChange={(e) => {
              if (!e.target.files) {
                return;
              }

              const file = e.target.files[0];
              if (!file) {
                return;
              }

              file.arrayBuffer().then((questArrayBuffer) => {
                const unzipped = file.name.endsWith(".gz")
                  ? Buffer.from(pako.ungzip(Buffer.from(questArrayBuffer)))
                  : Buffer.from(questArrayBuffer);

                const quest = parse(unzipped);
                onClose(quest);
              });
            }}
          />
        </div>
      </div>
    </Overlay>
  );
}
