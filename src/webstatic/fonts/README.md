# Bundled fonts

- **Roboto Variable** (upright and italic): from [Google Fonts](https://github.com/google/fonts/tree/main/ofl/roboto), SIL Open Font License 1.1 in [Roboto-OFL.txt](Roboto-OFL.txt). Supports Cyrillic, Latin and variable weights 100–900.
- **DejaVu Sans Mono**: for fixed-width box diagrams, code and debugging. [Source](https://github.com/GravityPDF/mpdf-core-fonts/blob/development/DejaVuSansMono.ttf) and [license](DejaVu-LICENSE.txt).
- **Font Awesome**: independent icon font provided through the `font-awesome` package.

## Bundling

The actual .ttf binaries live in `src/ui/font-assets/`, **not** in `src/webstatic/`. All `@font-face` declarations use CSS-source-relative URLs (`./font-assets/…`). The existing `css-loader` resolves them at build time and `file-loader?name=fonts/[hash].[ext]` emits hashed binaries in `built-web/fonts/`.

`MiniCssExtractPlugin` produces `built-web/index.css`, which refers to those binaries using generated `fonts/<hash>.ttf` URLs. There are no hardcoded root-relative font URLs. The service worker automatically receives the emitted assets through `serviceWorkerOption.assets`.

`CopyWebpackPlugin` still copies these license files and this README from `src/webstatic/fonts` to `built-web/fonts`, but does **not** duplicate the font binaries. Never manually append the font URLs to `engineUrls`, since duplicate requests can break `Cache.addAll`.
