"use client";
import React from "react";
import Link from "next/link";
import type { MyEvent } from "../../lib/myEvents";

// Same date-range formatting as overviewPanel.tsx's formatDateRange —
// duplicated rather than shared, since it's a small pure helper and this
// app doesn't have a shared "lib/dates.ts" yet.
function formatDateRange(start?: string, end?: string): string | undefined {
  if (!start) return undefined;
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return undefined;
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  if (!end) return fmt(startDate);
  const endDate = new Date(end);
  if (Number.isNaN(endDate.getTime())) return fmt(startDate);
  if (fmt(startDate) === fmt(endDate)) return fmt(startDate);
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

// One (label, value) row of the expanded overview below — skipped
// entirely when there's no value, same as the collapsed summary line's
// conditional spans.
function OverviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <>
      <dt className="text-zinc-400 dark:text-zinc-500">{label}</dt>
      <dd className="truncate text-zinc-700 dark:text-zinc-300">{value}</dd>
    </>
  );
}

/**
 * One event card. Collapsed by default, showing the same one-line
 * summary this always has; the first click expands it in place to show
 * that same summary as a small overview plus a link to the event's own
 * page (app/page.tsx, opened to this event via its `?event=` query
 * param — see that file's dedicated hydration effect for how it's
 * consumed and then stripped back out of the URL). Clicking again
 * collapses it — same toggle-button pattern as eventSettings.tsx's gear
 * button, just without a floating panel.
 */
function EventCard({ event }: { event: MyEvent }) {
  const [expanded, setExpanded] = React.useState(false);
  const dateRange = formatDateRange(event.startDate, event.endDate);
  const placingDetail =
    event.placing != null
      ? `#${event.placing}${event.points != null ? ` · ${event.points} pts` : ""}`
      : undefined;

  return (
    <li className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full p-3 text-left"
      >
        <div className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
          {event.eventName}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-zinc-500 dark:text-zinc-400">
          {dateRange && <span>{dateRange}</span>}
          {placingDetail && <span>{placingDetail}</span>}
          {event.faction && <span>{event.faction}</span>}
          {event.team && <span className="truncate">{event.team}</span>}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-100 px-3 pb-3 pt-2 dark:border-zinc-800">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <OverviewRow label="Dates" value={dateRange} />
            <OverviewRow label="Result" value={placingDetail} />
            <OverviewRow label="Faction" value={event.faction} />
            <OverviewRow label="Team" value={event.team} />
          </dl>
          <Link
            href={`/?event=${encodeURIComponent(event.eventId)}`}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            View event page →
          </Link>
        </div>
      )}
    </li>
  );
}

/**
 * One tab's worth of events on the My Events page (see
 * app/my-events/page.tsx) — a plain full-width list, unlike the old
 * account-dropdown panel's height-capped EventSection, since this is now
 * a dedicated page with room to show everything.
 */
export default function EventList({
  events,
  emptyMessage,
}: {
  events: MyEvent[];
  emptyMessage: string;
}) {
  if (events.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {events.map((event) => (
        <EventCard key={event.eventId} event={event} />
      ))}
    </ul>
  );
}
