// Full rule text for the "Objective Action" printed on the reverse side of
// the Primary Mission cards whose scoring conditions (missionScoring.ts)
// cite a special-action term — text that isn't in this project's own
// front-faces-only "Primary Missions Print Sheets" PDF (see
// missionSources.ts's `printSheets` entry). Transcribed from Wahapedia's
// posting of the same 2026-27 Chapter Approved Mission Deck (see
// missionSources.ts's `wahapediaMissionDeck` entry) and cross-checked
// against this project's own front-card VP text — the mission names, VP
// values and thresholds matched exactly, giving high confidence this is the
// same card set, not a different season's revision.
//
// Keyed by the exact lowercase term used in each mission's
// `MissionScoring.specialTerms` entry.
export const SPECIAL_ACTION_DEFINITIONS: Record<string, string> = {
  "secured the asset":
    "The Secure Asset objective action: starts in your Shooting phase, needs a friendly unit within range of one objective (excluding your home objective), and can only be started once per turn. It completes at the end of your turn if that unit still controls the objective.",
  "committed sabotage":
    "The Sabotage objective action: starts in your Shooting phase, needs a unit within range of one objective (excluding your home objective), and can be started an unlimited number of times per turn provided each unit that does so targets a different objective. It completes at the end of your turn if that unit still controls the objective.",
  "vanguard operation":
    "The Vanguard Operation objective action: starts in your Shooting phase, needs a friendly unit within a terrain area that is within your opponent's territory, and can only be started once per turn. It completes at the end of your turn if no enemy units are within that terrain area.",
  "sensor sweep":
    "The Sensor Sweep objective action: starts in your Shooting phase, needs a friendly unit within range of one central objective, and can only be started once per turn (and not at all while only one operation marker remains on the battlefield). It completes at the end of your turn if that unit still controls the objective, removing one operation marker from the battlefield.",
  triangulated:
    "The Triangulate objective action (available from the second battle round onwards): starts in your Shooting phase, needs a friendly unit within range of one objective (excluding your home objective), and can only be started once per turn. It completes at the end of your turn if that unit still controls the objective, placing one of your operation markers within range of it — that objective is then triangulated.",
  "extracted intelligence":
    "The Extract Intelligence objective action (available from the second battle round onwards): starts in your Shooting phase, needs a unit within range of one objective (excluding your home objective) that doesn't already have one of your operation markers within range of it, and can be started an unlimited number of times per turn provided each unit that does so targets a different objective. It completes at the end of your turn if that unit still controls the objective, placing one of your operation markers within range of it.",
  surveilled:
    "The Surveil the Foe objective action: starts in your Shooting phase, needs a friendly unit, and can be started an unlimited number of times. It completes immediately, letting you select one enemy unit within 18\" of and visible to that unit which hasn't already been surveilled this turn — that enemy unit is surveilled until the end of the turn.",
  trapped:
    "The Booby Trap objective action: starts in your Shooting phase, needs a friendly unit within range of one objective (excluding your home objective) or within a terrain area outside your deployment zone that isn't already trapped, and can be started an unlimited number of times per turn provided each unit that does so targets a different terrain area. It completes immediately, placing one of your operation markers within that terrain area — that terrain area is then trapped.",
  decoyed:
    "The Decoy objective action: starts in your Shooting phase, needs a friendly unit within range of one objective (excluding your home objective) that isn't already decoyed, and can be started an unlimited number of times per turn provided each unit that does so targets a different objective. It completes at the end of your turn if that unit still controls the objective, placing one of your operation markers within range of it — that objective is then decoyed.",
};
