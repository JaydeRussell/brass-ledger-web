"use client";
import type { ItcRanking } from "../../lib/bcp";
import PlayerCard from "./playerCard";

type TeamRosterProps = {
  teamName: string;
  players: Player[];
  onTrack?: () => void;
  tracked?: boolean;
  // BCP's current flagship ITC ranking league id (see fetchCurrentItcLeagueId
  // in lib/bcp.ts) — used to build each player's profile link below.
  itcLeagueId?: string | null;
  // Already-published ITC score + rank, keyed by BCP global user id — only
  // populated (by page.tsx) for this team's own roster members while the
  // team is followed, so members show nothing until then rather than
  // triggering a lookup per player on every roster card.
  itcRankings?: Record<string, ItcRanking | null>;
};

/**
 * A plain, read-only display of one team's roster. On purpose there is no
 * scoring, ranking, or click-to-pair interaction here — see the note in
 * types/player.d.ts for why.
 */
export default function TeamRoster({
  teamName,
  players,
  onTrack,
  tracked,
  itcLeagueId,
  itcRankings,
}: TeamRosterProps) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border bg-surface-1 shadow-sm ${
        tracked ? "border-brass-500/50 ring-1 ring-brass-500/30" : "border-surface-border"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-surface-border bg-surface-2 px-4 py-3">
        <div>
          <p className="font-semibold text-text-primary">{teamName}</p>
          <p className="text-sm text-text-secondary">
            {players.length} player{players.length === 1 ? "" : "s"}
          </p>
        </div>
        {onTrack && (
          <button
            type="button"
            onClick={onTrack}
            title={tracked ? "Following this team's pairings" : "Follow this team's pairings"}
            className={`shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              tracked
                ? "border-brass-500/40 bg-brass-500/15 text-brass-600 dark:text-brass-400"
                : "border-surface-border text-text-secondary hover:bg-surface-1"
            }`}
          >
            {tracked ? "Following ✓" : "Follow"}
          </button>
        )}
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
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
