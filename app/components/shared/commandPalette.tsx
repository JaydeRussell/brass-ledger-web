"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useCommandPalette } from "./commandPaletteContext";
import { useCurrentUser } from "../../lib/auth";
import { NAV_LINKS } from "../../lib/navLinks";
import { loadRecentEvents, fetchRecentEventsFromServer, type RecentEvent } from "../../lib/recentEvents";
import { logClientEvent } from "../../lib/clientLog";

type Result =
  | { kind: "page"; key: string; label: string; detail?: string; href: string }
  | { kind: "event"; key: string; label: string; detail?: string; href: string };

function matches(label: string, query: string): boolean {
  return label.toLowerCase().includes(query.trim().toLowerCase());
}

/**
 * A ⌘K/Ctrl+K quick switcher — jump straight to a static page or a
 * recently-viewed event without going through the nav drawer. Scoped
 * deliberately narrow for a first cut: pages (see lib/navLinks.ts) and
 * recent events (lib/recentEvents.ts, already-fetched data this app
 * already keeps — a signed-in account's cross-device list, or a guest's
 * local one, same source app/page.tsx's own hydration already uses).
 * Full "search any player/team" isn't here — this app has no global
 * player-search index to query (rosters are fetched per-event, not
 * aggregated), which is a separate, bigger feature to build.
 *
 * Plain conditionally-rendered backdrop+panel, not ui/dialog.tsx's
 * Radix-backed Dialog — same reasoning as feedbackWidget.tsx's own doc
 * comment: keeps this real-DOM and structurally testable via
 * react-dom/server, at the cost of Radix's automatic focus trap (a
 * known, minor gap — Escape-to-close and backdrop-click are still
 * handled by hand below).
 */
export default function CommandPalette() {
  const { isOpen, close, toggle } = useCommandPalette();
  const router = useRouter();
  // A second, independent useCurrentUser() instance — see auth.ts's doc
  // comment: this hook is deliberately not shared state, so every
  // consumer fetches /api/me on its own (same reasoning navDrawer.tsx's
  // own second instance already documents). Only used here to decide
  // which recent-events source to read from, and to show the two Admin
  // pages (see navDrawer.tsx's expandable Admin group for the same
  // pair).
  const { user } = useCurrentUser();
  const [query, setQuery] = React.useState("");
  const [recentEvents, setRecentEvents] = React.useState<RecentEvent[]>([]);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Global shortcut — added once, independent of isOpen, so ⌘K/Ctrl+K
  // toggles from anywhere. Doesn't fire while a modifier-less key is
  // being typed into a normal input (this always requires a modifier),
  // so it can't clobber a visitor's typing elsewhere.
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  // Lazily loads recent events only once actually opened — never on
  // every page load, unlike app/page.tsx's own hydration effect, since
  // this palette might never be opened in a given visit at all.
  React.useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setHighlightedIndex(0);
    inputRef.current?.focus();

    if (user && user.status === "approved") {
      fetchRecentEventsFromServer()
        .then(setRecentEvents)
        .catch((err: unknown) => {
          logClientEvent("warn", "command palette: fetching synced recent events failed", {
            error: err instanceof Error ? err.message : String(err),
          });
          setRecentEvents([]);
        });
    } else {
      setRecentEvents(loadRecentEvents());
    }
  }, [isOpen, user]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const adminLink =
    user?.role === "admin"
      ? [
          { href: "/admin/accounts", label: "Admin: Accounts" },
          { href: "/admin/feedback", label: "Admin: Feedback" },
        ]
      : [];
  const pageResults: Result[] = [...NAV_LINKS, ...adminLink]
    .filter((link) => matches(link.label, query))
    .map((link) => ({ kind: "page", key: `page:${link.href}`, label: link.label, href: link.href }));
  const eventResults: Result[] = recentEvents
    .filter((event) => matches(event.name, query))
    .map((event) => ({
      kind: "event",
      key: `event:${event.id}`,
      label: event.name,
      detail: event.teamEvent ? "Team event" : "Singles event",
      href: `/event?event=${encodeURIComponent(event.id)}`,
    }));
  const results = [...pageResults, ...eventResults];
  const clampedIndex = Math.min(highlightedIndex, Math.max(0, results.length - 1));

  const activate = (result: Result) => {
    router.push(result.href);
    close();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 print:hidden" onClick={close} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quick switcher"
        className="fixed left-1/2 top-24 z-50 w-full max-w-md -translate-x-1/2 rounded-lg border border-surface-border bg-surface-1 shadow-xl print:hidden"
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightedIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightedIndex((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightedIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && results[clampedIndex]) {
              e.preventDefault();
              activate(results[clampedIndex]);
            }
          }}
          placeholder="Search pages and recent events…"
          aria-label="Search pages and recent events"
          className="w-full rounded-t-lg border-b border-surface-border bg-transparent px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />

        <ul className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 && (
            <li className="px-2 py-3 text-center text-sm text-text-tertiary">No matches.</li>
          )}
          {results.map((result, i) => (
            <li key={result.key}>
              <button
                type="button"
                onClick={() => activate(result)}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm ${
                  i === clampedIndex
                    ? "bg-brass-500/15 text-text-primary"
                    : "text-text-secondary hover:bg-surface-2"
                }`}
              >
                <span className="truncate">{result.label}</span>
                <span className="shrink-0 text-xs text-text-tertiary">
                  {result.detail ?? (result.kind === "page" ? "Page" : "")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
