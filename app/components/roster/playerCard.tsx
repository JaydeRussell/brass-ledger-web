"use client";
import type { ItcRanking } from "../../lib/bcp";
import { useOnVisible } from "../../lib/useOnVisible";
import SharedPlayerCard from "../shared/playerCard";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

type PlayerCardProps = {
  player: Player;
  // BCP's current flagship ITC ranking league id (see fetchCurrentItcLeagueId
  // in lib/bcp.ts) — used to build the profile link below.
  itcLeagueId?: string | null;
  // This player's already-published ITC score + rank, when known.
  itcRanking?: ItcRanking | null;
  // Called once when the card has been on screen briefly — page.tsx uses
  // it to look up this player's ITC ranking.
  onVisible?: () => void;
};

/**
 * A plain, read-only card for one player (singles/individual-event mode,
 * and each member of a TeamRoster) — the avatar circle around the shared
 * PlayerCard template (shared/playerCard,
 * name+disposition/faction+ITC) used everywhere else a player is listed.
 * Same "no scoring or ranking" scope as TeamRoster — see the note in
 * types/player.d.ts.
 */
export default function PlayerCard({
  player,
  itcLeagueId,
  itcRanking,
  onVisible,
}: PlayerCardProps) {
  const ref = useOnVisible<HTMLDivElement>(onVisible);
  return (
    <div
      ref={ref}
      className="flex items-center gap-3 overflow-hidden rounded-lg border border-surface-border bg-surface-1 p-3 shadow-sm"
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
    </div>
  );
}
