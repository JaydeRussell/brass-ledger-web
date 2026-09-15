---
name: warhammer-40k
description: Reference knowledge for Warhammer 40,000 11th-edition tabletop rules and the Warhammer Event/tournament format (mission sequence, Force Dispositions, Primary/Secondary Missions, terrain layouts, base sizes) — transcribed from GW's Core Rules, Event Companion, and Primary Missions Print Sheets PDFs, plus a fan cross-check that fills a known gap in this project's own mission data. Use this whenever a task touches 40k rules knowledge itself (answering a rules question, building or fact-checking the planned in-app Warhammer wiki, writing new mission/matchup content) — not for BCP data-plumbing work, which lives in app/lib/bcp.ts and friends.
---

# Warhammer 40,000 rules knowledge

This is a knowledge base, not a workflow — there's no procedure to
follow, just reference material to load as needed. It exists to support
Brass Ledger's planned in-app "Warhammer wiki" feature, and more
generally to make any Claude Code session in this repo actually
knowledgeable about 40k rules instead of guessing from training data
(which may predate the current edition or mission pack).

**Load reference files on demand, not all at once** — they're
substantial (the whole set is ~250KB of markdown). Pull in only the
file(s) relevant to the question at hand.

## Source documents

| Source | What it is | Version/date used |
|---|---|---|
| Warhammer 40,000 Core Rules (PDF, 88pp) | The full core rulebook — how the game itself is played | No in-document version string; PDF dated 2026-06-01 |
| Warhammer Event Companion (PDF, 93pp) | GW's tournament-format supplement: event mission sequence, the Chapter Approved Mission Deck's errata/FAQs, pairings/rankings guidance, terrain layouts, unit base sizes | v1.2, asOf 2026-08-09 |
| Primary Missions Print Sheets (PDF, 3pp) | The 25 Primary Mission cards' front faces only (no reverse sides) | asOf 2026-07-07 |
| Wahapedia's Mission Deck 2026-27 page (fan transcription, web) | Used only to fill one specific gap: the reverse-side "Objective Action" rule text for 9 special-action terms the print sheets don't include | Checked 2026-09-14 |

These are the exact same source documents (and, for the first three, the
exact same dates/versions) that `app/lib/missionSources.ts` already
tracks for this project's own hand-authored mission-matchup feature —
see that file for the canonical, up-to-date version stamps if this
skill's copy ever looks stale.

## Reference files

| File | Covers | Load it when... |
|---|---|---|
| `references/core-rules-basic.md` | Core Concepts, Datasheets, Moving, Making Attacks, Attack Sequence, Other Concepts (Core Rules §01-06, pp.6-25) | Explaining datasheet stats, the hit/wound/save sequence, movement, or basic terminology |
| `references/core-rules-battle-round.md` | The Battle Round, Command/Movement/Shooting/Charge/Fight phases (§07-12, pp.26-43) | Explaining turn structure, a specific phase's rules, Battle-shock, charges, or fighting |
| `references/core-rules-battlefields-tactics.md` | Terrain, Objectives, Stratagems, Actions (§13-16, pp.44-59) | Explaining terrain/cover rules, objective control, core Stratagems, or how Actions work |
| `references/core-rules-advanced.md` | Monsters and Vehicles, Transports, Attached Units, Strategic Reserves, Flying and Surging, Other Rules and Abilities, Aircraft (§17-23, pp.60-75) | Explaining vehicle/monster rules, transports, Leader/attached-unit mechanics, Reserves, or flying models |
| `references/core-rules-abilities-appendix.md` | Every universal Core Ability (Deep Strike, Feel No Pain, Lone Operative, `[SUSTAINED HITS]`, etc. — 34 entries) plus the Rules Appendix (starting/half-strength, destroyed, coherency edge cases) (§24, pp.76-88) | Looking up what a specific named ability/keyword actually does |
| `references/event-companion-part1.md` | Event intro, the 14-step Warhammer Event Mission Sequence, Designer's Notes, all Chapter Approved FAQs, Pairings and Rankings, and the start of Terrain Layouts (pp.1-31) | Explaining tournament/event procedure, mission-deck FAQ rulings, or pairing/ranking rules |
| `references/event-companion-part2.md` | Terrain Layouts completed (all 15 Force Disposition matchups × Layouts A/B/C), then the Base Size Guide begins (Adepta Sororitas through Astra Militarum) (pp.32-62) | Looking up a terrain layout's geometry, or a base size for those factions |
| `references/event-companion-part3.md` | The rest of the Base Size Guide (Black Templars through World Eaters) — plus the investigation notes for the special-action glossary gap, now resolved (pp.63-93) | Looking up a unit's base size, or the history of the special-action-terms fix |
| `references/primary-missions.md` | **Pointer, not a duplicate** — explains the Primary Missions Print Sheets' structure and points to where this project's own code (`app/lib/missions.ts`, `missionMatrix.ts`, `missionScoring.ts`, `missionMatchups.ts`) already canonically maintains the 25 missions' names, VP scoring, and disposition matrix | You need a specific mission's exact VP scoring or the disposition matrix — go to the code, not here |

## A closed gap worth knowing about

This project's mission-matchup feature used to cite 9 special-action
terms (e.g. "sensor sweep", "committed sabotage") in its VP-scoring text
without defining them, because their rule text is printed only on the
physical Primary Mission cards' reverse sides — not in the front-faces-only
print-sheets PDF this project transcribes from, and not in the Event
Companion PDF either (confirmed by exhaustive search — see
`event-companion-part3.md`). This was tracked as a known gap in this
repo's `CLAUDE.md`.

It's now resolved: Wahapedia's fan transcription of the same 2026-27
Chapter Approved Mission Deck has the full card-back text, cross-checked
against this project's own front-card VP data first (mission names, VP
values and thresholds matched exactly) for confidence it's the same card
set. The definitions now live in `app/lib/missionActionGlossary.ts` and
render in the mission-matchup panel's per-mission rules disclosure. If a
future GW mission-pack revision changes these missions, re-verify against
Wahapedia (or the physical cards) before trusting that file again — see
its own doc comment and `missionSources.ts`'s `wahapediaMissionDeck` entry.

## Known accuracy caveats

- `core-rules-battlefields-tactics.md`'s vertical-movement tolerance
  (Core Rules p.48) is genuinely ambiguous from the source scan — two
  independent reads disagreed on whether the fraction is ⅓" or ⅔".
  Flagged inline; verify against a physical copy before relying on it.
- Terrain-layout geometry in the `event-companion-part*.md` files is
  described in prose/tables from a visual diagram, not pixel-exact —
  for anything precision-sensitive, this project already has the real
  deployment-map images at `public/deployment-maps/`; use those instead.
