"use client";
import type { ItcRanking } from "../../lib/bcp";
import DispositionBadge from "./dispositionBadge";
import ItcBadge from "./itcBadge";
import PlayerStatsLink from "./playerStatsLink";

type PlayerCardProps = {
  player: Player;
  // This player's already-published ITC score/rank, when known.
  ranking?: ItcRanking | null;
  itcLeagueId?: string | null;
  // "xs" (the default) for the compact contexts this is normally shown in
  // (roster-list items, board matchup rows); "sm" for the roomier Roster
  // tab card.
  size?: "sm" | "xs";
};

/**
 * The shared read-only layout for one player, used everywhere the app
 * lists an individual: name (+ disposition badge) on one row, faction (+
 * their already-published ITC score/rank, always flush right) on the
 * next — the template worked out for the "Your round" team-roster
 * fallback list, now reused for the Roster tab's cards and expanded board
 * matchup rows too, rather than each place hand-rolling its own version.
 *
 * The name links to the player's published BCP army list when one
 * exists, falling back to their /players/[bcpUserId] stats page — a list
 * is the more useful click target when both are available, and BCP's own
 * account page doesn't link out to either, so this is the only "list"
 * link most players get.
 *
 * Callers own their own outer box (list-item background, card border,
 * grid placement, etc.) — this is just the content.
 */
export default function PlayerCard({ player, ranking, itcLeagueId, size = "xs" }: PlayerCardProps) {
  const hasStatsRow = Boolean(player.faction) || Boolean(ranking);
  // BCP sometimes reuses subFaction to carry a Force Disposition value
  // (see types/player.d.ts) — shown as the badge above instead, so it's
  // only worth repeating here when it's a genuine distinct subfaction.
  const subFactionDetail =
    player.subFaction && player.subFaction !== player.disposition ? player.subFaction : undefined;

  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate text-text-secondary">
          {player.list ? (
            <a
              href={player.list}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:underline"
            >
              {player.name}
            </a>
          ) : (
            <PlayerStatsLink name={player.name} bcpUserId={player.bcpUserId} />
          )}
          {player.homeClub && <span className="ml-1.5 text-text-tertiary">({player.homeClub})</span>}
        </span>
        <DispositionBadge disposition={player.disposition} />
      </div>
      {hasStatsRow && (
        // Faction stays left-anchored, ITC is pushed to the far right via
        // ml-auto — both edges land at the same x-position regardless of
        // content length, so a column of these doesn't drift row to row.
        <div className="flex items-center gap-1.5">
          {player.faction && (
            <span className="min-w-0 flex-1 truncate text-text-tertiary">
              {player.faction}
              {subFactionDetail && ` — ${subFactionDetail}`}
            </span>
          )}
          <div className="ml-auto">
            <ItcBadge
              ranking={ranking}
              bcpUserId={player.bcpUserId}
              leagueId={itcLeagueId}
              title={`View ${player.name}'s full ITC history on BCP`}
              size={size}
            />
          </div>
        </div>
      )}
    </div>
  );
}
