import classNames from "classnames";
import * as React from "react";
import { useOnDocumentKeyUp } from "../hooks";
import { Overlay } from "../overlay";

export function HelpOverlay({ onClose }: { onClose: () => void }) {
  useOnDocumentKeyUp((e) => {
    if (e.key === "Escape") {
      onClose();
    }
  });

  return (
    <Overlay wide={false} position="absolute" headerText={`Справка`} onClose={() => onClose()}>
      <div className="text-center p-4">
        <div className="mb-2">Этот редактор является веб-версией редактора TGE</div>
        <div className="mb-2">Как и плеер работает без интернета</div>
        <div className="mb-2">
          Руководство по TGE можно поискать{" "}
          <a
            target="_blank"
            href="https://www.google.com/search?q=TGE+%D0%BA%D0%BE%D1%81%D0%BC%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B5+%D1%80%D0%B5%D0%B9%D0%BD%D0%B4%D0%B6%D0%B5%D1%80%D1%8B+%D1%80%D1%83%D0%BA%D0%BE%D0%B2%D0%BE%D0%B4%D1%81%D1%82%D0%B2%D0%BE"
          >
            допустим так
          </a>{" "}
          или{" "}
          <a
            target="_blank"
            href="https://www.google.com/search?q=%D0%BA%D0%BE%D1%81%D0%BC%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B5+%D1%80%D0%B5%D0%B9%D0%BD%D0%B4%D0%B6%D0%B5%D1%80%D1%8B+%D0%98%D0%BD%D1%81%D1%82%D1%80%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D1%8B+%D0%B4%D0%BB%D1%8F+%D0%BC%D0%BE%D0%B4%D0%B8%D1%84%D0%B8%D0%BA%D0%B0%D1%86%D0%B8%D0%B8+%D0%B8%D0%B3%D1%80%D1%8B+(%D1%83%D1%82%D0%B8%D0%BB%D0%B8%D1%82%D1%8B)"
          >
            так
          </a>
        </div>
        <div className="mb-2">
          Либо{" "}
          <a target="_blank" href="http://www.mediafire.com/file/n5znwnmwnyj">
            скачать
          </a>{" "}
          архив с TGE версии 4.2.5, в архиве будет документация по TGE
        </div>
      </div>
    </Overlay>
  );
}
