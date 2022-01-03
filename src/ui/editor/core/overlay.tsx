import * as React from "react";

// TODO: Use maybe readymade component?
export const Overlay: React.FC<{ position: "fixed" | "absolute" }> = ({ position, children }) => {
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
        zIndex: 10000,
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div
        style={{
          borderRadius: 5,
          margin: 30,
          padding: 10,
          boxShadow: "0 4px 8px 0 rgba(0,0,0,0.2)",
          background: "white",
        }}
      >
        {children}
      </div>
    </div>
  );
};
