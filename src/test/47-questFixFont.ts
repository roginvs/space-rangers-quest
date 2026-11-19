import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import "mocha";

const root = path.resolve(__dirname, "../..");
const read = (file: string) => fs.readFileSync(path.resolve(root, file), "utf8");
const fonts = ["RobotoVariable.ttf", "RobotoVariable-Italic.ttf", "DejaVuSansMono.ttf"];

describe("Bundled game fonts", () => {
  it("imports our styles after Bootstrap and keeps the independent icon font", () => {
    const entry = read("src/ui/index.tsx");
    assert.ok(entry.indexOf('import "./fonts.css";') > entry.indexOf('import "bootstrap/dist/css/bootstrap.css";'));
    assert.ok(entry.includes('import "font-awesome/css/font-awesome.css";'));
    const css = read("src/ui/fonts.css");
    assert.ok(css.includes('font-family: "Rangers Roboto";'));
    assert.ok(css.includes("font-weight: 100 900;"));
    assert.ok(css.includes("font-style: italic;"));
    assert.ok(css.includes("body,"));
    assert.ok(css.includes("button,"));
    assert.ok(css.includes("textarea {"));
    assert.ok(read("src/webstatic/fonts/Roboto-OFL.txt").includes("SIL OPEN FONT LICENSE Version 1.1"));
  });

  it("uses real relative font files that webpack can resolve and emit", () => {
    const css = read("src/ui/fonts.css");
    // Keep the test compatible with tsconfig's ES6 lib (no String.matchAll).
    const relativeUrls = css.match(/src: url[(]"[^"]+"[)]/g) || [];
    assert.strictEqual(relativeUrls.length, 3);
    for (const font of fonts) {
      const url = "./font-assets/" + font;
      assert.ok(relativeUrls.includes('src: url("' + url + '")'), "Missing CSS URL for " + font);
      const file = path.resolve(root, "src/ui", url);
      assert.ok(fs.existsSync(file), "Missing CSS-relative font file " + file);
      const data = fs.readFileSync(file);
      assert.ok(data.length > 10000);
      assert.strictEqual(data.slice(0, 4).toString("hex"), "00010000");
      assert.ok(!fs.existsSync(path.resolve(root, "src/webstatic/fonts", font)), "Duplicate font: " + font);
    }
    const webpack = read("webpack.config.js");
    assert.ok(webpack.includes('file-loader?name=fonts/[hash].[ext]'));
    assert.ok(webpack.includes('filename: "[name].css"'));
    assert.ok(webpack.includes('path: __dirname + "/built-web"'));
  });

  it("uses the bundled monospace font for <fix>, code and debug controls", () => {
    const css = read("src/ui/fonts.css");
    const quest = read("src/ui/questPlay/questPlay.css");
    assert.ok(css.includes('font-family: "Rangers Mono";'));
    assert.ok(css.includes('url("./font-assets/DejaVuSansMono.ttf")'));
    assert.ok(css.includes("code,"));
    assert.ok(css.includes("samp {"));
    assert.ok(quest.includes('.game-fix {'));
    assert.ok(quest.includes('font-family: "Rangers Mono", monospace;'));
    assert.ok(quest.includes(".game-debug-input"));
    assert.ok(quest.includes(".game-debug-textarea"));
    assert.ok(read("src/webstatic/fonts/DejaVu-LICENSE.txt").includes("Bitstream"));
  });

  it("lets the service worker cache the emitted assets without duplicate URLs", () => {
    const config = read("webpack.config.js");
    const sw = read("src/ui/serviceWorker.ts");
    assert.ok(config.includes("ServiceWorkerWebpackPlugin"));
    assert.ok(sw.includes("...serviceWorkerOption.assets"));
    for (const font of fonts) {
      assert.ok(!sw.includes('"/fonts/' + font + '"'));
    }
  });
});
