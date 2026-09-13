import type { Disposition } from "./dispositions";
import type { MissionId } from "./missions";

// The Warhammer Event Companion's Force Disposition matchup table (see
// missionSources.ts's `eventCompanion` entry for the version) — a player's
// own Primary Mission is determined entirely by (their own disposition,
// their opponent's disposition). Missions are asymmetric: e.g. Take and
// Hold vs. Purge the Foe gives the Take-and-Hold player "Immovable Object"
// and the Purge-the-Foe player "Unstoppable Force" — two different
// missions from the same pairing, not one shared mission. A mirror
// matchup (both rows equal) is the one case where both sides land on the
// same mission.
//
// `Record<Disposition, Record<Disposition, MissionId>>` (a full 25-entry
// nested lookup, not just the 15 unordered pairings) so `getPrimaryMission`
// is a plain object index with no runtime search, and so TypeScript
// requires every one of the 25 combinations to be present — a missing
// entry from hand-transcribing this is a compile error, not a silent gap.
export const MISSION_MATRIX: Record<Disposition, Record<Disposition, MissionId>> = {
  "Take and Hold": {
    "Take and Hold": "Battlefield Dominance",
    "Purge the Foe": "Immovable Object",
    "Priority Assets": "Inescapable Dominion",
    Reconnaissance: "Purge and Secure",
    Disruption: "Determined Acquisition",
  },
  "Purge the Foe": {
    "Take and Hold": "Unstoppable Force",
    "Purge the Foe": "Meatgrinder",
    "Priority Assets": "Destroyer's Wrath",
    Reconnaissance: "Consecrate",
    Disruption: "Punishment",
  },
  "Priority Assets": {
    "Take and Hold": "Secure Asset",
    "Purge the Foe": "Vital Link",
    "Priority Assets": "Sabotage",
    Reconnaissance: "Vanguard Operation",
    Disruption: "Extract Relic",
  },
  Reconnaissance: {
    "Take and Hold": "Reconnaissance Sweep",
    "Purge the Foe": "Triangulation",
    "Priority Assets": "Search and Scour",
    Reconnaissance: "Gather Intel",
    Disruption: "Surveil the Foe",
  },
  Disruption: {
    "Take and Hold": "Death Trap",
    "Purge the Foe": "Delaying Action",
    "Priority Assets": "Locate and Deny",
    Reconnaissance: "Smoke and Mirrors",
    Disruption: "Outmanoeuvre",
  },
};

export function getPrimaryMission(mine: Disposition, opponent: Disposition): MissionId {
  return MISSION_MATRIX[mine][opponent];
}
