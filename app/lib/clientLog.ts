// A thin wrapper over console.log/warn/error for client-side events
// worth narrating — an auth check resolving, a fetch failing, a caught
// exception (see clientErrorLogger.tsx). The value is the consistent
// shape (level, message, structured context) and the single place to
// change how any of it is reported, not the transport.
//
// This used to also POST every line to /api/log, which appended it to
// logs/frontend.log on disk, back when reading a file was easier than
// reading a browser's console. That's no longer true — the console is
// read directly now — and the round trip had stopped doing anything
// useful in production regardless: the deployed frontend is a
// Cloudflare Worker, whose filesystem is read-only, so the append
// failed and was swallowed and the route returned 204 while writing
// nothing. Every call was a network request that discarded its own
// payload. The console mirror below was always the part that did the
// work.
//
// Never throws: a logging call failing must never be the thing that
// breaks whatever code was trying to log. Several call sites are inside
// a catch block, so a throw here would replace the real error with a
// worse one. (The old version only guarded the network call; the console
// call itself was unprotected — no browser's console actually throws,
// but the guarantee is cheap to keep and it's the one callers rely on.)

export type LogLevel = "info" | "warn" | "error";

export function logClientEvent(level: LogLevel, message: string, context?: unknown): void {
  try {
    const consoleMethod = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    consoleMethod(`[${level}]`, message, context ?? "");
  } catch {
    // Nothing useful left to do — reporting this failure would need the
    // very thing that just failed.
  }
}
