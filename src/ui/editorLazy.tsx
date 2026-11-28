import * as React from "react";
import { Loader } from "./common";

// Keep toast styles in the main CSS bundle. mini-css-extract-plugin@0.4
// does not inject CSS from an async JS chunk, so a CSS import that lives
// only inside the editor would never load.
import "react-toastify/dist/ReactToastify.css";

const EditorContainer = React.lazy(() =>
  import(/* webpackChunkName: "editor" */ "./editor").then((mod) => ({
    default: mod.EditorContainer,
  })),
);

export function LazyEditorContainer(props: React.ComponentProps<typeof EditorContainer>) {
  return (
    <React.Suspense fallback={<Loader />}>
      <EditorContainer {...props} />
    </React.Suspense>
  );
}
