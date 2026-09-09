"use client";
import type { ItcRanking } from "../../lib/bcp";
import DispositionBadge from "../shared/dispositionBadge";
import ItcBadge from "../shared/itcBadge";

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
 * A plain, read-only card for one player (singles/individual-event mode).
 * Same "no scoring or ranking" scope as TeamRoster — see the note in
 * types/player.d.ts.
 */
export default function PlayerCard({
  player,
  onTrack,
  tracked,
  itcLeagueId,
  itcRanking,
}: PlayerCardProps) {
  return (
    <div
      className={`flex items-center gap-3 overflow-hidden rounded-2xl border bg-white p-3 shadow-sm dark:bg-zinc-900 ${
        tracked
          ? "border-indigo-300 ring-1 ring-indigo-200 dark:border-indigo-800 dark:ring-indigo-900"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
      >
        {initials(player.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
          {player.name}
          {player.homeClub && (
            <span className="ml-1.5 font-normal text-zinc-400 dark:text-zinc-500">
              ({player.homeClub})
            </span>
          )}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {player.faction}
          {/* When subFaction holds a Force Disposition value (see
              types/player.d.ts), it's shown as the badge below instead —
              repeating it here as "faction — Purge the Foe" would
              mislabel a disposition as a sub-faction. */}
          {player.subFaction && player.subFaction !== player.disposition && ` — ${player.subFaction}`}
        </p>
      </div>
      {player.list && (
        <a
          href={player.list}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          list
        </a>
      )}
      <DispositionBadge disposition={player.disposition} />
      <ItcBadge
        ranking={itcRanking}
        bcpUserId={player.bcpUserId}
        leagueId={itcLeagueId}
        title={`View ${player.name}'s full ITC history on BCP`}
      />
      {onTrack && (
        <button
          type="button"
          onClick={onTrack}
          title={tracked ? "Following this player's pairings" : "Follow this player's pairings"}
          className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            tracked
              ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
              : "border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          {tracked ? "Following ✓" : "Follow"}
        </button>
      )}
    </div>
  );
}
