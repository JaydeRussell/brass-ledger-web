<!-- Source: Primary Missions Print Sheets PDF (see app/lib/missionSources.ts's `printSheets` entry) -->

# Primary Missions (Chapter Approved Mission Deck)

This is a **pointer, not a duplicate transcription**. Brass Ledger's own
codebase already hand-transcribes and tests this exact data, and is the
canonical source — re-copying it here would just create a second copy to
drift out of sync (the same reasoning behind this repo's
`app/lib/missionSources.ts`). If GW revises the mission pack, update the
code first; this file just orients a reader to where things live.

## What the print sheets actually are

A 3-page PDF export of the 25 Primary Mission cards' **front faces only**
(no reverse sides) — 25 named missions, five per Force Disposition, each
card showing:

- A colored header banner (color = which Disposition it belongs to) and a
  small disposition icon
- One row per battle-round range ("First Battle Round", "Any Battle
  Round", "Second Battle Round Onwards", "End of Battle", etc.) with a
  `WHEN` trigger, a plain-English scoring condition, and a VP value
- Occasional `CUMULATIVE` sub-conditions (small yellow banner: score both
  the base VP and a bonus if a stricter condition is also met) and `OR`
  branches between two alternative conditions
- A footer naming the mirror-matchup mission and, for a few cards, a
  reference like "(see reverse)" pointing at a special action defined on
  the card back — the physical card back text is **not** in this PDF
  export, which is the source of the known glossary gap below

## Where the real data lives in this codebase

| Concept | File |
|---|---|
| The 25 canonical mission names (5 per disposition) | `app/lib/missions.ts` |
| The 5×5 disposition → mission matrix (each side's mission is derived from *(own disposition, opponent's disposition)* — asymmetric, not a shared lookup) | `app/lib/missionMatrix.ts` |
| Full round-by-round VP scoring for all 25 missions | `app/lib/missionScoring.ts` |
| 15 hand-authored plain-language matchup write-ups (tactics, deployment-map references) | `app/lib/missionMatchups.ts` |
| Source-PDF version stamps (bump alongside data when GW revises the pack) | `app/lib/missionSources.ts` |
| 45 deployment-map images, `<disposition>-vs-<disposition>/{A,B,C}.webp` | `public/deployment-maps/` |
| The 5 Force Dispositions themselves | `app/lib/dispositions.ts` |

## Special action term definitions — resolved 2026-09-14

The 9 special-action terms cited by mission cards' scoring conditions
(Surveilled, Sensor sweep, Committed sabotage, Secured the asset,
Vanguard operation, Extracted intelligence, Triangulated, Trapped,
Decoyed) are never defined in this PDF's front-faces-only export — that
text lives only on the physical card backs. Neither the Event Companion
PDF has it either (confirmed empty search, see
`references/event-companion-part3.md`).

The definitions were eventually found via Wahapedia's fan transcription
of this same 2026-27 Chapter Approved Mission Deck
(`wahapedia.ru/wh40k11ed/the-rules/mission-deck-2026-27/`), cross-checked
against this PDF's own VP text for a match before trusting it. All 9 are
now in `app/lib/missionActionGlossary.ts`'s `SPECIAL_ACTION_DEFINITIONS`,
displayed in the mission-matchup panel's per-mission rules disclosure,
and sourced in `missionSources.ts`'s `wahapediaMissionDeck` entry. The
old `MISSING_GLOSSARY_TERMS` constant has been removed from
`missionMatchups.ts` — this is no longer a tracked gap.

## The 25 missions at a glance

| Disposition | Missions |
|---|---|
| Take and Hold | Battlefield Dominance, Immovable Object, Inescapable Dominion, Purge and Secure, Determined Acquisition |
| Purge the Foe | Unstoppable Force, Meatgrinder, Destroyer's Wrath, Consecrate, Punishment |
| Priority Assets | Secure Asset, Vital Link, Sabotage, Vanguard Operation, Extract Relic |
| Reconnaissance | Reconnaissance Sweep, Triangulation, Search and Scour, Gather Intel, Surveil the Foe |
| Disruption | Death Trap, Delaying Action, Locate and Deny, Smoke and Mirrors, Outmanoeuvre |

For any specific mission's exact wording, read `missionScoring.ts` (or
just ask — the mission-matchup panel in the app itself is the friendliest
way to see one rendered for a real pairing).
