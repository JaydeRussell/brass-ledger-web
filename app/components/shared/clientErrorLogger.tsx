"use client";
import { useEffect } from "react";
import { logClientEvent } from "../../lib/clientLog";

/**
 * Mounted once in the root layout. Catches anything the browser itself
 * would otherwise only ever show in devtools — an uncaught exception, a
 * rejected promise nobody handled — and routes it through
 * logClientEvent so it ends up in this app's log file too, not just a
 * console someone happened to have open. Renders nothing.
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

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
