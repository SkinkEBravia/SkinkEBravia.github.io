// Render INTRUSION frame by frame in headless Chromium.
//   npx http-server . -p 8091 -s       (from the repo root, so fonts in node_modules resolve)
//   node studio/note01/capture.mjs <outDir> [from] [to] [step]
// Writes f0000.jpg… and events.json (burst + typing times, used by audio.py).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const [out = "frames", from = "0", to = "", step = "1"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on("pageerror", (e) => { console.error("pageerror:", e.message); process.exit(1); });
page.on("console", (m) => m.type() === "error" && console.error("console:", m.text()));
await page.goto("http://localhost:8091/studio/note01/index.html?capture");
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
const events = await page.evaluate(() => window.EVENTS);
writeFileSync(path.join(out, "events.json"), JSON.stringify(events));
const end = to === "" ? events.frames : +to;
const t0 = Date.now();
for (let f = +from; f < end; f += +step) {
  const url = await page.evaluate((f) => window.renderFrame(f), f);
  writeFileSync(path.join(out, `f${String(f).padStart(4, "0")}.jpg`), Buffer.from(url.split(",")[1], "base64"));
  if (f % 24 === 0) process.stdout.write(`\rframe ${f}/${end}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
console.log(`\ndone in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
