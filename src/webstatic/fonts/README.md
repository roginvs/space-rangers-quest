# Bundled font assets

- **Roboto Variable** (upright and italic): copied unchanged from [Google Fonts Roboto](https://github.com/google/fonts/tree/main/ofl/roboto), under the SIL Open Font License 1.1 in [Roboto-OFL.txt](Roboto-OFL.txt). The upstream versions include Latin, Cyrillic and Greek; the weight range is 100–900.
- **DejaVu Sans Mono**: the fixed-width font for ASCII/box-drawing diagrams and debugging, from [GravityPDF/mpdf-core-fonts](https://github.com/GravityPDF/mpdf-core-fonts/blob/development/DejaVuSansMono.ttf), under the terms in [DejaVu-LICENSE.txt](DejaVu-LICENSE.txt).
- **Font Awesome** remains an independent icon font imported from `node_modules/font-awesome`; it must not be overridden by the global body font.

Files under `src/webstatic` are copied to `built-web` by CopyWebpackPlugin. ServiceWorkerWebpackPlugin automatically includes copied static assets in `serviceWorkerOption.assets`. Do **not** manually add these URLs to `engineUrls`: duplicate requests can break `Cache.addAll`.
