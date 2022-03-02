import classNames from "classnames";
import * as React from "react";
import { DeepImmutable } from "../../../../lib/qmplayer/deepImmutable";
import { Media } from "../../../../lib/qmreader";

export function MediaEdit({
  media,
  setMedia,
  vertical,
  disabled,
}: {
  media: DeepImmutable<Media>;
  setMedia: (media: DeepImmutable<Media>) => void;
  vertical?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={classNames("d-flex justify-content-between mb-2", {
        "flex-column": vertical,
      })}
    >
      <input
        className="form-control"
        placeholder="Иллюстрация"
        value={media.img || ""}
        onChange={(e) => setMedia({ ...media, img: e.target.value })}
        title="Также поддерживаются абсолютные пути к изображениям"
        disabled={disabled}
      />
      <input
        className={classNames("form-control", vertical ? "" : "mx-2")}
        placeholder="Фоновый трек"
        value={media.track || ""}
        onChange={(e) => setMedia({ ...media, track: e.target.value })}
        title={
          "Также поддерживаются абсолютные пути к аудио файлам\n" +
          "Специальное значение Quest сбрасывает музыку к дефолтной"
        }
        disabled={disabled}
      />
      <input
        className="form-control"
        placeholder="Звуковой эффект"
        value={media.sound || ""}
        onChange={(e) => setMedia({ ...media, sound: e.target.value })}
        title="Также поддерживаются абсолютные пути к аудио файлам"
        disabled={disabled}
      />
    </div>
  );
}
