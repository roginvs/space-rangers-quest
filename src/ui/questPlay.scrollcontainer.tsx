import * as React from "react";
import CustomScroll from "react-custom-scroll";
import "react-custom-scroll/dist/customScroll.css";
import "./questPlay.scrollcontainer.css";

export const ScrollableContainer: React.FC<{}> = ({ children }) => {
  // A workaround with small overflow to hide browser scrollbar
  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <div style={{ height: "100%", width: "calc(100% + 3px)" }}>
        <CustomScroll heightRelativeToParent="100%">{children}</CustomScroll>
      </div>
    </div>
  );
};
