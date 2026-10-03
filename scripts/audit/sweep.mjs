// Route sweep for the grand hunt: loads every route in WebKit and/or
// Chromium at phone and desktop sizes (phones with touch and isMobile),
// runs probe.js on each, and records console errors, failed requests,
// request counts and time to network idle.
//
// Playwright isn't a project dependency; point PW_DIR at a directory with
// it installed. A local session token (see brass-ledger-api's
// scripts/latency-map.sh for minting one) goes in SESSION.
//
//   PW_DIR=/path/with/playwright SESSION=token node scripts/audit/sweep.mjs \
//     [--engines webkit,chromium] [--widths 360,390,430,1280] [--prefs default|compact-xl|roomy-xl]
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(`${process.env.PW_DIR}/`);
const playwright = require("playwright");

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const API = process.env.API_URL ?? "http://localhost:8080";
const SESSION = process.env.SESSION;
const engines = arg("engines", "webkit,chromium").split(",");
const widths = arg("widths", "360,390,430,1280").split(",").map(Number);
const prefs = arg("prefs", "default");
const routes = (arg("routes", "") || "").split(",").filter(Boolean);
const probe = readFileSync(new URL("./probe.js", import.meta.url), "utf8");

const EVENT = process.env.EVENT ?? "7ohG0RuDqC1k";
const BCP_USER = process.env.BCP_USER ?? "98c5KuLmdpgS";
const ROUTES = routes.length
  ? routes
  : [
      "/",
      `/event?event=${EVENT}`,
      "/event?tab=mine",
      "/event?tab=team",
      "/event?tab=roster",
      "/event?tab=pairings",
      "/event?tab=placings",
      "/my-events",
      "/calendar",
      "/stats",
      "/friends",
      `/players/${BCP_USER}`,
      `/dossier/${BCP_USER}`,
      "/wiki",
      "/about",
      "/changelog",
      "/admin",
      "/admin/feedback",
      "/admin/accounts",
      "/welcome",
      "/login",
    ];

const PREFS = {
  default: {},
  "compact-xl": { density: "compact", textSize: "xl" },
  "roomy-xl": { density: "comfortable", textSize: "xl" },
  "compact-sm": { density: "compact", textSize: "sm" },
};

const results = [];
for (const engine of engines) {
  const browser = await playwright[engine].launch();
  for (const width of widths) {
    const phone = width < 700;
    const context = await browser.newContext({
      viewport: { width, height: phone ? 844 : 900 },
      // Chromium supports isMobile; WebKit gets touch via hasTouch only.
      ...(phone ? { hasTouch: true, ...(engine === "chromium" ? { isMobile: true, deviceScaleFactor: 3 } : {}) } : {}),
    });
    if (SESSION) {
      const host = new URL(BASE).hostname;
      await context.addCookies([{ name: "session", value: SESSION, domain: host, path: "/" }]);
    }
    const stored = PREFS[prefs] ?? {};
    await context.addInitScript((p) => {
      try {
        for (const [k, v] of Object.entries(p)) localStorage.setItem(k, v);
      } catch {}
    }, stored);

    for (const route of ROUTES) {
      const page = await context.newPage();
      const errors = [];
      const failed = [];
      let requests = 0;
      let apiRequests = 0;
      page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
      page.on("pageerror", (e) => errors.push(`pageerror: ${String(e).slice(0, 160)}`));
      page.on("request", (r) => {
        requests++;
        if (r.url().startsWith(API)) apiRequests++;
      });
      page.on("requestfailed", (r) => failed.push(`${r.failure()?.errorText} ${r.url().slice(0, 100)}`));
      page.on("response", (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url().slice(0, 100)}`));
      const t0 = Date.now();
      let navError = null;
      try {
        await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 15000 });
      } catch (e) {
        navError = String(e).slice(0, 120);
      }
      const ms = Date.now() - t0;
      let report = null;
      try {
        report = await page.evaluate(probe);
      } catch (e) {
        report = { error: String(e).slice(0, 160) };
      }
      process.stderr.write(`${engine} ${width} ${route} ${ms}ms errors=${errors.length} failed=${failed.length}\n`);
      results.push({ engine, width, prefs, route, finalPath: new URL(page.url()).pathname, ms, requests, apiRequests, errors, failed: [...new Set(failed)], navError, ...report });
      await page.close();
    }
    await context.close();
  }
  await browser.close();
}
console.log(JSON.stringify(results));
