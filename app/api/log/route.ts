// A tiny server-side sink for client-side log events (see
// app/lib/clientLog.ts and app/components/shared/clientErrorLogger.tsx).
// This app is otherwise a pure client — every backend call goes straight
// from the browser to teams-match-making-be — but a browser's own
// console isn't something anyone can read back later, so this route
// lets the client hand a log line to the Next.js server process, which
// appends it to a plain file on disk (LOG_FILE, alongside the backend's
// own log file — see that repo's internal/applog and README's "Logging"
// section for the matching half of this).
//
// Best-effort and intentionally low-ceremony: never throws back to the
// client in a way that could itself trigger another logged error, and
// never blocks page rendering (see clientLog.ts, which fires this and
// ignores the result).

import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

// Unset -> the default path. Explicitly set to an empty string ->
// console-only (skip the file write below entirely) — same
// unset-vs-explicitly-empty distinction the backend's LOG_FILE makes
// (see teams-match-making-be's internal/config), so "LOG_FILE=" in
// either .env.example behaves the same way.
const LOG_FILE = process.env.LOG_FILE === undefined ? "logs/frontend.log" : process.env.LOG_FILE;

let ensureDirPromise: Promise<void> | null = null;

/** Creates LOG_FILE's directory once per server process, memoized so a
 * burst of log lines doesn't call mkdir for every single one. */
function ensureLogDir(): Promise<void> {
  if (!ensureDirPromise) {
    ensureDirPromise = mkdir(dirname(LOG_FILE), { recursive: true }).then(
      () => undefined,
      () => undefined // best-effort — a write failure below still gets caught
    );
  }
  return ensureDirPromise;
}

export type ClientLogEntry = {
  level: "info" | "warn" | "error";
  message: string;
  context?: unknown;
  // Set by the browser (Date.now()/toISOString()) rather than trusted
  // as an arbitrary client-supplied value for anything except display —
  // this is a local dev logging convenience, not an audit trail.
  timestamp?: string;
  url?: string;
};

export async function POST(request: Request) {
  let entry: ClientLogEntry;
  try {
    entry = (await request.json()) as ClientLogEntry;
  } catch {
    return new Response(null, { status: 204 });
  }

  const line = JSON.stringify({
    time: entry.timestamp ?? new Date().toISOString(),
    level: entry.level ?? "info",
    source: "client",
    message: entry.message ?? "",
    context: entry.context,
    url: entry.url,
  });

  if (LOG_FILE !== "") {
    try {
      await ensureLogDir();
      await appendFile(LOG_FILE, line + "\n", "utf8");
    } catch {
      // Logging must never be the thing that breaks the page — if the
      // file can't be written (e.g. LOG_FILE points somewhere
      // unwritable), just drop the line rather than surfacing an error
      // the client would then... try to log.
    }
  }

  return new Response(null, { status: 204 });
}
