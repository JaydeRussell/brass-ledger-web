// The three Games Workshop documents the "Your round" mission-matchup
// feature's static content (missionMatrix.ts, missionScoring.ts,
// missionMatchups.ts, the deployment-map images) is transcribed from. GW
// updates these periodically with no notification mechanism this app can
// watch — when a new mission pack or errata lands, re-check each doc
// against its `asOf` here and bump it (and the affected data modules and
// scripts/crop-deployment-maps.sh) together. Pattern lifted from
// changelog.ts's own "dated, hand-authored static content" convention.
export type MissionSource = {
  name: string;
  // GW's own version string, when they publish one for this doc.
  version?: string;
  // YYYY-MM-DD this app's copy is confirmed current as of.
  asOf: string;
  // Why `version` is missing, or any other caveat worth surfacing.
  note?: string;
};

export const MISSION_SOURCES = {
  eventCompanion: {
    name: "Warhammer Event Companion",
    version: "v1.2",
    asOf: "2026-08-09",
    note: "Self-versioned by GW (with its own in-document changelog) — the disposition matrix and all 45 deployment-map layouts come from here.",
  },
  printSheets: {
    name: "Primary Missions Print Sheets",
    asOf: "2026-07-07",
    note: "No GW-published version for this print export — asOf is this PDF's own generation timestamp. Every mission's VP scoring comes from here; a handful of conditions cite a special action whose exact definition is on the physical card's reverse side, not in this front-faces export (see missionMatchups.ts's MISSING_GLOSSARY_TERMS).",
  },
  coreRules: {
    name: "Warhammer 40,000 Core Rules",
    asOf: "2026-06-01",
    note: "No in-document edition or version string at all — asOf is this PDF file's own metadata date. Used only as background (battle round/phase structure) when writing matchup tactics, not as a data source.",
  },
} satisfies Record<string, MissionSource>;
