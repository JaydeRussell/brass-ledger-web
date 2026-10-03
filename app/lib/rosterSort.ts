export type RosterSortKey = "name" | "faction" | "club" | "disposition";

export const ROSTER_SORT_OPTIONS: { key: RosterSortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "faction", label: "Faction" },
  { key: "club", label: "Club / team" },
  { key: "disposition", label: "Disposition" },
];

export function isRosterSortKey(value: string | null): value is RosterSortKey {
  return ROSTER_SORT_OPTIONS.some((o) => o.key === value);
}

const FIELD: Record<RosterSortKey, (p: Player) => string | undefined> = {
  name: (p) => p.name,
  faction: (p) => (p.faction && p.faction !== "Unknown" ? p.faction : undefined),
  club: (p) => p.homeClub,
  disposition: (p) => p.disposition,
};

/**
 * Sorts players A–Z by the chosen field, players without a value for it
 * last, and ties broken by name. Returns a new array.
 */
export function sortPlayers(players: readonly Player[], key: RosterSortKey): Player[] {
  const field = FIELD[key];
  return [...players].sort((a, b) => {
    const av = field(a)?.trim();
    const bv = field(b)?.trim();
    if (av && !bv) return -1;
    if (!av && bv) return 1;
    const byField = av && bv ? av.localeCompare(bv, undefined, { sensitivity: "base" }) : 0;
    return byField || a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
