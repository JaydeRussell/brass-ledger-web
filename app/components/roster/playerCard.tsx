"use client";
import type { ItcRanking } from "../../lib/bcp";
import SharedPlayerCard from "../shared/playerCard";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

type PlayerCardProps = {
  player: Player;
  onTrack?: () => void;
  tracked?: boolean;
  // BCP's current flagship ITC ranking league id (see fetchCurrentItcLeagueId
  // in lib/bcp.ts) — used to build the profile link below.
  itcLeagueId?: string | null;
  // This player's already-published ITC score + rank, when known — only
  // fetched (by page.tsx) for followed players, so this is undefined for
  // everyone else rather than triggering a lookup per card.
  itcRanking?: ItcRanking | null;
};

/**
 * A plain, read-only card for one player (singles/individual-event mode,
 * and each member of a TeamRoster) — the avatar circle and optional
 * Follow button around the shared PlayerCard template (shared/playerCard,
 * name+disposition/faction+ITC) used everywhere else a player is listed.
 * Same "no scoring or ranking" scope as TeamRoster — see the note in
 * types/player.d.ts.
 */
export default function PlayerCard({ player, onTrack, tracked, itcLeagueId, itcRanking }: PlayerCardProps) {
  return (
    <div
      className={`flex items-center gap-3 overflow-hidden rounded-lg border bg-surface-1 p-3 shadow-sm ${
        tracked ? "border-brass-500/50 ring-1 ring-brass-500/30" : "border-surface-border"
      }`}
    >
      <div
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-text-secondary"
      >
        {initials(player.name)}
      </div>
      <div className="min-w-0 flex-1">
        <SharedPlayerCard player={player} ranking={itcRanking} itcLeagueId={itcLeagueId} size="sm" />
      </div>
      {onTrack && (
        <button
          type="button"
          onClick={onTrack}
          title={tracked ? "Following this player's pairings" : "Follow this player's pairings"}
          className={`shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            tracked
              ? "border-brass-500/40 bg-brass-500/15 text-brass-600 dark:text-brass-400"
              : "border-surface-border text-text-secondary hover:bg-surface-2"
          }`}
        >
          {tracked ? "Following ✓" : "Follow"}
        </button>
      )}
    </div>
  );
}
