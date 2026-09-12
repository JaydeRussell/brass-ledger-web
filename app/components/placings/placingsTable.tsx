"use client";
import React from "react";
import type { PlacingEntry } from "../../lib/bcp";
import PlayerStatsLink from "../shared/playerStatsLink";
import RefreshButton from "../shared/refreshButton";
import Spinner from "../shared/spinner";
import Card from "../ui/card";
import ErrorAlert from "../ui/errorAlert";
import TeamRosterList from "../pairings/teamRosterList";
import { useDelayedFlag } from "../../lib/useDelayedFlag";

type PlacingsTableProps = {
  entries: PlacingEntry[];
  loading: boolean;
  error: string | null;
  followedIds?: Set<string>;
  // Overrides the "nothing published yet" message below — used when
  // `entries` came back empty because a search filter matched nothing,
  // rather than because BCP has no placings published yet.
  emptyMessage?: string;
  // Re-fetches this event's placings on demand. Same reasoning as
  // RoundBoard's onRefresh — no polling/live-update timer (see CLAUDE.md),
  // just an explicit manual check.
  onRefresh: () => void;
  // For a team event, a row's own entry.id is that team's teamPlayerId
  // (see PlacingEntry's doc comment) — looked up here to let a row
  // expand into that team's already-published roster (roadmap #7),
  // reusing the same rosterByTeamId Roster/Pairings already build.
  // Absent (or empty for a given id) for a singles event, where a
  // placing row is already one person — such a row just doesn't expand.
  rosterByTeamId?: Map<string, Player[]>;
};

// A metric whose name looks like a win/loss-derived record (BCP's own
// "Match Points", a literal "Wins" count, etc.) — moved to the front of
// the columns regardless of where BCP's own metrics array happens to put
// it, since it's the number most players actually track first (roadmap
// #7). A metric already in front, or no match at all, is left as-is.
const WIN_LOSS_METRIC_PATTERN = /win|match points|record|w\/l/i;

function leadWithWinLoss(names: string[]): string[] {
  const idx = names.findIndex((name) => WIN_LOSS_METRIC_PATTERN.test(name));
  if (idx <= 0) return names;
  const reordered = [...names];
  const [winLoss] = reordered.splice(idx, 1);
  reordered.unshift(winLoss);
  return reordered;
}

/**
 * One placings row. For a team event with a roster available for this
 * entry's team (see rosterByTeamId), the row expands in place to show
 * that team's already-published roster — same reuse-not-recompute
 * posture as TeamRosterFallback elsewhere. A singles-event row (no
 * roster passed) just isn't expandable.
 */
function PlacingRow({
  entry,
  metricNames,
  highlighted,
  roster,
}: {
  entry: PlacingEntry;
  metricNames: string[];
  highlighted: boolean;
  roster?: Player[];
}) {
  const [expanded, setExpanded] = React.useState(false);
  const canExpand = Boolean(roster?.length);

  return (
    <>
      <tr
        onClick={canExpand ? () => setExpanded((v) => !v) : undefined}
        aria-expanded={canExpand ? expanded : undefined}
        className={`border-t border-surface-border ${highlighted ? "bg-brass-500/10" : ""} ${
          canExpand ? "cursor-pointer" : ""
        }`}
      >
        <td className="px-2 py-1.5 text-text-secondary">{entry.placing ?? "—"}</td>
        <td className="truncate px-2 py-1.5 font-medium text-text-primary">
          <PlayerStatsLink name={entry.name} bcpUserId={entry.bcpUserId} />
          {canExpand && (
            <span aria-hidden className="ml-1.5 text-xs text-text-tertiary">
              {expanded ? "▲" : "▼"}
            </span>
          )}
        </td>
        {metricNames.map((name) => (
          <td key={name} className="px-2 py-1.5 text-right text-text-secondary">
            {entry.metrics.find((m) => m.name === name)?.value ?? "—"}
          </td>
        ))}
      </tr>
      {expanded && canExpand && (
        <tr className="border-t border-surface-border">
          <td colSpan={2 + metricNames.length} className="px-2 pb-2 pt-1">
            <TeamRosterList name={entry.name} players={roster ?? []} />
          </td>
        </tr>
      )}
    </>
  );
}

/**
 * Standings as BCP has already computed and published them. The metric
 * columns are whatever BCP reports for this event (e.g. Wins, Battle
 * Points, Wins SoS) rather than hardcoded — this only displays published
 * numbers, it doesn't calculate them.
 */
export default function PlacingsTable({
  entries,
  loading,
  error,
  followedIds,
  emptyMessage,
  onRefresh,
  rosterByTeamId,
}: PlacingsTableProps) {
  const metricNames = leadWithWinLoss(entries[0]?.metrics.map((m) => m.name) ?? []);
  const slowLoad = useDelayedFlag(loading);

  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-surface-border bg-surface-2 px-4 py-3">
        <p className="font-semibold text-text-primary">Placings</p>
        <RefreshButton onRefresh={onRefresh} loading={loading} label="placings" />
      </div>

      <div className="p-3">
        {error && <ErrorAlert size="sm">Couldn&apos;t load placings: {error}</ErrorAlert>}

        {!error && loading && (
          <div className="p-2">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Spinner size="sm" />
              <span>Loading placings…</span>
            </div>
            {slowLoad && (
              <p className="mt-1 text-xs text-text-tertiary">
                Taking longer than usual — first look at this event.
              </p>
            )}
          </div>
        )}

        {!error && !loading && entries.length === 0 && (
          <p className="p-2 text-sm text-text-secondary">
            {emptyMessage ??
              "No placings published yet — this usually appears once a round or two has finished."}
          </p>
        )}

        {!error && !loading && entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs text-text-secondary">
                  <th className="px-2 py-1.5 font-medium">#</th>
                  <th className="px-2 py-1.5 font-medium">Name</th>
                  {metricNames.map((name) => (
                    <th key={name} className="px-2 py-1.5 text-right font-medium">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <PlacingRow
                    key={entry.id}
                    entry={entry}
                    metricNames={metricNames}
                    highlighted={followedIds?.has(entry.id) ?? false}
                    roster={rosterByTeamId?.get(entry.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
