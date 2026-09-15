// Maps BCP's own per-event `faction` string (see PlacingEntry in bcp.ts)
// to one of Warhammer 40k's three top-level alignments — the grouping
// GW's own product line already uses, not something this app invented.
// Canonical faction names come from the warhammer-40k skill's Base Size
// Guide (event-companion-part2.md/part3.md), which lists all 29 factions
// this mission system recognizes.
//
// BCP's real-world strings don't always match that canonical list
// exactly — confirmed against a real event on 2026-09-14: it reported
// "Space Marines (Astartes)" (a parenthetical suffix) and "Genestealer
// Cult" (singular, not the canonical "Genestealer Cults"), and an
// existing test fixture elsewhere in this app uses bare "Tau" rather
// than "T'au Empire". normalizeFaction below strips the parenthetical
// pattern generically and FACTION_ALIASES below patches the specific
// known spelling variants — deliberately a small, patchable list rather
// than fuzzy matching, so a genuinely-unrecognized faction stays
// unclassified instead of being guessed at (same posture as
// Player.disposition's exact-match-only rule in types/player.d.ts).

export type SuperFaction = "Imperium" | "Chaos" | "Xenos";

const SUPER_FACTION_BY_FACTION: Readonly<Record<string, SuperFaction>> = {
  // Imperium
  "adepta sororitas": "Imperium",
  "adeptus custodes": "Imperium",
  "adeptus mechanicus": "Imperium",
  "adeptus titanicus": "Imperium",
  "astra militarum": "Imperium",
  "black templars": "Imperium",
  "blood angels": "Imperium",
  "dark angels": "Imperium",
  deathwatch: "Imperium",
  "grey knights": "Imperium",
  "imperial agents": "Imperium",
  "imperial knights": "Imperium",
  "space marines": "Imperium",
  "space wolves": "Imperium",
  // Chaos
  "chaos daemons": "Chaos",
  "chaos knights": "Chaos",
  "chaos space marines": "Chaos",
  "death guard": "Chaos",
  "emperor's children": "Chaos",
  "thousand sons": "Chaos",
  "world eaters": "Chaos",
  // Xenos
  aeldari: "Xenos",
  drukhari: "Xenos",
  "genestealer cults": "Xenos",
  "leagues of votann": "Xenos",
  necrons: "Xenos",
  orks: "Xenos",
  "t'au empire": "Xenos",
  tyranids: "Xenos",
};

// Known real-world spelling variants BCP has been observed (or is
// fixture-tested elsewhere in this app) to use instead of the canonical
// name above — see this file's doc comment.
const FACTION_ALIASES: Readonly<Record<string, string>> = {
  tau: "t'au empire",
  "tau empire": "t'au empire",
  "genestealer cult": "genestealer cults",
};

function normalizeFaction(faction: string): string {
  const stripped = faction
    .replace(/\s*\([^)]*\)\s*$/, "") // trailing parenthetical, e.g. "Space Marines (Astartes)"
    .trim()
    .toLowerCase();
  return FACTION_ALIASES[stripped] ?? stripped;
}

/**
 * BCP's own faction string → one of the three super factions, or
 * undefined if this app doesn't recognize it. An unrecognized faction is
 * left unclassified rather than guessed at.
 */
export function superFactionOf(faction: string | undefined): SuperFaction | undefined {
  if (!faction) return undefined;
  return SUPER_FACTION_BY_FACTION[normalizeFaction(faction)];
}
