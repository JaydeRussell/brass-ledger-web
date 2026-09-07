"use client";
import React, { useEffect, useState } from "react";
import { fetchBcpPlayers } from "../../lib/bcp";
import { linkBcpProfile } from "../../lib/myEvents";
import { loadRecentEvents, type RecentEvent } from "../../lib/recentEvents";
import { logClientEvent } from "../../lib/clientLog";

// Same approach as eventSettings.tsx's parseEventId, duplicated rather
// than imported (that one's module-private) — pulls a BCP event id out
// of a pasted event URL, or passes a bare id straight through.
function parseEventId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/event\/([^/?#]+)/);
  return match ? match[1] : trimmed;
}

type LinkMode = "roster" | "manual";

/**
 * The "pick yourself out of a roster you already know you played in"
 * linking flow — the recommended path, since it needs nothing from you
 * but an event you can recognize, reusing this app's own already-fetched
 * roster data (every Player already carries a bcpUserId — see
 * types/player.d.ts — this just surfaces it as a click target instead of
 * only feeding ItcBadge's profile link, which only appears for players
 * with a published ITC ranking). The alternative (LinkMode "manual") is
 * pasting a raw id/URL — still offered as a fallback, but no longer the
 * default, since finding your own id that way meant digging through the
 * browser's Network tab, which is rough going for a one-time setup step.
 */
function RosterPicker({ onPick }: { onPick: (bcpUserId: string, name: string) => void }) {
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [eventDraft, setEventDraft] = useState("");
  const [loadedEventId, setLoadedEventId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setRecentEvents(loadRecentEvents());
  }, []);

  const loadRoster = async (rawEventId: string) => {
    const eventId = parseEventId(rawEventId);
    if (!eventId) return;
    setLoading(true);
    setError(null);
    setPlayers(null);
    try {
      const roster = await fetchBcpPlayers(eventId);
      setPlayers(roster);
      setLoadedEventId(eventId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      logClientEvent("error", "my events: loading a roster to pick from failed", {
        eventId,
        error: message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Only players BCP actually gave an account id are pickable — a roster
  // entry can lack one in rare cases (see internal/bcp's Player doc
  // comment in the backend repo), and there's nothing useful to link for
  // those.
  const linkable = (players ?? []).filter((p) => p.bcpUserId);
  const filtered = linkable.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.faction.toLowerCase().includes(q);
  });

  return (
    <div>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
        Open an event you played in, then click your own name below.
      </p>

      {recentEvents.length > 0 && !players && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {recentEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => loadRoster(event.id)}
              className="max-w-full truncate rounded-full border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {event.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-1.5 flex gap-1">
        <input
          value={eventDraft}
          onChange={(e) => setEventDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadRoster(eventDraft)}
          placeholder="Or paste an event URL/ID…"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={() => loadRoster(eventDraft)}
          disabled={loading || !eventDraft.trim()}
          className="shrink-0 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Loading…" : "Load"}
        </button>
      </div>

      {error && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</div>}

      {players && (
        <div className="mt-1.5">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find your name…"
            className="mb-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          {filtered.length === 0 ? (
            <div className="py-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {linkable.length === 0
                ? "No linkable players found in that roster."
                : "No name matches — try a different spelling."}
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onPick(p.bcpUserId as string, p.name)}
                    className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    {p.name}
                    <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">{p.faction}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {loadedEventId && (
            <button
              type="button"
              onClick={() => {
                setPlayers(null);
                setLoadedEventId(null);
                setQuery("");
              }}
              className="mt-1 text-xs text-zinc-500 hover:underline dark:text-zinc-400"
            >
              Try a different event
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Links (or re-links) the signed-in account's Best Coast Pairings
 * profile. Extracted out of the old account-dropdown panel
 * (myEventsPanel.tsx, since removed — see the My Events page it now
 * lives on) into its own standalone component, since the dedicated My
 * Events page needs the same linking flow without the rest of that
 * panel's dropdown-specific chrome.
 */
export default function BcpProfileLinker({ onLinked }: { onLinked: (bcpUserId: string) => void }) {
  const [linkMode, setLinkMode] = useState<LinkMode>("roster");
  const [draft, setDraft] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const performLink = async (input: string, source: "roster" | "manual") => {
    if (!input.trim() || linking) return;
    setLinking(true);
    setLinkError(null);
    try {
      const linked = await linkBcpProfile(input);
      setDraft("");
      logClientEvent("info", "my events: linked BCP profile", { source });
      onLinked(linked);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setLinkError(message);
      logClientEvent("error", "my events: linking BCP profile failed", { source, error: message });
    } finally {
      setLinking(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Link your Best Coast Pairings profile
        </label>
        <button
          type="button"
          onClick={() => setLinkMode((m) => (m === "roster" ? "manual" : "roster"))}
          className="text-[11px] text-zinc-500 hover:underline dark:text-zinc-400"
        >
          {linkMode === "roster" ? "Paste a link/id instead" : "Pick from a roster instead"}
        </button>
      </div>

      {linkMode === "roster" ? (
        <div className="mt-2">
          <RosterPicker onPick={(id) => performLink(id, "roster")} />
        </div>
      ) : (
        <div className="mt-2 flex gap-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && performLink(draft, "manual")}
            placeholder="Profile URL or id…"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={() => performLink(draft, "manual")}
            disabled={linking || !draft.trim()}
            className="shrink-0 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {linking ? "Linking…" : "Link"}
          </button>
        </div>
      )}

      {linkError && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{linkError}</div>}
    </div>
  );
}
