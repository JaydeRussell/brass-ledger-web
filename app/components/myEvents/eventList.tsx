"use client";
import Link from "next/link";
import type { MyEvent } from "../../lib/myEvents";
import { formatCountdown, formatDateRange } from "../../lib/eventDates";
import Card from "../ui/card";
import EmptyState from "../shared/emptyState";

/**
 * One event card: the summary line (name, countdown/status, dates,
 * placing, faction, team) plus a direct link to the event's own page
 * (app/event/page.tsx, opened to this event via its `?event=` query
 * param — see that file's dedicated hydration effect for how it's
 * consumed and then stripped back out of the URL).
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
            <span className="rounded-sm bg-brass-500/15 px-1.5 py-0.5 font-medium text-brass-400">
              {countdown}
            </span>
          )}
          {dateRange && <span>{dateRange}</span>}
          {placingDetail && <span>{placingDetail}</span>}
          {event.faction && <span>{event.faction}</span>}
          {event.team && <span className="truncate">{event.team}</span>}
        </div>
        <Link
          href={`/event?event=${encodeURIComponent(event.eventId)}`}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brass-400 hover:underline"
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
      <EmptyState
        icon={
          <svg aria-hidden viewBox="0 0 24 24" fill="none" className="h-7 w-7">
            <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        }
        message={emptyMessage}
      />
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
