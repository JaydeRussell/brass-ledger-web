"use client";
import React from "react";
import { fetchMyStats, fetchPlayerStats, type MyStats, type PlacingWithField } from "../../lib/myStats";
import { fetchCurrentItcLeagueId, fetchItcRanking, type ItcRanking } from "../../lib/bcp";
import ItcBadge from "../shared/itcBadge";
import Spinner from "../shared/spinner";
import Card from "../ui/card";
import ErrorAlert from "../ui/errorAlert";
import { useDelayedFlag } from "../../lib/useDelayedFlag";
import { logClientEvent } from "../../lib/clientLog";

type PlayerStatsPanelProps = {
  bcpUserId: string;
  // "me" (the default) is the signed-in account's own stats, fetched via
  // fetchMyStats — bcpUserId is only used for the ITC badge/link in this
  // mode, since fetchMyStats already resolves the caller's own linked
  // profile server-side. "player" fetches an arbitrary player's stats by
  // bcpUserId instead (see app/players/[bcpUserId]/page.tsx), and swaps
  // the ITC badge's title from "your" to that player's name.
  mode?: "me" | "player";
  // Only used (and required) in "player" mode, for copy like the ITC
  // badge's title — "me" mode always says "your".
  playerName?: string;
};

function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex min-w-[6rem] flex-1 flex-col items-center rounded-lg bg-surface-2 px-3 py-2 text-center">
      <span className="text-lg font-semibold text-text-primary">{value}</span>
      <span className="text-xs text-text-secondary">{label}</span>
      {detail && <span className="text-[10px] text-text-tertiary">{detail}</span>}
    </div>
  );
}

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** "of 53 · top 4%" — undefined if the event never published a field size. */
function fieldDetail(p?: PlacingWithField): string | undefined {
  if (!p?.fieldSize) return undefined;
  const percentile = Math.max(1, Math.round((p.placing / p.fieldSize) * 100));
  return `of ${p.fieldSize} · top ${percentile}%`;
}

/** "Nov 2025" from a BCP date string, or undefined if it can't be parsed. */
function formatMonthYear(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

/**
 * A player's stats — best placing (overall, and split GT vs Teams vs
 * RTT), each with the field size it was achieved in when BCP published
 * one ("of 53 · top 4%"), plus a per-faction breakdown, how long they've
 * been competing, and a current ITC score/rank badge once a game system
 * can be resolved. All straight from internal/api/stats.go's aggregation
 * of BCP's own already-published placing history — see the scope note
 * in app/page.tsx before adding anything that scores or ranks rather
 * than displays already-published numbers.
 *
 * Two modes, sharing everything but which endpoint they hit and a couple
 * of copy strings: "me" (the default) is the signed-in account's own
 * stats, on its own page (app/stats/page.tsx) rather than as a card
 * squeezed onto another page, once there was enough here to warrant it.
 * "player" is an arbitrary other player's stats (app/players/[bcpUserId]
 * /page.tsx), reached by clicking their name anywhere else in the app
 * (roster, pairings, placings) that already has their bcpUserId in hand.
 */
export default function PlayerStatsPanel({ bcpUserId, mode = "me", playerName }: PlayerStatsPanelProps) {
  const [stats, setStats] = React.useState<MyStats | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [itcLeagueId, setItcLeagueId] = React.useState<string | undefined>(undefined);
  const [itcRanking, setItcRanking] = React.useState<ItcRanking | null | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    (mode === "player" ? fetchPlayerStats(bcpUserId) : fetchMyStats())
      .then((data) => {
        if (cancelled) return;
        setStats(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        logClientEvent("error", "player stats: failed to load", { error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [bcpUserId, mode]);

  // A separate effect: only once the player's most recent event is known
  // (from `stats`) does it make sense to look up an ITC ranking, same
  // "don't fetch more than a feature needs" reasoning as everywhere else
  // this app talks to BCP. Anchored on that event's own known leagues,
  // not a bare game system id — see fetchCurrentItcLeagueId's doc
  // comment in lib/bcp.ts for why.
  React.useEffect(() => {
    const mostRecentEventId = stats?.mostRecentEventId;
    if (!mostRecentEventId) return;
    let cancelled = false;
    fetchCurrentItcLeagueId(mostRecentEventId)
      .then((leagueId) => {
        if (cancelled || !leagueId) return;
        setItcLeagueId(leagueId);
        return fetchItcRanking(bcpUserId, leagueId);
      })
      .then((ranking) => {
        if (cancelled || ranking === undefined) return;
        setItcRanking(ranking);
      })
      .catch(() => {
        // An ITC lookup failing just means no badge — not worth
        // surfacing as an error alongside the placing/faction stats
        // above, which already loaded fine.
      });
    return () => {
      cancelled = true;
    };
  }, [stats?.mostRecentEventId, bcpUserId]);

  // stats is only ever null before the first fetchMyStats resolution —
  // it always resolves to a real MyStats (with linked: false, not null,
  // for an account with nothing to show) once it does.
  const loading = stats === null && !error;
  const slowLoad = useDelayedFlag(loading);

  if (error) {
    // In "me" mode this fails quietly — the event tabs below are the
    // important part of /stats. In "player" mode there's nothing else on
    // the page, so a silent null would just look broken; show it.
    if (mode !== "player") return null;
    return (
      <ErrorAlert size="sm">Couldn&apos;t load {playerName ?? "this player"}&apos;s stats: {error}</ErrorAlert>
    );
  }

  if (loading) {
    return (
      <Card role="status" aria-live="polite" className="p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Spinner size="sm" />
          <span className="text-sm text-text-secondary">Loading player stats…</span>
        </div>
        {slowLoad && (
          <p className="mt-2 text-xs text-text-tertiary">
            Taking longer than usual — this app hasn&apos;t seen some of{" "}
            {mode === "player" ? `${playerName ?? "this player"}'s` : "your"} events before, so
            it&apos;s asking Best Coast Pairings for them the first time.
          </p>
        )}
      </Card>
    );
  }

  if (!stats || !stats.linked || stats.totalEvents === 0) {
    if (mode !== "player") return null;
    return (
      <Card className="p-4 shadow-sm">
        <p className="text-sm text-text-secondary">
          No concluded events published for {playerName ?? "this player"} yet — stats appear once
          Best Coast Pairings has a final placing for at least one event.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Player stats</h2>
          {formatMonthYear(stats.competingSince) && (
            <p className="text-xs text-text-tertiary">
              Competing since {formatMonthYear(stats.competingSince)}
            </p>
          )}
        </div>
        {itcRanking && (
          <ItcBadge
            ranking={itcRanking}
            bcpUserId={bcpUserId}
            leagueId={itcLeagueId}
            title={mode === "player" ? `View ${playerName ?? "this player"}'s full ITC history on BCP` : "View your full ITC history on BCP"}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <StatTile label="Events played" value={String(stats.totalEvents)} />
        <StatTile
          label="Best placing"
          value={stats.bestPlacing !== undefined ? ordinal(stats.bestPlacing.placing) : "—"}
          detail={fieldDetail(stats.bestPlacing)}
        />
        <StatTile
          label="Best GT placing"
          value={stats.bestPlacingGt !== undefined ? ordinal(stats.bestPlacingGt.placing) : "—"}
          detail={fieldDetail(stats.bestPlacingGt)}
        />
        <StatTile
          label="Best Teams placing"
          value={stats.bestPlacingTeams !== undefined ? ordinal(stats.bestPlacingTeams.placing) : "—"}
          detail={fieldDetail(stats.bestPlacingTeams)}
        />
        <StatTile
          label="Best RTT placing"
          value={stats.bestPlacingRtt !== undefined ? ordinal(stats.bestPlacingRtt.placing) : "—"}
          detail={fieldDetail(stats.bestPlacingRtt)}
        />
      </div>

      {stats.factions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-surface-border pt-3">
          {stats.factions.map((f) => (
            <span
              key={f.faction}
              className="rounded-full border border-surface-border bg-surface-2 px-2.5 py-1 text-xs text-text-secondary"
            >
              {f.faction} · {f.eventCount} event{f.eventCount === 1 ? "" : "s"}
              {f.bestPlacing !== undefined && ` · best ${ordinal(f.bestPlacing)}`}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
