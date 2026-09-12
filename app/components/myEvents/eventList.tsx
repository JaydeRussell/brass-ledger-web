"use client";
import Link from "next/link";
import type { MyEvent } from "../../lib/myEvents";
import { formatDateRange } from "../../lib/eventDates";
import Card from "../ui/card";

/**
 * "Live now" for an event whose own date range covers this moment,
 * "Starts in Xd/Xh/Xm" counting down to one that hasn't started yet, or
 * undefined for one that's already over. Deliberately computed purely
 * from the event's own StartDate/EndDate rather than which
 * past/present/future bucket a page happened to fetch it into, so it
 * works the same regardless of which list renders it (My Events'
 * Ongoing/Future tabs, the Calendar page's combined upcoming list) —
 * and naturally returns undefined for an already-concluded event
 * without needing to know it came from the Past bucket at all.
 */
function formatCountdown(startDate?: string, endDate?: string): string | undefined {
  if (!startDate) return undefined;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return undefined;

  const now = new Date();
  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime()) && now > end) return undefined; // already over
  }
  if (now >= start) return "Live now";

  const diffMin = Math.max(1, Math.round((start.getTime() - now.getTime()) / 60000));
  if (diffMin < 60) return `Starts in ${diffMin}m`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `Starts in ${diffHour}h`;
  return `Starts in ${Math.round(diffHour / 24)}d`;
}

/**
 * One event card: the summary line (name, countdown/status, dates,
 * placing, faction, team) plus a direct link to the event's own page
 * (app/page.tsx, opened to this event via its `?event=` query param —
 * see that file's dedicated hydration effect for how it's consumed and
 * then stripped back out of the URL).
 *
 * This used to hide the link behind a click-to-expand step that only
 * ever revealed "Status" and "Dates" — both already visible right here
 * on the collapsed line — plus the link itself. That extra click added
 * nothing, so the link now sits directly on the card instead.
 */
function EventCard({ event }: { event: MyEvent }) {
  const dateRange = formatDateRange(event.startDate, event.endDate);
  const placingDetail =
    event.placing != null
      ? `#${event.placing}${event.points != null ? ` · ${event.points} pts` : ""}`
      : undefined;
  const countdown = formatCountdown(event.startDate, event.endDate);

  return (
    <li>
      <Card className="p-3">
        <div className="truncate text-sm font-medium text-text-primary">{event.eventName}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
          {countdown && (
            <span className="rounded-sm bg-brass-500/15 px-1.5 py-0.5 font-medium text-brass-600 dark:text-brass-400">
              {countdown}
            </span>
          )}
          {dateRange && <span>{dateRange}</span>}
          {placingDetail && <span>{placingDetail}</span>}
          {event.faction && <span>{event.faction}</span>}
          {event.team && <span className="truncate">{event.team}</span>}
        </div>
        <Link
          href={`/?event=${encodeURIComponent(event.eventId)}`}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brass-600 hover:underline dark:text-brass-400"
        >
          View event page →
        </Link>
      </Card>
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
      <p className="rounded-lg border border-dashed border-surface-border p-6 text-center text-sm text-text-secondary">
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
