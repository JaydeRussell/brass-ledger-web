"use client";
import React, { useState } from "react";
import type { RecentEvent } from "../../lib/recentEvents";

type EventSettingsProps = {
  eventId: string;
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

export default function EventSettings({
  eventId,
  eventName,
  recentEvents,
  onChangeEvent,
}: EventSettingsProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(eventId);

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
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          // Starts empty, not prefilled with the current event's id — the
          // same text also drives the recent-events dropdown below, and a
          // non-empty starting value (matching nothing else) would filter
          // every recent event out the moment the panel opens.
          setDraft("");
          setOpen((v) => !v);
        }}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <span className="max-w-[10rem] truncate sm:max-w-[14rem]">{eventName ?? "Loading event…"}</span>
        <span aria-hidden className="text-zinc-400">⚙</span>
      </button>

      {open && (
        // Capped by viewport width (not just a fixed w-80) so this can't
        // spill off the left edge of a narrow phone screen — right-0 keeps
        // it anchored to the gear button, so any shrinking comes off the
        // dropdown's own left side rather than pushing it off-screen.
        <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            BCP event URL or ID
          </label>
          <div className="relative mt-1">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Paste a URL/ID, or pick a recent event below…"
              className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />

            {/* A dropdown of recently-viewed events, narrowed by whatever's
                typed above — lets you pick one instead of finding and
                pasting its URL again. Floats over the buttons below it,
                like any other dropdown, rather than pushing them down. */}
            {filteredRecent.length > 0 && (
              <ul className="absolute inset-x-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
                {filteredRecent.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => submit(event.id)}
                      className="block w-full truncate px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      {event.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => submit()}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Switch event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
