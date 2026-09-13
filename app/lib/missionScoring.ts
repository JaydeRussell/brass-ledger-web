import type { MissionId } from "./missions";
import { MISSION_NAMES } from "./missions";

export type ScoringCondition = {
  text: string;
  vp: number;
  // Stacks on top of the condition immediately above it in the same band,
  // rather than being an alternative way to score the band's own VP.
  cumulative?: boolean;
};

export type ScoringBand = {
  // e.g. "Any Battle Round", "Second Battle Round Onwards", "End of Battle".
  when: string;
  conditions: ScoringCondition[];
};

export type MissionScoring = {
  // Inline special-rule/setup text printed on the mission card itself
  // (e.g. Consecrate's "consecration unit" rule, Locate and Deny's
  // Start-of-Battle operation-marker placement) — present only when the
  // card has one.
  setup?: string;
  bands: ScoringBand[];
  // Names of MISSING_GLOSSARY_TERMS entries this mission's conditions
  // reference (e.g. "sensor sweep") whose exact rule text lives on the
  // physical card's reverse side, not in the front-faces-only PDF this
  // was transcribed from. See missionMatchups.ts's MISSING_GLOSSARY_TERMS.
  // TODO(mission-glossary): remove this field once those terms are defined.
  specialTerms?: string[];
};

// Transcribed from the "Primary Missions Print Sheets" (see
// missionSources.ts's `printSheets` entry) — every mission's VP-scoring
// numbers and thresholds are from the card fronts and are complete; a few
// conditions cite a special action (see each entry's `specialTerms`) whose
// full rule text is on the card backs, not yet transcribed (see the
// TODO(mission-glossary) list in missionMatchups.ts).
export const MISSION_SCORING: Record<MissionId, MissionScoring> = {
  // ---- Take and Hold ----
  "Battlefield Dominance": {
    bands: [
      {
        when: "First & Second Battle Round — end of your turn",
        conditions: [{ text: "You control more objectives than your opponent.", vp: 2 }],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "For each objective you control.", vp: 3 },
          {
            text: "For each of those objectives (excluding your home objective), if you also control your home objective.",
            vp: 2,
            cumulative: true,
          },
        ],
      },
    ],
  },
  "Immovable Object": {
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [{ text: "You control one or more central objectives.", vp: 3 }],
      },
      {
        when: "Second to Fourth Battle Round — end of your Command phase",
        conditions: [
          { text: "For each objective you control (excluding your home objective).", vp: 5 },
        ],
      },
      {
        when: "Fifth Battle Round — end of your turn",
        conditions: [
          { text: "For each objective you control (excluding your home objective).", vp: 5 },
        ],
      },
    ],
  },
  "Inescapable Dominion": {
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [{ text: "You control three or more objectives.", vp: 4 }],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control two or more objectives.", vp: 5 },
          { text: "You control more objectives than your opponent.", vp: 4 },
        ],
      },
      {
        when: "End of Battle",
        conditions: [{ text: "You control your opponent's home objective.", vp: 5 }],
      },
    ],
  },
  "Purge and Secure": {
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [
          {
            text: "One or more enemy units that started the turn within range of one or more objectives were destroyed this turn.",
            vp: 3,
          },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "For each objective you control (excluding your home objective).", vp: 4 },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your turn",
        conditions: [
          {
            text: "You control one or more objectives you did not control at the start of the turn (excluding your home objective).",
            vp: 3,
          },
        ],
      },
    ],
  },
  "Determined Acquisition": {
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [
          {
            text: "For each objective you did not control at the start of the turn (excluding your home objective).",
            vp: 2,
          },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "For each objective you control.", vp: 3 },
          {
            text: "For each of those objectives that is within your opponent's territory.",
            vp: 3,
            cumulative: true,
          },
        ],
      },
    ],
  },

  // ---- Purge the Foe ----
  "Unstoppable Force": {
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [{ text: "One or more enemy units were destroyed this turn.", vp: 3 }],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "For each objective you control (excluding your home objective).", vp: 4 },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your turn",
        conditions: [
          {
            text: "You control one or more objectives you did not control at the start of the turn (excluding your home objective).",
            vp: 3,
          },
        ],
      },
      {
        when: "End of Battle",
        conditions: [{ text: "You control one or more central objectives.", vp: 5 }],
      },
    ],
  },
  Meatgrinder: {
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [{ text: "One or more enemy units were destroyed this turn.", vp: 3 }],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "For each objective you control (excluding your home objective).", vp: 4 },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your turn",
        conditions: [
          {
            text: "More enemy units were destroyed this turn than were destroyed in the previous turn.",
            vp: 5,
          },
        ],
      },
      {
        when: "End of Battle",
        conditions: [{ text: "You control your opponent's home objective.", vp: 5 }],
      },
    ],
  },
  "Destroyer's Wrath": {
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [{ text: "One or more enemy units were destroyed this turn.", vp: 3 }],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 4 },
          { text: "You control more objectives than your opponent.", vp: 6 },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your turn",
        conditions: [
          {
            text: "More enemy units were destroyed this turn than friendly units were destroyed in the previous turn.",
            vp: 4,
          },
        ],
      },
    ],
  },
  Consecrate: {
    setup:
      "Consecrate: when a friendly unit destroys an enemy unit, it becomes a consecration unit. At the end of your turn, each consecration unit within range of an objective (excluding your home objective) consecrates it, and stops being a consecration unit.",
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [
          { text: "One or two objectives are consecrated.", vp: 3 },
          { text: "Three or more objectives are consecrated.", vp: 6 },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 4 },
          { text: "You control more objectives than your opponent.", vp: 4 },
        ],
      },
      {
        when: "End of Battle",
        conditions: [{ text: "Your opponent's home objective has been consecrated.", vp: 5 }],
      },
    ],
  },
  Punishment: {
    setup:
      "Start of your turn: choose one to three enemy units on the battlefield within range of an objective and/or that destroyed a friendly unit last turn (any one enemy unit if none qualify). Those units are condemned until the start of your next turn.",
    bands: [
      {
        when: "Any Battle Round — end of a turn",
        conditions: [
          { text: "One or more condemned enemy units left the battlefield this turn.", vp: 5 },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 4 },
          { text: "You control more objectives than your opponent.", vp: 5 },
        ],
      },
      {
        when: "End of Battle",
        conditions: [{ text: "You control your opponent's home objective.", vp: 8 }],
      },
    ],
  },

  // ---- Priority Assets ----
  "Secure Asset": {
    specialTerms: ["secured the asset"],
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [
          {
            text: "A friendly unit secured the asset this turn (see your mission card's reverse side).",
            vp: 4,
          },
          {
            text: "One or more enemy units that started the turn within range of one or more central objectives are destroyed.",
            vp: 2,
          },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 4 },
          { text: "You control three or more objectives.", vp: 4 },
        ],
      },
    ],
  },
  "Vital Link": {
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [
          { text: "You control one or more central objectives.", vp: 2 },
          {
            text: "For each of your operation markers within range of one of those objectives.",
            vp: 1,
            cumulative: true,
          },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 4 },
          { text: "One or more of those objectives is a central objective.", vp: 4, cumulative: true },
        ],
      },
      {
        when: "End of Battle",
        conditions: [{ text: "You control your opponent's home objective.", vp: 10 }],
      },
    ],
  },
  Sabotage: {
    specialTerms: ["committed sabotage"],
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [
          {
            text: "For each friendly unit that committed sabotage this turn (see your mission card's reverse side).",
            vp: 3,
          },
          {
            text: "For each of those units that is within range of one or more objectives in your opponent's territory.",
            vp: 2,
            cumulative: true,
          },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 4 },
        ],
      },
    ],
  },
  "Vanguard Operation": {
    specialTerms: ["vanguard operation"],
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [
          {
            text: "A friendly unit performed a vanguard operation this turn (see your mission card's reverse side).",
            vp: 4,
          },
          { text: "One or more enemy units were destroyed this turn.", vp: 2 },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 4 },
        ],
      },
      {
        when: "End of Battle",
        conditions: [{ text: "You control your opponent's home objective.", vp: 10 }],
      },
    ],
  },
  "Extract Relic": {
    specialTerms: ["sensor sweep"],
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [
          {
            text: "A friendly unit performed a sensor sweep this turn (see your mission card's reverse side).",
            vp: 4,
          },
          {
            text: "One or more enemy units that started the turn within range of one or more objectives are destroyed.",
            vp: 3,
          },
          {
            text: "Only one of your opponent's operation markers is on the battlefield, a unit of yours is in that terrain area, and no enemy units are there.",
            vp: 4,
          },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 4 },
        ],
      },
      {
        when: "End of Battle",
        conditions: [
          {
            text: "Only one of your opponent's operation markers is on the battlefield, a unit of yours is in that terrain area, and no enemy units are there.",
            vp: 5,
          },
        ],
      },
    ],
  },

  // ---- Reconnaissance ----
  "Reconnaissance Sweep": {
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [
          {
            text: "Three or more friendly units are wholly within three different table quarters of the centre of the battlefield.",
            vp: 3,
          },
          {
            text: "Four or more friendly units are wholly within four different table quarters of the centre of the battlefield.",
            vp: 6,
          },
        ],
      },
      {
        when: "Any Battle Round — end of your turn",
        conditions: [{ text: "For each enemy unit destroyed this turn.", vp: 1 }],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 3 },
        ],
      },
    ],
  },
  Triangulation: {
    specialTerms: ["triangulated"],
    bands: [
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 4 },
          {
            text: "One objective is triangulated (see your mission card's reverse side).",
            vp: 3,
          },
          { text: "Two objectives are triangulated.", vp: 6 },
          { text: "Three or more objectives are triangulated.", vp: 10 },
        ],
      },
      {
        when: "End of Battle",
        conditions: [{ text: "You control four or more objectives.", vp: 10 }],
      },
    ],
  },
  "Search and Scour": {
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [
          { text: "You control one or more central objectives.", vp: 3 },
          {
            text: "One or more enemy units that started the turn within a terrain area are destroyed.",
            vp: 2,
          },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "For each objective you control (excluding your home objective).", vp: 4 },
        ],
      },
      {
        when: "End of Battle",
        conditions: [{ text: "No enemy units are wholly within your territory.", vp: 5 }],
      },
    ],
  },
  "Gather Intel": {
    specialTerms: ["extracted intelligence"],
    bands: [
      {
        when: "First Battle Round — end of your turn",
        conditions: [{ text: "You control one or more central objectives.", vp: 6 }],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 4 },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your turn",
        conditions: [
          {
            text: "For each friendly unit that extracted intelligence this turn (see your mission card's reverse side).",
            vp: 7,
          },
        ],
      },
      {
        when: "End of Battle",
        conditions: [
          { text: "Three or more of your operation markers are on the battlefield.", vp: 5 },
          {
            text: "One of your operation markers is within range of your opponent's home objective.",
            vp: 5,
          },
        ],
      },
    ],
  },
  "Surveil the Foe": {
    specialTerms: ["surveilled"],
    setup:
      "Each time a friendly unit ends a move within range of an objective that has enemy operation markers on it, remove those markers from the battlefield.",
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [
          {
            text: "One or more enemy units were surveilled this turn (see your mission card's reverse side), unless each of those units is within range of an objective with one or more operation markers within range of it.",
            vp: 4,
          },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 4 },
          { text: "You control more objectives than your opponent.", vp: 4 },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your turn",
        conditions: [{ text: "No enemy operation markers are on the battlefield.", vp: 5 }],
      },
    ],
  },

  // ---- Disruption ----
  "Death Trap": {
    specialTerms: ["trapped"],
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [
          {
            text: "For each terrain area trapped this turn (see your mission card's reverse side).",
            vp: 2,
          },
          { text: "For each of those terrain areas that is an objective.", vp: 3, cumulative: true },
        ],
      },
      {
        when: "Any Battle Round — end of your turn",
        conditions: [
          {
            text: "One or more enemy units that started the turn within a trapped terrain area were destroyed.",
            vp: 3,
          },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 4 },
        ],
      },
    ],
  },
  "Delaying Action": {
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [{ text: "For each enemy unit destroyed this turn.", vp: 2 }],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 4 },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your turn",
        conditions: [
          {
            text: "You control one or more central objectives and one or more expansion objectives.",
            vp: 3,
          },
        ],
      },
    ],
  },
  "Locate and Deny": {
    setup:
      "Start of the battle: select five terrain areas outside your deployment zone and place one of your operation markers in each (as many as possible if five isn't achievable).",
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [
          {
            text: "One or more enemy units that started the turn within range of one or more objectives are destroyed.",
            vp: 4,
          },
          {
            text: "Only one of your operation markers remains (see your mission card's reverse side), with a unit of yours in that terrain area and no enemy units there.",
            vp: 4,
          },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 4 },
        ],
      },
      {
        when: "End of Battle",
        conditions: [
          {
            text: "Only one of your operation markers remains, with a unit of yours in that terrain area and no enemy units there.",
            vp: 5,
          },
        ],
      },
    ],
  },
  "Smoke and Mirrors": {
    specialTerms: ["decoyed"],
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [
          {
            text: "For each objective that is decoyed (see your mission card's reverse side).",
            vp: 2,
          },
          {
            text: "For each of those objectives that is within your opponent's territory.",
            vp: 2,
            cumulative: true,
          },
        ],
      },
      {
        when: "Second Battle Round onwards — end of your Command phase (or end of turn in the fifth battle round)",
        conditions: [
          { text: "You control one or more objectives (excluding your home objective).", vp: 4 },
        ],
      },
      {
        when: "End of Battle",
        conditions: [{ text: "Four or more objectives are decoyed.", vp: 10 }],
      },
    ],
  },
  Outmanoeuvre: {
    bands: [
      {
        when: "Any Battle Round — end of your turn",
        conditions: [{ text: "You control the enemy home objective.", vp: 10 }],
      },
      {
        when: "First Battle Round — end of your turn",
        conditions: [
          { text: "For each objective you control (excluding your home objective).", vp: 4 },
        ],
      },
      {
        when: "Second & Third Battle Round — end of your Command phase",
        conditions: [
          { text: "For each objective you control (excluding your home objective).", vp: 5 },
        ],
      },
      {
        when: "Fourth Battle Round onwards — end of your turn",
        conditions: [
          { text: "For each objective you control (excluding your home objective).", vp: 6 },
        ],
      },
    ],
  },
};

// Sanity: every declared mission name has a scoring entry (also enforced
// at compile time by the Record<MissionId, ...> type above — this export
// exists purely so missionScoring.test.ts can assert it without importing
// TypeScript's type-checking into a runtime test).
export const ALL_MISSION_IDS = MISSION_NAMES;
