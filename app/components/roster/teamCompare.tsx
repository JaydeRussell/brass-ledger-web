"use client";
import { useState } from "react";
import type { ItcRanking } from "../../lib/bcp";
import TeamRoster from "./roster";
import Card from "../ui/card";

/** One side's "type to filter, click to pick" team list — the same
 * search-then-click shape as bcpProfileLinker.tsx's RosterPicker, just
 * over team names already in memory instead of a freshly-fetched roster. */
function TeamPicker({
  label,
  teamNames,
  onPick,
}: {
  label: string;
  teamNames: string[];
  onPick: (team: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = teamNames.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Card className="flex flex-col border-dashed p-3">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find a team…"
        className="mt-2 w-full rounded-md border border-surface-border bg-surface-0 px-2 py-1.5 text-sm text-text-primary outline-none focus:border-brass-500"
      />
      {filtered.length === 0 ? (
        <p className="mt-2 text-xs text-text-secondary">No teams match.</p>
      ) : (
        <ul className="mt-2 max-h-64 overflow-y-auto">
          {filtered.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => onPick(name)}
                className="block w-full truncate rounded-md px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-2"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

type TeamCompareProps = {
  teamNames: string[];
  teams: Map<string, Player[]>;
  itcLeagueId?: string | null;
  itcRankings?: Record<string, ItcRanking | null>;
  selectedA: string | null;
  selectedB: string | null;
  onSelectA: (team: string | null) => void;
  onSelectB: (team: string | null) => void;
};

/**
 * Side-by-side view of two teams' already-published rosters, picked from
 * the event currently open — pure juxtaposition of data the Roster tab
 * already fetches and renders one team at a time. Deliberately shows
 * nothing about who's favored or how a matchup might go: no score, no
 * computed comparison, just two rosters next to each other. See
 * page.tsx's scope note and types/player.d.ts for why this app never
 * computes or ranks a matchup.
 */
export default function TeamCompare({
  teamNames,
  teams,
  itcLeagueId,
  itcRankings,
  selectedA,
  selectedB,
  onSelectA,
  onSelectB,
}: TeamCompareProps) {
  // A plain helper, not a separate component — called inline so its
  // buttons live directly in this component's own returned tree (see
  // teamCompare.test.ts's note on why that matters for interaction tests).
  const slot = (
    label: string,
    selected: string | null,
    otherSelected: string | null,
    onChange: (team: string | null) => void
  ) => {
    if (!selected) {
      return (
        <TeamPicker
          label={label}
          teamNames={teamNames.filter((name) => name !== otherSelected)}
          onPick={onChange}
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
          ← Change team
        </button>
        <TeamRoster
          teamName={selected}
          players={teams.get(selected) ?? []}
          itcLeagueId={itcLeagueId}
          itcRankings={itcRankings}
        />
      </div>
    );
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {slot("Team A", selectedA, selectedB, onSelectA)}
      {slot("Team B", selectedB, selectedA, onSelectB)}
    </div>
  );
}
