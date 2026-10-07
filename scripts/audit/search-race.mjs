// Find Events race check: holds every "Load more" request for 3 s, starts
// a new search while one is in flight, and counts results that don't
// match the new search; then holds a place lookup, switches to Anywhere
// while it's in flight, and checks the next search sends no location. A
// load-time sweep can't see either; each needs a request held open while
// the page moves on. Expect "non-matching: 0" and a search with no lat/lon.
//
//   PW_DIR=<dir with node_modules/playwright> SESSION=<token> node scripts/audit/search-race.mjs
import { createRequire } from "node:module";
const require = createRequire(`${process.env.PW_DIR}/`);
const { chromium } = require("playwright");
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addCookies([{ name: "session", value: process.env.SESSION, domain: "localhost", path: "/" }]);
const p = await ctx.newPage();
// Hold "Load more" (any request with a cursor) for 3 s.
await p.route("**/api/event-search?*cursor=*", async (route) => { await new Promise((r) => setTimeout(r, 3000)); await route.continue(); });
await p.goto("http://localhost:3000/search?q=rtt");
await p.getByRole("button", { name: "Load more" }).waitFor({ timeout: 10000 });
await p.getByRole("button", { name: "Load more" }).click();
await p.waitForTimeout(300);
await p.getByLabel(/Event name/).fill("kawartha");
await p.getByRole("search").getByRole("button", { name: "Search" }).click();
await p.waitForTimeout(5000);
const names = await p.locator('section[aria-label="Search results"] li .text-sm.font-medium').allInnerTexts();
console.log("results after searching 'kawartha':", names.length, names.slice(0, 4), "| non-matching:", names.filter((n) => !/kawartha/i.test(n)).length);
await b.close();

// --- Location: a slow place lookup must not apply after switching to Anywhere.
{
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addCookies([{ name: "session", value: process.env.SESSION, domain: "localhost", path: "/" }]);
const p = await ctx.newPage();
const searches = [];
p.on("request", (r) => r.url().includes("/api/event-search") && searches.push(r.url().replace("http://localhost:8080", "")));
await p.route("**/api/places?*", async (route) => { await new Promise((r) => setTimeout(r, 2500)); await route.continue(); });
await p.goto("http://localhost:3000/search");
await p.getByRole("button", { name: "Near a place" }).click();
await p.getByPlaceholder("City, region or postcode").fill("Denver");
await p.getByRole("button", { name: "Find" }).click();
await p.waitForTimeout(300);
await p.getByRole("button", { name: "Anywhere" }).click();
await p.waitForTimeout(3500);
const checked = await p.getByRole("button", { pressed: true }).innerText();
await p.getByLabel(/Event name/).fill("open");
await p.getByRole("search").getByRole("button", { name: "Search" }).click();
await p.waitForTimeout(3000);
console.log("selected:", checked, "| search sent:", searches.at(-1));
await b.close();
}
