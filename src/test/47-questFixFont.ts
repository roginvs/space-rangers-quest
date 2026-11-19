import * as assert from "assert";
import * as fs from "fs";
import "mocha";

const read = (path: string) => fs.readFileSync(__dirname + "/../../" + path, "utf8");

describe("Bundled game fonts", () => {
  it("uses local Roboto in all UI text and includes both upright and italic variable fonts", () => {
    const css = read("src/ui/fonts.css");
    const entry = read("src/ui/index.tsx");
    assert.ok(entry.includes('import "./fonts.css";'));
    assert.ok(entry.includes('import "font-awesome/css/font-awesome.css";'));

    assert.ok(css.includes('font-family: "Rangers Roboto";'));
    assert.ok(css.includes('url("/fonts/RobotoVariable.ttf")'));
    assert.ok(css.includes('url("/fonts/RobotoVariable-Italic.ttf")'));
    assert.ok(css.includes("font-weight: 100 900;"));
    assert.ok(css.includes("font-style: italic;"));
    assert.ok(css.includes("body,"));
    assert.ok(css.includes("button,"));
    assert.ok(css.includes("textarea {"));

    for (const name of ["RobotoVariable.ttf", "RobotoVariable-Italic.ttf"]) {
      const data = fs.readFileSync(__dirname + "/../../src/webstatic/fonts/" + name);
      assert.ok(data.length > 100000);
      assert.strictEqual(data.slice(0, 4).toString("hex"), "00010000");
    }
    const license = read("src/webstatic/fonts/Roboto-OFL.txt");
    assert.ok(license.includes("SIL OPEN FONT LICENSE Version 1.1"));
  });

  it("uses a bundled fixed-cell face for diagrams, code, and debug controls", () => {
    const css = read("src/ui/fonts.css");
    const gameCss = read("src/ui/questPlay/questPlay.css");
    assert.ok(css.includes('font-family: "Rangers Mono";'));
    assert.ok(css.includes('url("/fonts/DejaVuSansMono.ttf")'));
    assert.ok(css.includes("code,"));
    assert.ok(css.includes("samp {"));
    assert.ok(gameCss.includes('font-family: "Rangers Mono", monospace;'));
    assert.ok(gameCss.includes(".game-fix"));
    assert.ok(gameCss.includes(".game-debug-textarea"));
    assert.ok(gameCss.includes(".game-debug-input"));

    const data = fs.readFileSync(__dirname + "/../../src/webstatic/fonts/DejaVuSansMono.ttf");
    assert.ok(data.length > 10000);
    assert.strictEqual(data.slice(0, 4).toString("hex"), "00010000");
  });

  it("automatically precaches each static font without duplicate URLs", () => {
    const webpackConfig = read("webpack.config.js");
    assert.ok(webpackConfig.includes('from: "src/webstatic"'));
    assert.ok(webpackConfig.includes("ServiceWorkerWebpackPlugin"));

    const sw = read("src/ui/serviceWorker.ts");
    assert.ok(sw.includes("...serviceWorkerOption.assets"));
    assert.ok(!sw.includes('"/fonts/RobotoVariable.ttf"'));
    assert.ok(!sw.includes('"/fonts/RobotoVariable-Italic.ttf"'));
    assert.ok(!sw.includes('"/fonts/DejaVuSansMono.ttf"'));
  });
});
