"use client";
import Link from "next/link";

import Button from "../ui/button";
import Card from "../ui/card";
import { formatCountdown, formatDateRange } from "../../lib/eventDates";
import type { SpectatedEvent, SpectatingList as SpectatingListData } from "../../lib/follow";

type SpectatingListProps = {
  spectating: SpectatingListData;
  onRemove: (eventId: string) => void;
};

function SpectatedEventCard({ event, onRemove }: { event: SpectatedEvent; onRemove: (eventId: string) => void }) {
  const dateRange = formatDateRange(event.startDate, event.endDate);
  const countdown = event.started ? undefined : formatCountdown(event.startDate, event.endDate);
  return (
    <li>
      <Card className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-text-primary">{event.eventName || "Event"}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
              <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 font-medium text-text-secondary">Spectating</span>
              {countdown && (
                <span className="rounded-sm bg-brass-500/15 px-1.5 py-0.5 font-medium text-brass-400">{countdown}</span>
              )}
              {event.ended && <span>Finished</span>}
              {dateRange && <span>{dateRange}</span>}
              {event.playerName && <span className="truncate">Following {event.playerName}</span>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onRemove(event.eventId)} aria-label={`Stop spectating ${event.eventName || "this event"}`}>
            Remove
          </Button>
        </div>
        <Link
          href={`/event?event=${encodeURIComponent(event.eventId)}`}
          className="mt-2 inline-flex min-h-6 items-center gap-1 text-xs font-medium text-brass-400 hover:underline"
        >
          View event page →
        </Link>
      </Card>
    </li>
  );
}

function Section({ title, events, onRemove }: { title: string; events: SpectatedEvent[]; onRemove: (id: string) => void }) {
  if (events.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">{title}</h2>
      <ul className="flex flex-col gap-2">
        {events.map((event) => (
          <SpectatedEventCard key={event.eventId} event={event} onRemove={onRemove} />
        ))}
      </ul>
    </section>
  );
}

/** The events the viewer follows someone in, happening now and coming up. */
export default function SpectatingList({ spectating, onRemove }: SpectatingListProps) {
  return (
    <div className="flex flex-col gap-4">
      <Section title="Now" events={spectating.now} onRemove={onRemove} />
      <Section title="Upcoming" events={spectating.upcoming} onRemove={onRemove} />
    </div>
  );
}

/** How many events the Spectating tab holds. */
export function spectatingCount(spectating: SpectatingListData | null): number {
  return spectating ? spectating.now.length + spectating.upcoming.length : 0;
}
