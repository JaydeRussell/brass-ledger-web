"use client";
import type { ItcRanking } from "../../lib/bcp";
import PlayerCard from "../shared/playerCard";

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
          <li key={player.id} className="rounded-md bg-surface-2 px-2 py-1">
            <PlayerCard
              player={player}
              ranking={player.bcpUserId ? itcByUserId?.[player.bcpUserId] : undefined}
              itcLeagueId={itcLeagueId}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
