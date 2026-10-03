"use client";
import type { ItcRanking } from "../../lib/bcp";
import PlayerCard from "./playerCard";

type TeamRosterProps = {
  teamName: string;
  players: Player[];
  // BCP's current flagship ITC ranking league id (see fetchCurrentItcLeagueId
  // in lib/bcp.ts) — used to build each player's profile link below.
  itcLeagueId?: string | null;
  // Already-published ITC score + rank, keyed by BCP global user id.
  itcRankings?: Record<string, ItcRanking | null>;
  // Called with a player's BCP user id once their card has been on screen
  // briefly, so their ITC ranking can be looked up.
  onPlayerVisible?: (bcpUserId: string) => void;
};

/**
 * A plain, read-only display of one team's roster. On purpose there is no
 * scoring, ranking, or click-to-pair interaction here — see the note in
 * types/player.d.ts for why.
 */
export default function TeamRoster({
  teamName,
  players,
  itcLeagueId,
  itcRankings,
  onPlayerVisible,
}: TeamRosterProps) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-1 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-surface-border bg-surface-2 px-4 py-3">
        <div>
          <p className="font-semibold text-text-primary">{teamName}</p>
          <p className="text-sm text-text-secondary">
            {players.length} player{players.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="p-3">
        {players.length === 0 ? (
          <p className="p-3 text-sm text-text-secondary">
            No players with a submitted list found for this team on BCP yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {players.map((player) => (
              <li key={player.id}>
                <PlayerCard
                  player={player}
                  itcLeagueId={itcLeagueId}
                  itcRanking={player.bcpUserId ? itcRankings?.[player.bcpUserId] : undefined}
                  onVisible={
                    player.bcpUserId && onPlayerVisible
                      ? () => onPlayerVisible(player.bcpUserId!)
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
