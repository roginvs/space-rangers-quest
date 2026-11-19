import * as assert from "assert";
import * as fs from "fs";
import "mocha";

describe("Quest <fix> font assets", () => {
  it("Bundles a fixed-width font with the game, including for offline play", () => {
    const css = fs.readFileSync(__dirname + "/../../src/ui/questPlay/questPlay.css", "utf8");
    assert.ok(css.includes('font-family: "Rangers Mono", monospace;'));
    assert.ok(css.includes('url("/fonts/DejaVuSansMono.ttf")'));

    const fontPath = __dirname + "/../../src/webstatic/fonts/DejaVuSansMono.ttf";
    const font = fs.readFileSync(fontPath);
    assert.ok(font.length > 10000);
    assert.strictEqual(font.slice(0, 4).toString("hex"), "00010000");

    const sw = fs.readFileSync(__dirname + "/../../src/ui/serviceWorker.ts", "utf8");
    assert.ok(sw.includes('"/fonts/DejaVuSansMono.ttf"'));
  });
});
