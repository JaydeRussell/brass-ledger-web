// Sends a structured log line to this app's own /api/log route (see
// app/api/log/route.ts), which appends it to a file on disk — the
// browser's own console isn't something anyone can read back later, so
// this is how a client-side event (an auth check result, a caught
// error, an unhandled exception — see clientErrorLogger.tsx) ends up
// somewhere persistent and greppable, alongside the backend's own log
// file.
//
// Always also mirrors to console[level] — so local dev in a browser
// still sees these live in devtools exactly as before — and never
// throws: a logging call failing (network hiccup, /api/log erroring)
// must never be the thing that breaks whatever code was trying to log.

export type LogLevel = "info" | "warn" | "error";

export function logClientEvent(level: LogLevel, message: string, context?: unknown): void {
  const consoleMethod = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  consoleMethod(`[${level}]`, message, context ?? "");

  if (typeof fetch !== "function") return; // e.g. during server-side rendering

  const body = JSON.stringify({
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
  });

  fetch("/api/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    // keepalive lets this survive a navigation/unload that happens right
    // after the call (e.g. logging a sign-in redirect just before the
    // browser follows it) — without it, a same-tick navigation can
    // cancel the request before it's sent.
    keepalive: true,
  }).catch(() => {
    // Best-effort only — see the file-level comment above.
  });
}
