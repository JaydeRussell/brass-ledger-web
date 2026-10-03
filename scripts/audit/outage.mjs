// Loads signed-in pages with the backend unreachable and reports where
// each one ends up and what it shows. Catches pages that bounce to
// /login, render blank, or hide cached data during an outage, which the
// load-time sweep can't see because it runs with the backend up.
//
//   PW_DIR=<dir with node_modules/playwright> SESSION=<token> \
//     node scripts/audit/outage.mjs [--base http://localhost:3000] [--api http://localhost:8080]
import { createRequire } from "node:module";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const base = arg("base", "http://localhost:3000");
const api = arg("api", "http://localhost:8080");
const routes = (arg("routes", "/,/my-events,/calendar,/stats,/friends,/event")).split(",");

const require = createRequire(`${process.env.PW_DIR}/`);
const { webkit } = require("playwright");
const browser = await webkit.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await ctx.addCookies([{ name: "session", value: process.env.SESSION ?? "", domain: new URL(base).hostname, path: "/" }]);
await ctx.route(`${api}/**`, (r) => r.abort("internetdisconnected"));

const results = [];
for (const route of routes) {
  const page = await ctx.newPage();
  await page.goto(base + route, { waitUntil: "load" });
  await page.waitForTimeout(4000);
  const text = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, " ");
  results.push({
    route,
    landedOn: new URL(page.url()).pathname,
    redirectedToLogin: new URL(page.url()).pathname === "/login",
    explainsOutage: /can.t reach/i.test(text),
    retryButton: (await page.getByRole("button", { name: "Try again" }).count()) > 0,
  });
  await page.close();
}
await browser.close();
console.table(results);
process.exitCode = results.some((r) => r.redirectedToLogin || !r.explainsOutage) ? 1 : 0;
