"use client";
import type { EventInfo, MyPairing } from "../../lib/bcp";
import Spinner from "../shared/spinner";
import { useDelayedFlag } from "../../lib/useDelayedFlag";

type FollowedSummary = {
  label: string;
  pairings: MyPairing[];
};

type OverviewPanelProps = {
  eventInfo: EventInfo | null;
  following: FollowedSummary[];
  onGoToRoster: () => void;
  onGoToPairings: () => void;
};

function statusLine(info: EventInfo): string {
  if (!info.started) return "Hasn't started yet";
  if (info.ended) return `Ended — ${info.numberOfRounds} round${info.numberOfRounds === 1 ? "" : "s"}`;
  return `Round ${info.currentRound} of ${info.numberOfRounds || "?"} — in progress`;
}

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

/**
 * A handful of small facts about the event, laid out like BCP's own
 * Overview tab: dates, location, organizer, and registration counts.
 * Nothing here is computed — it's straight from BCP's event metadata.
 */
function FactRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="w-24 shrink-0 text-zinc-400 dark:text-zinc-500">{label}</span>
      <span className="text-zinc-700 dark:text-zinc-200">{value}</span>
    </div>
  );
}

/**
 * The event's landing tab: what it is, where it's at, plus the event facts
 * BCP's own Overview tab shows (dates, venue, organizer, registration
 * counts, description) — and (for each team or player you're following) a
 * quick glance at their most recent published pairing, with a link into
 * the full Pairings tab for the round-by-round detail.
 */
export default function OverviewPanel({
  eventInfo,
  following,
  onGoToRoster,
  onGoToPairings,
}: OverviewPanelProps) {
  const dateRange = eventInfo ? formatDateRange(eventInfo.startDate, eventInfo.endDate) : undefined;
  const slowLoad = useDelayedFlag(!eventInfo);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {eventInfo ? (
          <>
            {eventInfo.gameSystem && (
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
                {eventInfo.gameSystem}
              </p>
            )}
            <p className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-50">
              {eventInfo.name}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {eventInfo.teamEvent ? "Team event" : "Singles event"} · {statusLine(eventInfo)}
            </p>

            <div className="mt-3 flex flex-col gap-1 border-t border-zinc-100 pt-3 dark:border-zinc-800">
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
              <p className="mt-3 whitespace-pre-wrap border-t border-zinc-100 pt-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                {eventInfo.description}
              </p>
            )}
          </>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Spinner size="sm" />
              <span>Loading event…</span>
            </div>
            {slowLoad && (
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Taking longer than usual — this is a first look at this event, so it&apos;s asking
                Best Coast Pairings directly.
              </p>
            )}
          </div>
        )}
      </div>

      {following.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">Not following anyone</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Head to the Roster tab and hit &quot;Follow&quot; on any team or player — you can
            follow as many as you like.
          </p>
          <button
            type="button"
            onClick={onGoToRoster}
            className="mt-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Go to Roster →
          </button>
        </div>
      ) : (
        following.map((entry) => {
          const latestPairing = [...entry.pairings].reverse().find((p) => p.published);
          return (
            <div
              key={entry.label}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                Following {entry.label}
              </p>
              {latestPairing ? (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Round {latestPairing.round}: vs {latestPairing.opponentName}
                  {latestPairing.table && ` (table ${latestPairing.table})`}
                </p>
              ) : (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  No pairings published yet.
                </p>
              )}
              <button
                type="button"
                onClick={onGoToPairings}
                className="mt-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                View full pairings →
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
