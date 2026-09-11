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
  const hasBadgeRow = Boolean(player.disposition) || Boolean(itcRanking);

  return (
    <div
      className={`flex flex-col gap-2 overflow-hidden rounded-lg border bg-surface-1 p-3 shadow-sm ${
        tracked ? "border-brass-500/50 ring-1 ring-brass-500/30" : "border-surface-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-text-secondary"
        >
          {initials(player.name)}
        </div>
        <div className="min-w-36 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">
            {player.name}
            {player.homeClub && <span className="ml-1.5 font-normal text-text-tertiary">({player.homeClub})</span>}
          </p>
          <p className="truncate text-xs text-text-secondary">
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
            className="shrink-0 text-xs font-medium text-brass-600 hover:underline dark:text-brass-400"
          >
            list
          </a>
        )}
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
      {/* Disposition + ITC on their own row, indented to align under the
          name/faction text (avatar width + gap) rather than crowding the
          name row on narrow screens. */}
      {hasBadgeRow && (
        <div className="flex flex-wrap items-center gap-2 pl-[52px]">
          <DispositionBadge disposition={player.disposition} />
          <ItcBadge
            ranking={itcRanking}
            bcpUserId={player.bcpUserId}
            leagueId={itcLeagueId}
            title={`View ${player.name}'s full ITC history on BCP`}
          />
        </div>
      )}
    </div>
  );
}
