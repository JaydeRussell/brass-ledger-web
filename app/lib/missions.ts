// The 25 official Primary Mission names from the "Warhammer Event
// Companion" mission pack (see missionSources.ts's `eventCompanion` entry
// for the version this was transcribed from) — five per Force Disposition.
// Declared as a single `as const` list so missionMatrix.ts and
// missionScoring.ts are both compile-time-checked against the exact same
// set of names, rather than each hand-typing its own copy of ~25 strings.
export const MISSION_NAMES = [
  // Take and Hold
  "Battlefield Dominance",
  "Immovable Object",
  "Inescapable Dominion",
  "Purge and Secure",
  "Determined Acquisition",
  // Purge the Foe
  "Unstoppable Force",
  "Meatgrinder",
  "Destroyer's Wrath",
  "Consecrate",
  "Punishment",
  // Priority Assets
  "Secure Asset",
  "Vital Link",
  "Sabotage",
  "Vanguard Operation",
  "Extract Relic",
  // Reconnaissance
  "Reconnaissance Sweep",
  "Triangulation",
  "Search and Scour",
  "Gather Intel",
  "Surveil the Foe",
  // Disruption
  "Death Trap",
  "Delaying Action",
  "Locate and Deny",
  "Smoke and Mirrors",
  "Outmanoeuvre",
] as const;

export type MissionId = (typeof MISSION_NAMES)[number];
