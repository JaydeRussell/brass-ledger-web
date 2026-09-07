"use client";
import type { ItcRanking } from "../../lib/bcp";
import ItcBadge from "../shared/itcBadge";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function Avatar({ name }: { name: string }) {
  return (
    <div
      aria-hidden
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
    >
      {initials(name)}
    </div>
  );
}

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
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-zinc-900 ${
        tracked
          ? "border-indigo-300 ring-1 ring-indigo-200 dark:border-indigo-800 dark:ring-indigo-900"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">{teamName}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {players.length} player{players.length === 1 ? "" : "s"}
          </p>
        </div>
        {onTrack && (
          <button
            type="button"
            onClick={onTrack}
            title={tracked ? "Following this team's pairings" : "Follow this team's pairings"}
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

      <div className="p-3">
        {players.length === 0 ? (
          <p className="p-3 text-sm text-zinc-500 dark:text-zinc-400">
            No players with a submitted list found for this team on BCP yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {players.map((player) => {
              const ranking = player.bcpUserId ? itcRankings?.[player.bcpUserId] : undefined;
              return (
              <li
                key={player.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 p-2.5 dark:border-zinc-800"
              >
                <Avatar name={player.name} />
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
                    {player.subFaction && ` — ${player.subFaction}`}
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
                <ItcBadge
                  ranking={ranking}
                  bcpUserId={player.bcpUserId}
                  leagueId={itcLeagueId}
                  title={`View ${player.name}'s full ITC history on BCP`}
                />
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
