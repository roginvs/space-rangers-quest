import classNames from "classnames";
import * as React from "react";
import { Overlay } from "../overlay";

export function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <Overlay wide={false} position="absolute" headerText={`Справка`} onClose={() => onClose()}>
      <div className="text-center p-4">
        <div>Этот редактор является веб-версией редактора TGE</div>
        <div>
          Руководство по TGE можно поискать{" "}
          <a
            target="_blank"
            href="https://www.google.com/search?q=TGE+%D0%BA%D0%BE%D1%81%D0%BC%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B5+%D1%80%D0%B5%D0%B9%D0%BD%D0%B4%D0%B6%D0%B5%D1%80%D1%8B+%D1%80%D1%83%D0%BA%D0%BE%D0%B2%D0%BE%D0%B4%D1%81%D1%82%D0%B2%D0%BE"
          >
            допустим тут
          </a>
        </div>
      </div>
    </Overlay>
  );
}
