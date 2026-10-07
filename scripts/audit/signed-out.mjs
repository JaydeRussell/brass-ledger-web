// Signed-out probe: loads routes with no session cookie in WebKit and
// Chromium (phone size, touch) and reports where each lands, console
// errors, failed requests, overflow and small targets, plus the start of
// the page text. sweep.mjs always runs signed in, so it can't see what a
// follow-link visitor or a logged-out person gets.
//
//   PW_DIR=<dir with node_modules/playwright> node scripts/audit/signed-out.mjs /follow/<token>?tab=mine /search /
import { createRequire } from "node:module";
const require = createRequire(`${process.env.PW_DIR}/`);
const pw = require("playwright");
const probe = (await import("node:fs")).readFileSync(new URL("./probe.js", import.meta.url), "utf8");
for (const engine of ["webkit", "chromium"]) {
  const b = await pw[engine].launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, ...(engine === "chromium" ? { isMobile: true } : {}) });
  for (const route of process.argv.slice(2)) {
    const p = await ctx.newPage();
    const errors = [], failed = [];
    p.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 120)));
    p.on("pageerror", (e) => errors.push("pageerror " + String(e).slice(0, 120)));
    p.on("response", (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url().replace("http://localhost:8080", "").slice(0, 90)}`));
    await p.goto("http://localhost:3000" + route, { waitUntil: "load" });
    await p.waitForTimeout(4000);
    const text = (await p.innerText("main").catch(() => "")).replace(/\s+/g, " ").slice(0, 260);
    const report = await p.evaluate(probe);
    console.log(engine, route, "->", new URL(p.url()).pathname, "| errors", errors.length, errors.slice(0, 2), "| failed", [...new Set(failed)].slice(0, 5), "| overflow", report.overflowX?.length ?? 0, "| small", report.smallTargets.count, "\n   ", text);
    await p.close();
  }
  await b.close();
}
