"use client";
import type { ItcRanking } from "../../lib/bcp";
import ArmyListLink from "./armyListLink";
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
 * lists an individual: name (+ disposition badge) on one row; faction,
 * then the army list link and already-published ITC score/rank flush
 * right, on the next.
 *
 * The name links to the player's /players/[bcpUserId] stats page. When
 * BCP has a published army list, a separate List pill sits under the
 * disposition badge, so the list is visible rather than hidden behind
 * the name.
 *
 * Callers own their own outer box (list-item background, card border,
 * grid placement, etc.) — this is just the content.
 */
export default function PlayerCard({ player, ranking, itcLeagueId, size = "xs" }: PlayerCardProps) {
  const hasStatsRow = Boolean(player.faction) || Boolean(ranking) || Boolean(player.list);
  // BCP sometimes reuses subFaction to carry a Force Disposition value
  // (see types/player.d.ts) — shown as the badge above instead, so it's
  // only worth repeating here when it's a genuine distinct subfaction.
  const subFactionDetail =
    player.subFaction && player.subFaction !== player.disposition ? player.subFaction : undefined;

  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate text-text-secondary">
          <PlayerStatsLink name={player.name} bcpUserId={player.bcpUserId} />
          {player.homeClub && <span className="ml-1.5 text-text-tertiary">({player.homeClub})</span>}
        </span>
        <DispositionBadge disposition={player.disposition} />
      </div>
      {hasStatsRow && (
        // Faction stays left-anchored; the list link and ITC are pushed to
        // the far right via ml-auto, so the list sits under the disposition
        // badge and a column of these doesn't drift row to row.
        <div className="flex items-center gap-1.5">
          {player.faction && (
            <span className="min-w-0 flex-1 truncate text-text-tertiary">
              {player.faction}
              {subFactionDetail && ` — ${subFactionDetail}`}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {player.list && <ArmyListLink href={player.list} playerName={player.name} />}
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
