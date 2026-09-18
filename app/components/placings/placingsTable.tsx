"use client";
import React from "react";
import type { MyPairing, PlacingEntry } from "../../lib/bcp";
import { computePlacingBadges, type PlacingBadge } from "../../lib/placingBadges";
import PlayerStatsLink from "../shared/playerStatsLink";
import RefreshButton from "../shared/refreshButton";
import RoundScoreStrip from "../shared/roundScoreStrip";
import Skeleton from "../shared/skeleton";
import Badge from "../ui/badge";
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
  // Each entry's round-by-round pairing result (see
  // fetchPlacingRoundScores' doc comment in lib/bcp.ts), keyed the same
  // way rosterByTeamId is — entry.id. Where present for a row, it
  // replaces that row's plain win/loss-record value with a per-round
  // score strip (e.g. "62 / 91 / 74", color-coded win/loss). Absent (or
  // empty for a given id) just falls back to BCP's own aggregate value,
  // same as before this existed.
  roundScoresById?: Map<string, MyPairing[]>;
  // When `entries` was last fetched — passed straight through to
  // RefreshButton's own label. See its doc comment.
  lastSyncedAt?: number | null;
};

// A metric whose name looks like a win/loss-derived record (BCP's own
// "Match Points", a literal "Wins" count, etc.) — moved to the front of
// the columns regardless of where BCP's own metrics array happens to put
// it, since it's the number most players actually track first (roadmap
// #7). Excludes anything that also looks like the opponent-win-rate
// metric below (BCP's real "Oppt. Game Win %" name matches both, being
// itself win-shaped), which would otherwise get mistaken for the record.
const WIN_LOSS_METRIC_PATTERN = /win|match points|record|w\/l/i;

// BCP's "Oppt. Game Win %" tiebreaker (or an equivalently-named opponent
// win-rate metric) — excluded from the record match above, nothing more;
// it's just one more metric that lives behind the expand toggle like
// everything else BCP publishes.
const OPPONENT_WIN_PCT_METRIC_PATTERN = /opp(?:onent|t)?\.?\s*(?:game\s*)?win/i;

const isRecordMetric = (name: string) =>
  WIN_LOSS_METRIC_PATTERN.test(name) && !OPPONENT_WIN_PCT_METRIC_PATTERN.test(name);

// The one column shown on a collapsed row; everything else BCP publishes
// moves behind the row's expand toggle rather than crowding the table
// (roadmap #7 follow-up).
function orderMetricColumns(names: string[]): string[] {
  const idx = names.findIndex(isRecordMetric);
  if (idx <= 0) return names;
  const reordered = [...names];
  const [record] = reordered.splice(idx, 1);
  reordered.unshift(record);
  return reordered;
}

// Which of the visible columns is the win/loss record — that's the one
// column a per-round score strip (see RoundScoreStrip below) stands in
// for, when round data is available, and the one whose header reads
// "Record" (see PlacingsTable) instead of BCP's often narrower literal
// name ("Wins", "Match Points", ...). Undefined if this event's metrics
// don't have one, in which case neither the strip nor the rename apply.
function findRecordMetricName(names: string[]): string | undefined {
  return names.find(isRecordMetric);
}

// RoundScoreStrip now lives in ../shared/roundScoreStrip.tsx — reused
// as-is on the Team tab (myTeamPanel.tsx) once that needed the same
// glanceable record too.

/**
 * One placings row. Only the lead record column (see orderMetricColumns)
 * shows on the collapsed row; the rest of whatever BCP publishes for this
 * event — including opponent win rate — plus (for a team event with a
 * roster available for this entry's team, see rosterByTeamId) that
 * team's already-published roster, reveal in place when the row is
 * expanded — same reuse-not-recompute posture as TeamRosterFallback
 * elsewhere. A row with neither hidden metrics nor a roster just isn't
 * expandable. Any "Best in Faction"/"Best in Super Faction" badge (see
 * computePlacingBadges) gets its own centered column between Name and
 * the record, rather than crowding inline after the name and expand
 * chevron — most rows have no badge at all, so a dedicated column keeps
 * the ones that do from looking cluttered.
 */
function PlacingRow({
  entry,
  visibleMetricNames,
  hiddenMetricNames,
  recordMetricName,
  roundScores,
  highlighted,
  roster,
  badge,
}: {
  entry: PlacingEntry;
  visibleMetricNames: string[];
  hiddenMetricNames: string[];
  recordMetricName?: string;
  roundScores?: MyPairing[];
  highlighted: boolean;
  roster?: Player[];
  badge?: PlacingBadge;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const canExpand = Boolean(roster?.length) || hiddenMetricNames.length > 0;

  return (
    <>
      <tr
        role={canExpand ? "button" : undefined}
        tabIndex={canExpand ? 0 : undefined}
        onClick={canExpand ? () => setExpanded((v) => !v) : undefined}
        onKeyDown={
          canExpand
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpanded((v) => !v);
                }
              }
            : undefined
        }
        aria-expanded={canExpand ? expanded : undefined}
        className={`border-t border-surface-border ${highlighted ? "bg-brass-500/10" : ""} ${
          canExpand ? "cursor-pointer" : ""
        }`}
      >
        <td className="px-2 py-1.5 text-text-secondary">{entry.placing ?? "—"}</td>
        {/* Sticky so the name stays on screen while scrolling a long
            event's metric columns sideways on a phone — see roadmap
            note on horizontal-scroll tables. A solid background (rather
            than relying on the <tr>'s own translucent highlight tint
            showing through) since a sticky cell paints in its own layer
            above whatever scrolls underneath it. */}
        <td className="sticky left-0 z-10 truncate bg-surface-1 px-2 py-1.5 font-medium text-text-primary">
          <PlayerStatsLink name={entry.name} bcpUserId={entry.bcpUserId} />
          {canExpand && (
            <span aria-hidden className="ml-1.5 text-xs text-text-tertiary">
              {expanded ? "▲" : "▼"}
            </span>
          )}
        </td>
        <td className="px-2 py-1.5">
          {badge?.bestSuperFaction && (
            <Badge tone="brass" title={`Best-placed ${badge.bestSuperFaction} player`}>
              Best {badge.bestSuperFaction}
            </Badge>
          )}
          {badge?.bestFaction && (
            <Badge
              tone="brass"
              className={badge.bestSuperFaction ? "ml-1.5" : ""}
              title={`Best-placed ${badge.bestFaction} player`}
            >
              Best {badge.bestFaction}
            </Badge>
          )}
        </td>
        {visibleMetricNames.map((name) => (
          <td key={name} className="px-2 py-1.5 text-right text-text-secondary">
            {name === recordMetricName && roundScores && roundScores.length > 0 ? (
              <RoundScoreStrip pairings={roundScores} />
            ) : (
              entry.metrics.find((m) => m.name === name)?.value ?? "—"
            )}
          </td>
        ))}
      </tr>
      {expanded && canExpand && (
        <tr className="border-t border-surface-border">
          <td colSpan={3 + visibleMetricNames.length} className="px-2 pb-2 pt-1">
            {hiddenMetricNames.length > 0 && (
              <dl className="mb-2 flex flex-wrap justify-end gap-2">
                {hiddenMetricNames.map((name) => (
                  <div
                    key={name}
                    className="flex flex-col-reverse items-center gap-0.5 rounded-lg bg-surface-2 px-2.5 py-1.5"
                  >
                    <dt className="text-[10px] text-text-tertiary">{name}</dt>
                    <dd className="text-xs font-semibold text-text-primary">
                      {entry.metrics.find((m) => m.name === name)?.value ?? "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {roster && roster.length > 0 && <TeamRosterList name={entry.name} players={roster} />}
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
 * numbers, it doesn't calculate them. Only the record column stays
 * visible on a collapsed row; the rest (opponent win rate included) live
 * behind each row's own expand toggle (see orderMetricColumns/PlacingRow).
 */
// "placing" is BCP's own published rank (the default, unsorted order);
// "name" and a metric name are this table's own client-side sorts,
// applied only to *display* order — each row's own "#" cell always
// keeps showing its real BCP placing regardless of how the rows
// underneath it are currently ordered.
export type SortKey = "placing" | "name" | string;

export function sortEntries(entries: PlacingEntry[], sortKey: SortKey, sortDir: 1 | -1): PlacingEntry[] {
  if (sortKey === "placing") return entries;
  const copy = [...entries];
  copy.sort((a, b) => {
    if (sortKey === "name") return sortDir * a.name.localeCompare(b.name);
    const av = a.metrics.find((m) => m.name === sortKey)?.value ?? -Infinity;
    const bv = b.metrics.find((m) => m.name === sortKey)?.value ?? -Infinity;
    return sortDir * (av - bv);
  });
  return copy;
}

/** A clickable column header that toggles this table's sort — ascending
 * on first click, descending on a second click of the same column,
 * back to BCP's own published order on a third. A real <button>, not a
 * <th onClick>, so it's keyboard-operable (Tab + Enter/Space) for free
 * rather than needing its own key handler. */
function SortableHeader({
  label,
  sortKey,
  activeKey,
  activeDir,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  activeDir: 1 | -1;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <th
      className={`px-2 py-1.5 font-medium ${align === "right" ? "text-right" : "text-left"} ${className ?? ""}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-0.5 hover:text-text-primary ${
          active ? "text-text-primary" : ""
        }`}
      >
        {label}
        <span aria-hidden className={`text-[10px] ${active ? "opacity-100" : "opacity-30"}`}>
          {active && activeDir === -1 ? "▼" : "▲"}
        </span>
      </button>
    </th>
  );
}

export default function PlacingsTable({
  entries,
  loading,
  error,
  followedIds,
  emptyMessage,
  onRefresh,
  rosterByTeamId,
  roundScoresById,
  lastSyncedAt,
}: PlacingsTableProps) {
  const orderedMetricNames = orderMetricColumns(entries[0]?.metrics.map((m) => m.name) ?? []);
  const visibleMetricNames = orderedMetricNames.slice(0, 1);
  const hiddenMetricNames = orderedMetricNames.slice(1);
  const recordMetricName = findRecordMetricName(orderedMetricNames);
  const slowLoad = useDelayedFlag(loading);
  // Pure over `entries` (no new prop threaded in from a caller) — see
  // computePlacingBadges' own doc comment.
  const badges = React.useMemo(() => computePlacingBadges(entries), [entries]);

  const [sortKey, setSortKey] = React.useState<SortKey>("placing");
  const [sortDir, setSortDir] = React.useState<1 | -1>(1);
  const handleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir(1);
    } else if (sortDir === 1) {
      setSortDir(-1);
    } else {
      setSortKey("placing");
      setSortDir(1);
    }
  };
  const sortedEntries = React.useMemo(
    () => sortEntries(entries, sortKey, sortDir),
    [entries, sortKey, sortDir]
  );

  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-surface-border bg-surface-2 px-4 py-3">
        <p className="font-semibold text-text-primary">Placings</p>
        <RefreshButton
          onRefresh={onRefresh}
          loading={loading}
          label="placings"
          lastSyncedAt={lastSyncedAt}
        />
      </div>

      <div className="p-3">
        {error && <ErrorAlert size="sm">Couldn&apos;t load placings: {error}</ErrorAlert>}

        {!error && loading && (
          <div className="p-2" aria-live="polite">
            <span className="sr-only">Loading placings…</span>
            <div className="flex flex-col gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))}
            </div>
            {slowLoad && (
              <p className="mt-2 text-xs text-text-tertiary">
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
          <div className="animate-fade-in overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs text-text-secondary">
                  <th className="px-2 py-1.5 font-medium">#</th>
                  <SortableHeader
                    label="Name"
                    sortKey="name"
                    activeKey={sortKey}
                    activeDir={sortDir}
                    onSort={handleSort}
                    className="sticky left-0 z-10 bg-surface-1"
                  />
                  <th className="px-2 py-1.5 font-medium" aria-hidden />
                  {visibleMetricNames.map((name) => (
                    <SortableHeader
                      key={name}
                      label={name === recordMetricName ? "Record" : name}
                      sortKey={name}
                      activeKey={sortKey}
                      activeDir={sortDir}
                      onSort={handleSort}
                      align="right"
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((entry) => (
                  <PlacingRow
                    key={entry.id}
                    entry={entry}
                    visibleMetricNames={visibleMetricNames}
                    hiddenMetricNames={hiddenMetricNames}
                    recordMetricName={recordMetricName}
                    roundScores={roundScoresById?.get(entry.id)}
                    highlighted={followedIds?.has(entry.id) ?? false}
                    roster={rosterByTeamId?.get(entry.id)}
                    badge={badges.get(entry.id)}
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
