import * as React from "react";
import { Media } from "../../../../lib/qmreader";

export function MediaEdit({ media, setMedia }: { media: Media; setMedia: (media: Media) => void }) {
  return (
    <div className="row">
      <div className="col-4">
        <div className="form-group">
          <input
            type="email"
            className="form-control"
            placeholder="Иллюстрация"
            value={media.img}
            onChange={(e) => setMedia({ ...media, img: e.target.value })}
          />
        </div>
      </div>

      <div className="col-4">
        <div className="form-group">
          <input
            type="email"
            className="form-control"
            placeholder="Фоновый трек"
            value={media.track}
            onChange={(e) => setMedia({ ...media, track: e.target.value })}
          />
        </div>
      </div>

      <div className="col-4">
        <div className="form-group">
          <input
            type="email"
            className="form-control"
            placeholder="Звуковой эффект"
            value={media.sound}
            onChange={(e) => setMedia({ ...sound, track: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
