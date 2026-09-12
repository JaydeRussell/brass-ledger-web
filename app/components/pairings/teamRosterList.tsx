"use client";
import type { ItcRanking } from "../../lib/bcp";
import ItcBadge from "../shared/itcBadge";
import PlayerStatsLink from "../shared/playerStatsLink";

type TeamRosterListProps = {
  name: string;
  players: Player[];
  itcByUserId?: Record<string, ItcRanking | null>;
  itcLeagueId?: string | null;
};

/** One team's already-published roster, as a compact labeled list —
 * factored out of TeamRosterFallback (which shows two of these side by
 * side) so a single roster can also be shown on its own, e.g. a
 * Placings row expanding to show that team's roster (roadmap #7). */
export default function TeamRosterList({ name, players, itcByUserId, itcLeagueId }: TeamRosterListProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-text-tertiary">{name}</p>
      <ul className="flex flex-col gap-1">
        {players.map((player) => (
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
  );
}
