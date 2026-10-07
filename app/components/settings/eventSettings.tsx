"use client";
import React, { useId, useState } from "react";
import type { RecentEvent } from "../../lib/recentEvents";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdownMenu";
import Button from "../ui/button";
import { formatDateRange } from "../../lib/eventDates";
import { EVENT_SEARCH_MIN_LENGTH, searchEvents, type EventSearchResult } from "../../lib/follow";

type EventSettingsProps = {
  eventName?: string;
  recentEvents: RecentEvent[]; // excludes the currently-open event
  onChangeEvent: (eventId: string) => void;
};

/** Pulls a BCP event id out of a pasted event URL, or passes a bare id
 * straight through. */
function parseEventId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/event\/([^/?#]+)/);
  return match ? match[1] : trimmed;
}

/**
 * Built on ui/dropdownMenu.tsx's Radix-backed DropdownMenu — real
 * outside-click/Escape/focus-return handling for free, which the
 * hand-rolled useState(open) + conditional <div> panel this replaced
 * never had. The panel's content (an <input>, a filtered list, plain
 * buttons) is arbitrary rich content, not DropdownMenu.Item entries, so
 * it drops into DropdownMenuContent largely unchanged — see that file's
 * own comment on why Content/Item are composed separately rather than
 * one over-abstracted component.
 */
export default function EventSettings({
  eventName,
  recentEvents,
  onChangeEvent,
}: EventSettingsProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const inputId = useId();
  // Name search runs only on the Search button, so each query is one
  // deliberate request to BCP.
  const [results, setResults] = useState<EventSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const canSearch = draft.trim().length >= EVENT_SEARCH_MIN_LENGTH && !searching;

  const search = async () => {
    if (!canSearch) return;
    setSearching(true);
    setSearchError(null);
    try {
      setResults(await searchEvents(draft));
    } catch (err) {
      setResults(null);
      setSearchError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const submit = (idOverride?: string) => {
    const parsed = parseEventId(idOverride ?? draft);
    if (parsed) onChangeEvent(parsed);
    setOpen(false);
  };

  // Narrows the recent-events dropdown as you type in the same box, by
  // name or id — same plain substring match as the tab search boxes.
  const filteredRecent = recentEvents.filter((event) => {
    const query = draft.trim().toLowerCase();
    if (!query) return true;
    return (
      event.name.toLowerCase().includes(query) || event.id.toLowerCase().includes(query)
    );
  });

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Starts empty, not prefilled with the current event's id — the
        // same text also drives the recent-events dropdown below, and a
        // non-empty starting value (matching nothing else) would filter
        // every recent event out the moment the panel opens.
        if (next) {
          setDraft("");
          setResults(null);
          setSearchError(null);
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md border border-surface-border bg-surface-1 px-3 py-2 text-sm text-text-secondary shadow-sm hover:bg-surface-2"
        >
          <span className="max-w-[10rem] truncate sm:max-w-[14rem]">{eventName ?? "Loading event…"}</span>
          <span aria-hidden className="text-text-tertiary">⚙</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-3">
        <label htmlFor={inputId} className="block text-xs font-medium text-text-secondary">
          BCP event URL or ID, or an event name to search
        </label>
        <div className="relative mt-1">
          <input
            id={inputId}
            autoFocus
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setResults(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              // DropdownMenu.Content listens for arrow-key/type-ahead item
              // navigation by default (meant for DropdownMenu.Item rows,
              // none of which this panel has) — stop propagation so
              // ordinary typing/arrow-key editing in this text input isn't
              // intercepted by that listener.
              e.stopPropagation();
            }}
            placeholder="Paste a URL/ID, or pick a recent event below…"
            className="w-full rounded-md border border-surface-border bg-surface-0 px-2 py-2 text-sm text-text-primary outline-none focus:border-brass-500"
          />

          {/* A dropdown of recently-viewed events, narrowed by whatever's
              typed above — lets you pick one instead of finding and
              pasting its URL again. Floats over the buttons below it,
              like any other dropdown, rather than pushing them down. */}
          {results === null && filteredRecent.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-md border border-surface-border bg-surface-1 py-1 shadow-lg">
              {filteredRecent.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => submit(event.id)}
                    className="block w-full truncate px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-2"
                  >
                    {event.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {results !== null && (
          <div className="mt-2">
            {results.length === 0 ? (
              <p className="text-xs text-text-secondary">
                No 40k events from the past week or next two months match that name.
              </p>
            ) : (
              <ul className="max-h-64 overflow-y-auto rounded-md border border-surface-border py-1">
                {results.map((event) => {
                  const dates = formatDateRange(event.startDate, event.endDate);
                  return (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => submit(event.id)}
                        className="block w-full px-2 py-1.5 text-left hover:bg-surface-2"
                      >
                        <span className="block truncate text-sm text-text-primary">{event.name}</span>
                        <span className="block truncate text-xs text-text-tertiary">
                          {[dates, event.location, event.playerCount != null ? `${event.playerCount} players` : undefined]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
        {searchError && <p className="mt-2 text-xs text-danger-400">{searchError}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={search} disabled={!canSearch}>
            {searching ? "Searching…" : "Search BCP"}
          </Button>
          <Button variant="primary" onClick={() => submit()}>
            Switch event
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
