"use client";
import React from "react";
import { fetchCalendarUrl } from "../../lib/calendar";
import { logClientEvent } from "../../lib/clientLog";

/**
 * Fetches the signed-in account's subscribable .ics URL on mount and
 * offers it as a read-only field plus a "Copy" button — the URL itself
 * is meant to be pasted into a phone/desktop calendar app's "subscribe
 * from URL" flow (Google/Apple/Outlook Calendar all support this), not
 * opened directly in this app.
 */
export default function CalendarSubscribe() {
  const [url, setUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetchCalendarUrl()
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        logClientEvent("error", "calendar: failed to load subscribe url", { error: message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // typeof-guarded rather than a bare `navigator` reference: this
  // component renders under Node's SSR test harness (renderToStaticMarkup,
  // see calendarSubscribe.test.ts), where `navigator` may not be a
  // declared global at all — a bare reference would throw a
  // ReferenceError during that render, not just return undefined.
  const clipboardAvailable = typeof navigator !== "undefined" && !!navigator.clipboard;

  const handleCopy = () => {
    if (!url || !clipboardAvailable) return;
    navigator.clipboard
      .writeText(url)
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  };

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
        Couldn&apos;t load your calendar link: {error}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Subscribe</p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Add this link to Google, Apple, or Outlook Calendar as a URL subscription to see your
        upcoming events alongside your other appointments. It updates automatically — no need to
        re-copy it later.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          readOnly
          value={url ?? "Loading…"}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        />
        {clipboardAvailable && (
          <button
            type="button"
            onClick={handleCopy}
            disabled={!url}
            className="shrink-0 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>
      {!clipboardAvailable && url && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Copy isn&apos;t available here — select the text above and copy it manually.
        </p>
      )}
    </div>
  );
}
