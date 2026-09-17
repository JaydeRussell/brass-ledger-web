"use client";
import type { EventInfo } from "../../lib/bcp";
import LinkifiedText from "../shared/linkifiedText";
import Skeleton from "../shared/skeleton";
import Card from "../ui/card";
import { useDelayedFlag } from "../../lib/useDelayedFlag";
import { formatDateRange } from "../../lib/eventDates";

type OverviewPanelProps = {
  eventInfo: EventInfo | null;
};

function statusLine(info: EventInfo): string {
  if (!info.started) return "Hasn't started yet";
  if (info.ended) return `Ended — ${info.numberOfRounds} round${info.numberOfRounds === 1 ? "" : "s"}`;
  return `Round ${info.currentRound} of ${info.numberOfRounds || "?"} — in progress`;
}

/**
 * A handful of small facts about the event, laid out like BCP's own
 * Overview tab: dates, location, organizer, and registration counts.
 * Nothing here is computed — it's straight from BCP's event metadata.
 */
function FactRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="w-24 shrink-0 text-text-tertiary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}

/**
 * The event's landing tab: what it is, where it's at, plus the event facts
 * BCP's own Overview tab shows (dates, venue, organizer, registration
 * counts, description). Deliberately just this — your own round, your
 * team, and who you're following each moved to their own tab (Mine/Team)
 * once this one got crowded; see minePanel.tsx and myTeamPanel.tsx.
 */
export default function OverviewPanel({ eventInfo }: OverviewPanelProps) {
  const dateRange = eventInfo ? formatDateRange(eventInfo.startDate, eventInfo.endDate) : undefined;
  const slowLoad = useDelayedFlag(!eventInfo);

  return (
    <Card className="p-4 shadow-sm">
      {eventInfo ? (
        <>
          {eventInfo.gameSystem && (
            <p className="text-xs font-semibold uppercase tracking-wide text-brass-500">{eventInfo.gameSystem}</p>
          )}
          <p className="mt-0.5 font-semibold text-text-primary">{eventInfo.name}</p>
          <p className="mt-1 text-sm text-text-secondary">
            {eventInfo.teamEvent ? "Team event" : "Singles event"} · {statusLine(eventInfo)}
          </p>

          <div className="mt-3 flex flex-col gap-1 border-t border-surface-border pt-3">
            <FactRow label="Dates" value={dateRange} />
            <FactRow label="Location" value={eventInfo.location} />
            <FactRow label="Organizer" value={eventInfo.organizer} />
            <FactRow
              label={eventInfo.registrationLabel ?? "Registered"}
              value={
                eventInfo.registrationCount ??
                (eventInfo.playerCount !== undefined ? String(eventInfo.playerCount) : undefined)
              }
            />
            <FactRow label="Circuits" value={eventInfo.circuits?.join(", ")} />
          </div>

          {eventInfo.description && (
            <LinkifiedText
              text={eventInfo.description}
              className="mt-3 whitespace-pre-wrap border-t border-surface-border pt-3 text-sm text-text-secondary"
            />
          )}
        </>
      ) : (
        <div aria-live="polite">
          <span className="sr-only">Loading event…</span>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-4 w-48" />
          <Skeleton className="mt-1.5 h-3 w-64" />
          <div className="mt-3 flex flex-col gap-2 border-t border-surface-border pt-3">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-52" />
            <Skeleton className="h-3 w-36" />
          </div>
          {slowLoad && (
            <p className="mt-3 text-xs text-text-tertiary">
              Taking longer than usual — this is a first look at this event, so it&apos;s asking
              Best Coast Pairings directly.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
