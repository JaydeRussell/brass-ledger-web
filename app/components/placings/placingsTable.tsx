"use client";
import React from "react";
import type { MyPairing, PlacingEntry } from "../../lib/bcp";
import { computePlacingBadges, type PlacingBadge } from "../../lib/placingBadges";
import ArmyListLink from "../shared/armyListLink";
import DispositionBadge from "../shared/dispositionBadge";
import PlayerStatsLink from "../shared/playerStatsLink";
import RefreshButton from "../shared/refreshButton";
import RoundScoreStrip from "../shared/roundScoreStrip";
import Skeleton from "../shared/skeleton";
import Badge from "../ui/badge";
import Card from "../ui/card";
import ErrorAlert from "../ui/errorAlert";
import TeamRosterList from "../pairings/teamRosterList";
import { isDisposition } from "../../lib/dispositions";
import { useDelayedFlag } from "../../lib/useDelayedFlag";

type PlacingsTableProps = {
  entries: PlacingEntry[];
  loading: boolean;
  error: string | null;
  // My own row's id (same id space as entry.id), highlighted when present.
  myId?: string;
  // Overrides the "nothing published yet" message below — used when
  // `entries` came back empty because a search filter matched nothing,
  // rather than because BCP has no placings published yet.
  emptyMessage?: string;
  // Re-fetches this event's placings on demand. No polling (see CLAUDE.md).
  onRefresh: () => void;
  // Team events only: each team's roster keyed by teamPlayerId (a team
  // row's entry.id), shown when the row expands.
  rosterByTeamId?: Map<string, Player[]>;
  // Singles events only: the roster entry behind each row, keyed by
  // entry.id (placings and roster share BCP's event-scoped player id).
  // Supplies the army list link and disposition.
  playerById?: Map<string, Player>;
  // Each entry's round-by-round results (see fetchPlacingRoundScores),
  // keyed by entry.id. Where present, a row shows a per-round score strip
  // in place of the plain record value.
  roundScoresById?: Map<string, MyPairing[]>;
  // When `entries` was last fetched — passed straight through to
  // RefreshButton's own label.
  lastSyncedAt?: number | null;
  // The event's full placings, unfiltered by search. "Best in faction"
  // badges and the sort options are judged across the whole event, so
  // they come from this rather than from `entries`. Defaults to `entries`.
  badgeEntries?: PlacingEntry[];
};

// A metric whose name looks like a win/loss-derived record (BCP's own
// "Match Points", a literal "Wins" count, etc.) — the number most players
// track first, so it's the one a collapsed row shows. Excludes the
// opponent-win-rate and strength-of-schedule tiebreakers, whose names
// ("Oppt. Game Win %", "Wins SoS") are win-shaped too.
const WIN_LOSS_METRIC_PATTERN = /win|match points|record|w\/l/i;
const OPPONENT_WIN_PCT_METRIC_PATTERN = /opp(?:onent|t)?\.?\s*(?:game\s*)?win/i;
const STRENGTH_OF_SCHEDULE_PATTERN = /\bsos\b|strength of schedule/i;

export const isRecordMetric = (name: string) =>
  WIN_LOSS_METRIC_PATTERN.test(name) &&
  !OPPONENT_WIN_PCT_METRIC_PATTERN.test(name) &&
  !STRENGTH_OF_SCHEDULE_PATTERN.test(name);

/** Every metric name across the entries, in first-seen order. */
export function metricNamesOf(entries: PlacingEntry[]): string[] {
  const names = new Set<string>();
  for (const e of entries) for (const m of e.metrics) names.add(m.name);
  return [...names];
}

// The metric a collapsed row shows when there's no round score strip: the
// record if this event has one, else whatever BCP lists first.
export function leadMetricName(names: string[]): string | undefined {
  return names.find(isRecordMetric) ?? names[0];
}

// "placing" is BCP's own published rank (the default order); "name" and a
// metric name are client-side display sorts. Each row keeps showing its
// real BCP placing whatever order the rows are in.
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

// Placing and name read best-first ascending; a metric (Wins, Battle
// Points) reads best-first descending.
const sortDirFor = (key: SortKey): 1 | -1 => (key === "placing" || key === "name" ? 1 : -1);

// BCP's averaged tiebreakers arrive with float noise (446.44679999999994).
export const formatMetric = (value: number | undefined) =>
  value === undefined ? "—" : String(Math.round(value * 100) / 100);

const formatPlacing = (placing?: number) =>
  placing === undefined ? "—" : String(placing).padStart(2, "0");

// Compact density's stand-in for the "Best …" badges: one star that opens
// the full list in a native popover on tap.
function CompactBadgeStar({ entryId, badge }: { entryId: string; badge: PlacingBadge }) {
  const labels = [
    badge.bestSuperFaction && `Best ${badge.bestSuperFaction}`,
    badge.bestFaction && `Best ${badge.bestFaction}`,
  ].filter(Boolean) as string[];
  const popoverId = `best-${entryId}`;
  return (
    <span className="hidden compact:inline">
      <button
        type="button"
        popoverTarget={popoverId}
        onClick={(e) => e.stopPropagation()}
        aria-label={labels.join(", ")}
        title={labels.join(", ")}
        className="rounded-sm px-1 text-brass-400 hover:bg-brass-500/15"
      >
        ★
      </button>
      <span
        id={popoverId}
        popover="auto"
        className="m-auto rounded-md border border-surface-border bg-surface-1 p-3 text-xs text-text-primary shadow-xl"
      >
        {labels.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </span>
    </span>
  );
}

function PlacingBadges({ entryId, badge }: { entryId: string; badge: PlacingBadge }) {
  return (
    <>
      <span className="inline-flex flex-wrap gap-1 compact:hidden">
        {badge.bestSuperFaction && (
          <Badge tone="brass" title={`Best-placed ${badge.bestSuperFaction} player`}>
            Best {badge.bestSuperFaction}
          </Badge>
        )}
        {badge.bestFaction && (
          <Badge tone="brass" title={`Best-placed ${badge.bestFaction} player`}>
            Best {badge.bestFaction}
          </Badge>
        )}
      </span>
      <CompactBadgeStar entryId={entryId} badge={badge} />
    </>
  );
}

/**
 * One placings row, stacked so it fits a phone without sideways scroll:
 * rank, then name, faction and disposition, then the round score strip
 * (or the lead metric's value when there are no round scores). The army
 * list link sits on the collapsed row so it's one tap away. Expanding
 * reveals every other metric BCP publishes and, for a team, its roster.
 */
function PlacingRow({
  entry,
  metricNames,
  leadMetric,
  roundScores,
  highlighted,
  roster,
  player,
  badge,
}: {
  entry: PlacingEntry;
  metricNames: string[];
  leadMetric?: string;
  roundScores?: MyPairing[];
  highlighted: boolean;
  roster?: Player[];
  player?: Player;
  badge?: PlacingBadge;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const showStrip = Boolean(roundScores?.length);
  // With a strip on the collapsed row every metric goes behind the toggle;
  // without one, the lead metric is already showing.
  const hiddenMetricNames = showStrip ? metricNames : metricNames.filter((n) => n !== leadMetric);
  const canExpand = Boolean(roster?.length) || hiddenMetricNames.length > 0;
  const leadValue = leadMetric ? entry.metrics.find((m) => m.name === leadMetric)?.value : undefined;
  const faction = entry.faction ?? player?.faction;
  // BCP often carries the Force Disposition as the subfaction; the badge
  // already shows it.
  const rawSubFaction = entry.subFaction ?? player?.subFaction;
  const subFaction = rawSubFaction && !isDisposition(rawSubFaction) ? rawSubFaction : undefined;
  const hasChips = Boolean(player?.disposition || player?.list || badge);
  const toggle = () => setExpanded((v) => !v);

  return (
    <li className={`border-t border-surface-border first:border-t-0 ${highlighted ? "bg-brass-500/10" : ""}`}>
      <div
        onClick={canExpand ? toggle : undefined}
        className={`flex items-start gap-3 px-2 py-2.5 ${canExpand ? "cursor-pointer" : ""}`}
      >
        <span className="w-6 shrink-0 pt-px text-sm font-semibold tabular-nums text-text-secondary">
          {formatPlacing(entry.placing)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-medium text-text-primary">
            <PlayerStatsLink name={entry.name} bcpUserId={entry.bcpUserId} />
          </span>
          {faction && (
            <span className="text-xs text-text-secondary">
              {faction}
              {subFaction && <span className="text-text-tertiary"> · {subFaction}</span>}
            </span>
          )}
          {hasChips && (
            <span className="flex flex-wrap items-center gap-1">
              <DispositionBadge disposition={player?.disposition} />
              {player?.list && <ArmyListLink href={player.list} playerName={entry.name} />}
              {badge && <PlacingBadges entryId={entry.id} badge={badge} />}
            </span>
          )}
          <span className="text-xs text-text-secondary">
            {showStrip && roundScores ? (
              <span className="inline-flex">
                <RoundScoreStrip pairings={roundScores} align="start" />
              </span>
            ) : leadMetric ? (
              <>
                <span className="text-text-tertiary">{isRecordMetric(leadMetric) ? "Record" : leadMetric}: </span>
                <span className="font-medium text-text-primary">{formatMetric(leadValue)}</span>
              </>
            ) : null}
          </span>
        </div>
        {canExpand && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={`${expanded ? "Hide" : "Show"} details for ${entry.name}`}
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-text-tertiary hover:bg-surface-2 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/60"
          >
            <span aria-hidden>{expanded ? "▲" : "▼"}</span>
          </button>
        )}
      </div>
      {expanded && canExpand && (
        <div className="pb-3 pl-11 pr-2">
          {hiddenMetricNames.length > 0 && (
            <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-xs">
              {hiddenMetricNames.map((name) => (
                <React.Fragment key={name}>
                  <dt className="text-text-tertiary">{name}</dt>
                  <dd className="text-right font-medium tabular-nums text-text-primary">
                    {formatMetric(entry.metrics.find((m) => m.name === name)?.value)}
                  </dd>
                </React.Fragment>
              ))}
            </dl>
          )}
          {roster && roster.length > 0 && (
            <div className={hiddenMetricNames.length > 0 ? "mt-2" : undefined}>
              <TeamRosterList name={entry.name} players={roster} />
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Standings as BCP has already computed and published them. The metrics
 * are whatever BCP reports for this event (e.g. Wins, Battle Points, Wins
 * SoS) rather than hardcoded — this only displays published numbers, it
 * doesn't calculate them.
 */
export default function PlacingsTable({
  entries,
  loading,
  error,
  myId,
  emptyMessage,
  onRefresh,
  rosterByTeamId,
  playerById,
  roundScoresById,
  lastSyncedAt,
  badgeEntries = entries,
}: PlacingsTableProps) {
  // From the unfiltered list, so searching never changes what shows.
  const metricNames = metricNamesOf(badgeEntries);
  const leadMetric = leadMetricName(metricNames);
  const slowLoad = useDelayedFlag(loading);
  const badges = React.useMemo(() => computePlacingBadges(badgeEntries), [badgeEntries]);

  const [sortKey, setSortKey] = React.useState<SortKey>("placing");
  const sortedEntries = React.useMemo(
    () => sortEntries(entries, sortKey, sortDirFor(sortKey)),
    [entries, sortKey]
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
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
            {slowLoad && (
              <p className="mt-2 text-xs text-text-tertiary">
                Taking longer than usual — still waiting on Best Coast Pairings.
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
          <div className="animate-fade-in">
            {entries.length >= 2 && (
              <div className="flex justify-end px-2 pb-2">
                <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                  Sort by
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value)}
                    className="rounded-md border border-surface-border bg-surface-1 px-2 py-1.5 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/60"
                  >
                    <option value="placing">Placing</option>
                    <option value="name">Name</option>
                    {metricNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <ul className="text-sm">
              {sortedEntries.map((entry) => (
                <PlacingRow
                  key={entry.id}
                  entry={entry}
                  metricNames={metricNames}
                  leadMetric={leadMetric}
                  roundScores={roundScoresById?.get(entry.id)}
                  highlighted={myId !== undefined && entry.id === myId}
                  roster={rosterByTeamId?.get(entry.id)}
                  player={playerById?.get(entry.id)}
                  badge={badges.get(entry.id)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
