import * as React from "react";

// TODO: Use maybe readymade component?
export const Overlay: React.FC<{
  position: "fixed" | "absolute";
  wide: boolean;
  headerText: string;
  onClose: () => void;
}> = ({ position, headerText, onClose, children, wide }) => {
  return (
    <div
      style={{
        position,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        padding: 10,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div
        style={{
          width: wide ? "90%" : undefined,
        }}
        className="card"
      >
        <h5 className="card-header d-flex flex-row justify-content-between">
          <span>{headerText}</span>
          <i
            role="button"
            aria-label="Закрыть"
            className="fa fa-times"
            style={{ cursor: "pointer" }}
            onClick={onClose}
          />
        </h5>
        <div className="card-body">{children}</div>
      </div>
    </div>
  );
};
