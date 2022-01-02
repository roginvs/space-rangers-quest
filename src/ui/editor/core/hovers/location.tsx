import * as React from "react";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Location } from "../../../../lib/qmreader";

export function LocationHover({ location }: { location: DeepImmutable<Location> }) {
  const shortInfo = location.isStarting
    ? "Стартовая локация"
    : location.isSuccess
    ? "Победная локация"
    : location.isFailyDeadly
    ? "Смертельная локация"
    : location.isFaily
    ? "Провальная локация"
    : location.isEmpty
    ? "Пустая локация"
    : location.length === 0
    ? "Пустая локация (нет теста)"
    : "Промежуточная локация";

  const divider = <div>----------------------------------------------</div>;

  const firstNotEmptyText = location.texts.find((text) => text);

  const MAX_TEXT_CHARS = 300;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex" }}>
        <span>{location.texts.length > 1 ? "M" : ""}</span>
        <span style={{ marginLeft: "auto" }}>L {location.id}</span>
      </div>
      {divider}
      <div>- {shortInfo} -</div>
      {divider}
      <div
        style={{
          textAlign: "center",
          color: "#0000EE",
        }}
      >
        {firstNotEmptyText ? firstNotEmptyText.slice(0, MAX_TEXT_CHARS) : ""}{" "}
        {firstNotEmptyText && firstNotEmptyText.length > MAX_TEXT_CHARS ? "..." : ""}
      </div>
    </div>
  );
}
