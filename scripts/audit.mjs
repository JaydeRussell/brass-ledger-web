// `npm audit --audit-level=high`, except for the advisories listed below.
// npm has no built-in way to accept a single advisory.
//
// Each exception needs a reason and an expiry. Once it expires, CI fails
// on that advisory again, so the exception can't outlive the problem
// unnoticed.
import { spawnSync } from "node:child_process";

const EXCEPTIONS = {
  // braces <= 3.0.3: stack exhaustion on deeply nested brace patterns. No
  // patched release exists (micromatch/braces#70). It reaches this project
  // only through build tooling (eslint-config-next, vinext's Vite
  // plugins) reading globs from our own config; none of it is in the
  // built app. Remove once a fixed braces is published.
  "GHSA-vfj7-8cjw-p6xm": { expires: "2026-10-16" },
};

const BLOCKING = new Set(["high", "critical"]);

const result = spawnSync("npm", ["audit", "--json"], { encoding: "utf8" });
let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error("npm audit did not return JSON:\n" + result.stdout + result.stderr);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const blocking = new Map();
const excused = new Set();

for (const vuln of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vuln.via) {
    // A string entry points at another vulnerable package, whose own
    // advisory is checked in its own entry.
    if (typeof via === "string" || !BLOCKING.has(via.severity)) continue;
    const id = via.url?.split("/").pop() ?? String(via.source);
    const exception = EXCEPTIONS[id];
    if (exception && today <= exception.expires) excused.add(id);
    else blocking.set(id, `${via.severity}: ${vuln.name} — ${via.title} (${via.url})`);
  }
}

for (const id of excused) {
  console.log(`Allowed until ${EXCEPTIONS[id].expires}: ${id}`);
}
for (const [id, exception] of Object.entries(EXCEPTIONS)) {
  if (today > exception.expires) console.error(`Exception for ${id} expired on ${exception.expires}.`);
}

if (blocking.size > 0) {
  console.error(`${blocking.size} high/critical advisory(ies):`);
  for (const line of blocking.values()) console.error("  " + line);
  process.exit(1);
}
console.log("No unexcused high/critical advisories.");
