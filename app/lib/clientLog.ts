// A thin wrapper over console.log/warn/error for client-side events
// worth narrating — an auth check resolving, a fetch failing, a caught
// exception (see clientErrorLogger.tsx). The value is the consistent
// shape (level, message, structured context) and the single place to
// change how any of it is reported. Output goes to the browser console
// only; nothing is sent over the network.
//
// Never throws: a logging call failing must never be the thing that
// breaks whatever code was trying to log. Several call sites are inside
// a catch block, so a throw here would replace the real error with a
// worse one.

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
