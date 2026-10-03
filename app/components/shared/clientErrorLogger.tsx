"use client";
import { useEffect } from "react";
import { logClientEvent } from "../../lib/clientLog";

/**
 * Mounted once in the root layout. Catches anything the browser itself
 * would otherwise only ever show in devtools — an uncaught exception, a
 * rejected promise nobody handled — and routes it through
 * logClientEvent. Also reloads the page when a lazily loaded chunk fails
 * because a deploy replaced it (see onPreloadError). Renders nothing.
 */
export default function ClientErrorLogger() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      logClientEvent("error", "uncaught error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error instanceof Error ? event.error.stack : undefined,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as unknown;
      logClientEvent("error", "unhandled promise rejection", {
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    };

    // Vite fires this when a dynamically imported chunk can't be loaded,
    // which after a deploy means the open page still names chunks the new
    // build no longer has: the nav drawer, Quick search and the feedback
    // panel would then silently never open. A reload fetches the current
    // build. At most once per tab session, so a chunk that's genuinely
    // broken can't cause a reload loop.
    const onPreloadError = (event: Event) => {
      logClientEvent("warn", "lazy chunk failed to load", {});
      try {
        if (sessionStorage.getItem("reloadedForStaleChunk")) return;
        sessionStorage.setItem("reloadedForStaleChunk", "1");
      } catch {
        return;
      }
      event.preventDefault();
      window.location.reload();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("vite:preloadError", onPreloadError);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("vite:preloadError", onPreloadError);
    };
  }, []);

  return null;
}
