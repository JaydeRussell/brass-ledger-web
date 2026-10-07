// Follow-link roster scroll: opens an event's roster through a follow
// link with no session, scrolls it slowly the way a person reads it, and
// counts ITC lookups by status. A 429 here means the follow-token rate
// limit is tighter than reading a large roster needs.
//
//   PW_DIR=<dir with node_modules/playwright> node scripts/audit/follow-roster-scroll.mjs <token>
import { createRequire } from "node:module";
const require = createRequire(`${process.env.PW_DIR}/`);
const { chromium } = require("playwright");
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const codes = {};
p.on("response", (r) => { if (r.url().includes("/api/itc/rankings")) codes[r.status()] = (codes[r.status()] ?? 0) + 1; });
await p.goto(`http://localhost:3000/follow/${process.argv[2]}?tab=roster`);
await p.getByText("Aaron Cetin").first().waitFor({ timeout: 20000 });
const h = await p.evaluate(() => document.body.scrollHeight); for (let y = 0; y < h; y += 500) { if (y > 40000) break; await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(500); } console.log("page height", h);
await p.waitForTimeout(8000);
const badges = await p.locator("text=/^#\\d+/").count();
console.log("ITC ranking responses by status:", codes, "| rank badges shown:", badges);
await b.close();
