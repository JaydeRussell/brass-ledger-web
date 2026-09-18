"use client";
import { useState } from "react";
import type { ItcRanking } from "../../lib/bcp";
import PlayerCard from "./playerCard";
import Card from "../ui/card";

/** One side's "type to filter, click to pick" player list — same shape
 * as teamCompare.tsx's own TeamPicker, just over this event's already-
 * fetched player list instead of team names. */
function PlayerPicker({
  label,
  players,
  onPick,
}: {
  label: string;
  players: Player[];
  onPick: (player: Player) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = players.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Card className="flex flex-col border-dashed p-3">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find a player…"
        className="mt-2 w-full rounded-md border border-surface-border bg-surface-0 px-2 py-1.5 text-sm text-text-primary outline-none focus:border-brass-500"
      />
      {filtered.length === 0 ? (
        <p className="mt-2 text-xs text-text-secondary">No players match.</p>
      ) : (
        <ul className="mt-2 max-h-64 overflow-y-auto">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p)}
                className="block w-full truncate rounded-md px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-2"
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

type PlayerCompareProps = {
  players: Player[];
  itcLeagueId?: string | null;
  itcRankings?: Record<string, ItcRanking | null>;
  selectedA: string | null;
  selectedB: string | null;
  onSelectA: (playerId: string | null) => void;
  onSelectB: (playerId: string | null) => void;
};

/**
 * Side-by-side view of two players' already-published roster entries
 * (faction, disposition, list), picked from the singles event currently
 * open — the singles-event counterpart to TeamCompare (teamCompare.tsx),
 * same "pure juxtaposition, no score, no computed comparison" scope (see
 * that component's own doc comment and types/player.d.ts's note on why
 * this app never ranks a matchup).
 */
export default function PlayerCompare({
  players,
  itcLeagueId,
  itcRankings,
  selectedA,
  selectedB,
  onSelectA,
  onSelectB,
}: PlayerCompareProps) {
  const findPlayer = (id: string | null) => players.find((p) => String(p.id) === id);
  const selectedPlayerA = findPlayer(selectedA);
  const selectedPlayerB = findPlayer(selectedB);

  // A plain helper, not a separate component — same reasoning as
  // teamCompare.tsx's own inline `slot` (see its comment on interaction
  // tests).
  const slot = (
    label: string,
    selected: Player | undefined,
    otherId: string | null,
    onChange: (playerId: string | null) => void
  ) => {
    if (!selected) {
      return (
        <PlayerPicker
          label={label}
          players={players.filter((p) => String(p.id) !== otherId)}
          onPick={(p) => onChange(String(p.id))}
        />
      );
    }
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className="self-start text-xs font-medium text-text-secondary hover:underline"
        >
          ← Change player
        </button>
        <PlayerCard
          player={selected}
          itcLeagueId={itcLeagueId}
          itcRanking={selected.bcpUserId ? itcRankings?.[selected.bcpUserId] : undefined}
        />
      </div>
    );
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {slot("Player A", selectedPlayerA, selectedB, onSelectA)}
      {slot("Player B", selectedPlayerB, selectedA, onSelectB)}
    </div>
  );
}
