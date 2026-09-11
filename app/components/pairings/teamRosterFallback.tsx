"use client";
import type { ItcRanking } from "../../lib/bcp";
import ItcBadge from "../shared/itcBadge";
import PlayerStatsLink from "../shared/playerStatsLink";

type TeamRosterFallbackProps = {
  side1Name: string;
  side1Players: Player[];
  side2Name: string;
  side2Players: Player[];
  itcByUserId?: Record<string, ItcRanking | null>;
  itcLeagueId?: string | null;
};

/**
 * Shown in place of individual board matchups when BCP has published a
 * team-vs-team pairing but not yet the board-by-board assignments within
 * it — still just a display of each side's already-published roster (the
 * same list the Roster tab shows), not a guess at who plays whom.
 */
export default function TeamRosterFallback({
  side1Name,
  side1Players,
  side2Name,
  side2Players,
  itcByUserId,
  itcLeagueId,
}: TeamRosterFallbackProps) {
  return (
    <div className="grid grid-cols-2 gap-2 px-1 py-1 sm:gap-3">
      {[
        { name: side1Name, players: side1Players },
        { name: side2Name, players: side2Players },
      ].map((side) => (
        <div key={side.name} className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-text-tertiary">{side.name}</p>
          <ul className="flex flex-col gap-1">
            {side.players.map((player) => (
              <li
                key={player.id}
                className="flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-xs"
              >
                <span className="min-w-0 flex-1 truncate text-text-secondary">
                  <PlayerStatsLink name={player.name} bcpUserId={player.bcpUserId} />
                </span>
                <ItcBadge
                  ranking={player.bcpUserId ? itcByUserId?.[player.bcpUserId] : undefined}
                  bcpUserId={player.bcpUserId}
                  leagueId={itcLeagueId}
                  title={`View ${player.name}'s full ITC history on BCP`}
                  size="xs"
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
