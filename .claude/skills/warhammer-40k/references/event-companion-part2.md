<!-- Source: Event Companion pages 32-62 -->

# Event Companion — Part 2 (pages 32-62)

This range covers two things: the **tail end of the Terrain Layouts
section** (pages 32-53, finishing what Part 1 left mid-matchup) and the
**start of the Base Size Guide** (pages 54-62, which continues into
Part 3). Nothing else appears in this range — no cover art, no
promotional content, no other section headers.

---

## Terrain Layouts (continued from Part 1)

Part 1 established that every Force Disposition matchup gets three
battlefield-layout diagrams (Layout A, B, C), each a **44" x 60"
battlefield**, and that it deliberately did not transcribe exact
terrain-piece coordinates, treating the diagrams as better consulted
directly. This range's instructions call for more precision than that,
so this section extends Part 1's mission-matrix table (for consistency
with the rest of the skill) *and* adds a best-effort structural
breakdown of each layout's deployment-zone geometry, terrain-piece
placement by zone, and objective count — enough to sanity-check a
layout or reconstruct its broad shape, though not a pixel-exact
tracing. **The exact, pixel-precise versions of all 45 of these layouts
already exist in this repo** as WebP images at
`public/deployment-maps/<disposition>-vs-<disposition>/layout-{a,b,c}.webp`
(per `missionMatchups.ts`) — treat those images, or the source PDF
pages themselves, as the authoritative source for exact recreation;
the tables below are a textual approximation for quick reference only.

### Completing the Primary Mission matrix

This range's pages provide the missions for the 8 Force Disposition
matchups Part 1 hadn't reached yet, completing all 15 possible matchups
(5 dispositions: Take and Hold, Purge the Foe, Disruption,
Reconnaissance, Priority Assets):

| Your Disposition | Opponent's Disposition | Your Primary Mission |
|---|---|---|
| Purge the Foe | Priority Assets | Destroyer's Wrath |
| Priority Assets | Purge the Foe | Vital Link |
| Disruption | Disruption | Outmanoeuvre |
| Disruption | Reconnaissance | Smoke and Mirrors |
| Reconnaissance | Disruption | Surveil the Foe |
| Disruption | Priority Assets | Locate and Deny |
| Priority Assets | Disruption | Extract Relic |
| Reconnaissance | Reconnaissance | Gather Intel |
| Reconnaissance | Priority Assets | Search and Scour |
| Priority Assets | Reconnaissance | Vanguard Operation |
| Priority Assets | Priority Assets | Sabotage |

(Disruption vs Disruption, Reconnaissance vs Reconnaissance, and
Priority Assets vs Priority Assets are self-mirrored — both sides play
the same mission name, same as Take and Hold vs Take and Hold and
Purge the Foe vs Purge the Foe in Part 1.)

### Layout iconography (as seen on these pages)

Common elements on every layout diagram, confidently identifiable by
appearance:

- **Red zone / blue zone** — deployment zones for the side named on the
  left (red) and right (blue) of the header box. Zone shape varies by
  layout: either **diagonal** (opposite corners, split by a straight
  diagonal boundary — sometimes with a circular no-man's-land bite
  taken out of the center), or **parallel bands** running along a pair
  of opposite table edges (either the two long 60" edges or the two
  short 44" edges).
- **Dotted line(s)** — the deployment-zone boundary / edge of "no man's
  land," set some measured distance in from the zone's solid-color
  edge.
- **Oversized faded watermark icon** in a deployment zone (crossed
  swords for Purge the Foe, hex-X for Disruption, eye for
  Reconnaissance, diamond for Priority Assets, castle for Take and
  Hold) — purely decorative, echoing that side's Force Disposition.
- **Grey irregular polygon shapes** — ruins/terrain features, most
  carrying a two-letter code (e.g. `EF`, `AB`, `CD`, `GH`) that
  cross-references a Terrain Feature List defined earlier in the
  document (outside this page range, so the codes' full names aren't
  visible here).
- **Small gold bracket-shaped pieces and green fence/barricade
  pieces** — additional scenery, shown without ID codes.
- **Green circular skull icon** — Objective Marker.
- **Small grey "eye" icon** — appears near terrain/centerline; exact
  rules function not stated in this page range (only graphical), so
  treat as an unidentified marker rather than assume.
- **Paired small red/blue circular icons** near the centerline — likely
  a per-side reference marker (e.g. a reserves/scouting marker); exact
  rules meaning not given on these pages.
- **Red "no-entry" slash-circle icon** overlaid on some terrain pieces —
  likely marks that piece as impassable/blocking; not confirmed by text
  in this range.
- **Large circular badge above the board (red) and below the board
  (parchment/shield)** — simply restates which Force Disposition icon
  owns that battlefield edge, matching the header box.

### Layout-by-layout breakdown

**Purge the Foe vs Reconnaissance — Consecrate vs Triangulation (p. 32, completing Part 1's matchup)**

| Layout | Zone shape | Terrain by zone | Objectives | Printed measurements |
|---|---|---|---|---|
| C | Diagonal (red NW / blue SE), dotted diagonal offset toward center | Red: `EF` (upper-left) + unlabeled aircraft-shaped piece; boundary: `GH`+`CD` stack (upper-right), `AB` (center, with objective), eye icon (left); Blue: `AB` (center-low, with objective), `CD`+`GH` stack (lower-left), fence piece, `EF` (lower, home objective) | 3 skull markers (upper-center `GH`/`CD` piece has none directly; center `AB` piece; lower-center `AB` piece; home `EF` piece) | 24", 6", 15", 16", 24", 23", 10", 17", 4", 8", 9", 15", 8", 8", 5", 5", 7", 10" |

**Purge the Foe vs Priority Assets — Destroyer's Wrath vs Vital Link (pp. 33-35)**

| Layout | Zone shape | Terrain by zone | Objectives | Printed measurements |
|---|---|---|---|---|
| A | Parallel vertical bands (red left ~12" deep, blue right, cream no-man's-land center) | Red: `CD` (upper), fence piece, barricade (lower); center: `EF`+`GH` piece (upper), `AB` x2 (center, one with objective), fence/eye pieces, `GH`+`EF` piece (lower); Blue: fence piece (upper), `CD`+`EF` piece with objective (lower-right) | 2 skull markers (center `AB` piece; center-low piece) | 12", 4", 13", 6", 6", 21", 20", 23", 5", 30", 11", 6", 15", 16", 9", 13", 12" |
| B | Diagonal (red NW / blue SE) with large circular no-man's-land bite at center | Red: `CD` (upper-left, home); center: fence piece, `AB` x2 stacked (with objective) around the circle, fence pieces either side; Blue: `EF` diamond-marked piece (upper-right), fence piece (lower-center), `CD` (lower-right, home) | 1 skull marker at the central `AB` cluster | 22", 9", 29", 13", 4", 28", 10", 22", 15", 17", 4", 14", 10", 6", 21", 5", 4" |
| C | Parallel horizontal bands (red top ~18" deep, blue bottom, full width) | Red: `CD` (center, home) flanked by fence pieces; center: `EF`+`GH` (upper-right), `AB` x2 (center, one with objective), `EF`+`GH` (lower-left, with objective), fence/eye pieces; Blue: `CD` (center, home) flanked by fence pieces | 2 skull markers (center cluster; lower-left `EF`/`GH` piece) | 18", 19", 13", 4", 2", 26", 25", 4", 19", 15", 15", 13", 9", 9", 9", 9" |

**Disruption vs Disruption — Outmanoeuvre vs Outmanoeuvre (pp. 36-38)**

| Layout | Zone shape | Terrain by zone | Objectives | Printed measurements |
|---|---|---|---|---|
| A | Diagonal (red NW / blue SE) | Red: `EF` (home, upper-left), fence piece; boundary: `GH`+`CD` (upper-right), `AB` x2 center (with objective), fence pieces; Blue: `CD`+`GH` (lower-left, with objective), fence piece, `EF` (home, lower-right) | 2 skull markers (center `AB` cluster; lower-left `CD`/`GH`) | 21", 23", 5", 15", 28", 4", 20", 14", 16", 10", 8", 7", 5", 10" |
| B | Diagonal, curved scallop cut at center | Red: `EF` (home, upper-left) with arrow motif; center: `GH`+`CD` (upper-right, with objective), `AB` x2 (center, with objective), fence/eye pieces; Blue: `CD` (lower-left, with objective), fence piece, `EF` (home, lower-right) | 3 skull markers | 20", 12", 27", 9", 25", 16.25", 4", 14", 20", 22", 7", 20", 12", 8", 8", 6", 5" |
| C | Parallel vertical bands (red left, blue right) | Red: `CD` (home, upper-left); center-upper: `EF`+`GH` (with objective), `AB` x2 (center, with objective); center-lower: fence piece, `GH`+`EF` (with objective); Blue: `CD` (home, lower-right) | 3 skull markers | 14", 5", 5", 8", 8", 4", 22", 12", 23", 6", 4", 17", 17", 24.25", 8", 5", 5", 14" |

**Disruption vs Reconnaissance — Smoke and Mirrors vs Surveil the Foe (pp. 39-41)**

| Layout | Zone shape | Terrain by zone | Objectives | Printed measurements |
|---|---|---|---|---|
| A | Parallel horizontal bands (red top, blue bottom) | Red: `EF` (home) + fence piece; center: `GH`+`CD` (upper-right, with objective), `AB` x2 (center, with objective), fence pieces; Blue: `EF` (home, with objective) | 3 skull markers | 12", 20", 10", 23", 15", 30", 30", 20", 5", 4", 13", 11", 12", 4", 20", 6", 14", 9" |
| B | Parallel vertical bands (red left, blue right) | Red: `CD` (home); center: fence piece, `AB` x2 (center, with objective), fence pieces; Blue: `GH`+`EF` piece top-right, fence piece, `EF`+`GH` (home, with objective) | 2 skull markers | 12", 21", 21", 28", 16", 26", 13", 7", 4", 10", 15", 12", 7", 13", 24", 6", 4", 6", 12" |
| C | Diagonal with circular no-man's-land bite | Red: `CD` (home, upper-left) with X watermark; center: `AB` x2 around the circle (with objective), fence pieces; Blue: `EF` (with objective, upper-right), `GH` piece, `CD` (home, lower-right) | 2 skull markers | 25", 9", 28", 26", 14", 3", 7", 10", 20", 18", 12", 11", 5", 20" |

**Disruption vs Priority Assets — Locate and Deny vs Extract Relic (pp. 42-44)**

| Layout | Zone shape | Terrain by zone | Objectives | Printed measurements |
|---|---|---|---|---|
| A | Parallel vertical bands (red left, blue right) | Red: `CD` (home); center: `AB`, central 4-way objective piece, fence pieces, `GH`+`EF` (with objective); Blue: `EF`+`GH` (with objective, upper-right), fence piece, `AB`, `CD` (home) | 3 skull markers (one at a distinctive 4-piece central objective hub) | 14", 5", 5", 8", 10", 5", 5", 23", 12", 12", 19", 19", 26", 25", 4", 14", 18", 10", 8" |
| B | Parallel horizontal bands (red top, blue bottom) | Red: `EF` (home); center: `AB`, central objective hub, fence pieces, `AB`, `GH`+`CD` (with objective); Blue: `EF` (home), fence piece | 2 skull markers | 20", 12", 18", 18", 27", 29", 28", 15", 17", 23", 21", 4", 14", 9", 9", 9", 7", 7", 20", 13" |
| C | Diagonal (red NW / blue SE) | Red: `EF` (home, upper-left) with X watermark, unlabeled piece top-right; center: central objective hub, `GH`+`CD` (upper-right), fence pieces; Blue: `AB` (with objective), fence piece, `EF` (home, lower-right) | 2 skull markers | 21", 18", 18", 9", 9", 27", 16", 17", 5", 24", 19", 14", 6", 22", 4" |

**Reconnaissance vs Reconnaissance — Gather Intel vs Gather Intel (pp. 45-47)**

| Layout | Zone shape | Terrain by zone | Objectives | Printed measurements |
|---|---|---|---|---|
| A | Parallel vertical bands (red left, blue right) | Red: `CD` (home); center: `EF`+`GH` (with objective, upper), `AB` x2 (center, with objective), fence piece; Blue: fence piece, `CD` (home) | 2 skull markers | 14", 5", 5", 22", 12", 8", 4", 6", 4", 23", 15", 15", 23", 8", 5", 5", 14" |
| B | Diagonal (red NW / blue SE) | Red: `EF` (home, upper-left); center: `GH`+`CD` (upper-right, with objective), `AB` x2 (center, with objective), fence/eye pieces; Blue: `CD` (with objective), `EF` (home) | 3 skull markers | 23", 9", 15", 24", 20", 4", 8", 7", 10", 16", 10", 5" |
| C | Parallel horizontal bands (red top, blue bottom) | Red: `EF` (home); center: `GH`+`CD` (with objective, upper-right), `AB` x2 (center, with objective), fence pieces; Blue: `EF` (home, with objective) | 3 skull markers | 12", 20", 22", 18", 25", 27", 5", 9", 16", 20", 22", 14", 4", 14", 8", 8", 12", 20", 6", 5", 5" |

**Reconnaissance vs Priority Assets — Search and Scour vs Vanguard Operation (pp. 48-50)**

| Layout | Zone shape | Terrain by zone | Objectives | Printed measurements |
|---|---|---|---|---|
| A | Diagonal (red NW / blue SE) | Red: `CD` (home, upper-left); center: `GH`+`EF` (upper-right), `AB` x2 (center, with objective), fence pieces; Blue: `EF` (with objective), fence piece, `CD` (home) | 2 skull markers | 17", 10", 6", 23", 12", 24", 4", 12", 8", 20", 7", 4", 4" |
| B | Parallel horizontal bands (red top, blue bottom) | Red: `CD` (home); center: `AB` (with objective, upper-left), central objective hub, `AB`, fence pieces, `EF` (with objective); Blue: fence piece, `CD` (home) | 2 skull markers | 20", 12", 16.25", 27", 5", 16.25", 25", 20", 5", 5", 4", 6", 20", 12", 13", 7", 7", 7", 7", 14" |
| C | Parallel vertical bands (red left, blue right) | Red: `CD` (home); center: `EF`+`GH` (with objective, upper), `AB` x2 (center, with objective), fence pieces; Blue: `CD` (home) | 2 skull markers | 14", 4", 4", 9", 8", 17", 26", 4", 13", 24.25", 17", 12", 9", 20", 16", 5", 6", 5", 14" |

**Priority Assets vs Priority Assets — Sabotage vs Sabotage (pp. 51-53)**

| Layout | Zone shape | Terrain by zone | Objectives | Printed measurements |
|---|---|---|---|---|
| A | Parallel vertical bands (red left, blue right) | Red: `CD` (home); center: fence piece, central objective piece, `AB`, fence pieces; Blue: `AB`, `CD` (home) | 2 skull markers (one at a distinctive doubled-icon central piece) | 14", 4", 4", 8", 11", 7", 5", 5", 19", 10", 10", 28", 6", 26", 19", 22", 16", 14", 18", 8", 14", 4", 4" |
| B | Diagonal (red NW / blue SE) | Red: `CD` (home, upper-left); center: `GH`+`EF` (with objective, upper-right), central doubled objective piece, `AB`, fence pieces; Blue: `CD` (home, with objective) | 3 skull markers | 18", 25", 5", 9", 18", 27", 16", 21", 2", 24", 9", 19", 4", 14", 8", 15", 5", 6", 6", 5" |
| C | Parallel horizontal bands (red top, blue bottom) | Red: `EF` (home), `AB` piece top-right; center: central doubled objective piece, `GH`+`CD` (with objective), fence pieces; Blue: `AB`, `EF`+`CD` (home, with objective) | 3 skull markers | 20", 12", 18", 18", 27", 4", 5", 21", 9", 15", 18", 16", 16", 4", 20", 4", 14", 12", 10", 4", 7", 7", 10" |

---

## Base Size Guide (starts p. 54, continues into Part 3)

A separate document-within-the-document — its own title page, its own
"Contents" index, and its own faction-by-faction run of two-column
(`UNIT` / `BASE SIZE`) tables. **This section starts here and does not
finish in this range** — see Part 3 for the continuation from Black
Templars (p. 63) through World Eaters (p. 93).

### Title page (p. 54)

**"WARHAMMER 40,000 — BASE SIZE GUIDE"** — "Last updated: June 2026."

Intro text: this document lists the up-to-date, appropriate base size
for every Warhammer 40,000 model usable in matched play, to give event
organisers and players a shared reference and avoid uncertainty at
events. Converting/customising models is explicitly encouraged.
Checking base sizes against this guide is **not a requirement** for a
game of Warhammer 40,000, but is intended to support event organisers
in giving a fair, shared play experience.

**Designer's Note:** a few of the very largest models in the document
are marked **Unique** — they don't fit any standard Citadel base, so at
an event the organiser and player should agree the appropriate base
size for it together.

Footer: "Produced by the Warhammer Design Studio" / "Base Size Guide ©
Copyright Games Workshop Limited 2026."

**Contents** (two columns, faction → page number):

| Faction | Page | | Faction | Page |
|---|---|---|---|---|
| Adepta Sororitas | 55 | | Emperor's Children | 75 |
| Adeptus Custodes | 56 | | Genestealer Cults | 76 |
| Adeptus Mechanicus | 57 | | Grey Knights | 77 |
| Adeptus Titanicus | 58 | | Imperial Agents | 78 |
| Aeldari | 59 | | Imperial Knights | 79 |
| Astra Militarum | 61 | | Leagues of Votann | 80 |
| Black Templars | 63 | | Necrons | 81 |
| Blood Angels | 65 | | Orks | 83 |
| Chaos Daemons | 66 | | Space Marines | 85 |
| Chaos Knights | 68 | | Space Wolves | 88 |
| Chaos Space Marines | 69 | | T'au Empire | 89 |
| Dark Angels | 71 | | Thousand Sons | 91 |
| Death Guard | 72 | | Tyranids | 92 |
| Deathwatch | 73 | | World Eaters | 94 |
| Drukhari | 74 | | | |

(Note: the Contents page lists World Eaters as starting on p. 94, one
page past the document's actual last page, 93 — a printing/index
discrepancy; Part 3 confirms World Eaters is the final section and it
does fit on p. 93.)

### Adepta Sororitas (p. 55)

| Unit | Base Size |
|---|---|
| Aestred Thurga and Agathae Dolan: Aestred Thurga | 32mm |
| Aestred Thurga and Agathae Dolan: Agathae Dolan | 25mm |
| Arco-flagellants | 25mm |
| Battle Sisters Squad | 32mm |
| Canoness | 32mm |
| Canoness with Jump Pack | 32mm |
| Castigator | Hull |
| Celestian Insidiants | 32mm |
| Celestian Sacresants | 32mm |
| Daemonifuge | 32mm |
| Dialogus | 40mm |
| Dogmata | 32mm |
| Dominion Squad | 32mm |
| Exorcist | Hull |
| Hospitaller | 50mm |
| Imagifier | 32mm |
| Immolator [Adepta Sororitas] | Hull |
| Junith Eruita | 50mm |
| Intranzia Fraye | 60mm |
| Ministorum Priest | 32mm |
| Mortifiers | 50mm |
| Morvenn Vahl | 60mm |
| Palatine | 32mm |
| Paragon Warsuits | 50mm |
| Penitent Engines | 50mm |
| Repentia Squad: Repentia Superior | 32mm |
| Repentia Squad: Sister Repentia | 28.5mm |
| Retributor Squad | 32mm |
| Saint Celestine | 40mm |
| Saint Celestine: Geminae Superia | 32mm |
| Sanctifiers | 25mm |
| Seraphim Squad | 32mm |
| Sisters Novitiate Squad: Novitiate Superior | 32mm |
| Sisters Novitiate Squad: Sister Novitiate | 28.5mm |
| Sororitas Rhino | Hull |
| Triumph of Saint Katherine | 120x92mm Oval Base |
| Zephyrim Squad | 32mm |

### Adeptus Custodes (p. 56)

| Unit | Base Size |
|---|---|
| Aleya | 32mm |
| Allarus Custodians | 40mm |
| Anathema Psykana Rhino | Hull |
| Blade Champion | 40mm |
| Custodian Guard | 40mm |
| Custodian Wardens | 40mm |
| Knight-Centura | 32mm |
| Prosecutors | 32mm |
| Shield-Captain | 40mm |
| Shield-Captain in Allarus Terminator Armour | 40mm |
| Shield-Captain on Dawneagle Jetbike | 75x42mm Oval Base |
| Trajann Valoris | 40mm |
| Valerian | 40mm |
| Venerable Contemptor Dreadnought | 60mm |
| Venerable Land Raider | Hull |
| Vertus Praetors | 75x42mm Oval Base |
| Vigilators | 32mm |
| Witchseekers | 32mm |

**Imperial Armour sub-group:**

| Unit | Base Size |
|---|---|
| Agamatus Custodians | 75x42mm Oval Base |
| Aquilon Custodians | 50mm |
| Ares Gunship | 160mm |
| Caladius Grav-tank | 170x109mm Oval Base |
| Contemptor-Achillus Dreadnought | 60mm |
| Contemptor-Galatus Dreadnought | 60mm |
| Coronus Grav-carrier | 170x109mm Oval Base |
| Custodian Guard with Adrasite and Pyrithite Spears | 40mm |
| Orion Assault Dropship | 160mm |
| Pallas Grav-attack | 105x70mm Oval Base |
| Sagittarum Custodians | 40mm |
| Telemon Heavy Dreadnought | 100mm |
| Venatari Custodians | 40mm |

### Adeptus Mechanicus (p. 57)

| Unit | Base Size |
|---|---|
| Archaeopter Fusilave | 170x109mm Oval Base |
| Archaeopter Stratoraptor | 170x109mm Oval Base |
| Archaeopter Transvector | 170x109mm Oval Base |
| Belisarius Cawl | 105x70mm Oval Base |
| Corpuscarii Electro-Priests | 32mm |
| Cybernetica Datasmith | 32mm |
| Fulgurite Electro-Priests | 32mm |
| Hastarii Exterminators | 32mm |
| Hastarii Fusiliers | 32mm |
| Ironstrider Ballistarii | 105x70mm Oval Base |
| Kastelan Robots | 60mm |
| Kataphron Breachers | 60mm |
| Kataphron Destroyers | 60mm |
| Onager Dunecrawler | 130mm |
| Pteraxii Skystalkers | 40mm |
| Pteraxii Sterylizors | 40mm |
| Serberys Raiders | 60x35.5mm Oval Base |
| Serberys Sulphurhounds | 60x35.5mm Oval Base |
| Servitor Battleclade: Servitor Underseer / Gun Servitors | 32mm |
| Servitor Battleclade: Combat Servitors | 25mm |
| Sicarian Infiltrators | 40mm |
| Sicarian Ruststalkers | 40mm |
| Skitarii Marshal | 32mm |
| Skitarii Rangers | 25mm |
| Skitarii Rangers/Skitarii Vanguard: Transuranic Arquebus | 60x35.5mm Oval Base |
| Skitarii Vanguard | 25mm |
| Skorpius Disintegrator | Hull |
| Skorpius Dunerider | Hull |
| Sydonian Dragoons with Radium Jezzails | 105x70mm Oval Base |
| Sydonian Dragoons with Taser Lances | 105x70mm Oval Base |
| Sydonian Skatros | 40mm |
| Tech-Priest Dominus | 50mm |
| Tech-Priest Enginseer | 32mm |
| Tech-Priest Manipulus | 50mm |
| Technoarcheologist | 32mm |
| Thulia Ghuld | 80mm |

### Adeptus Titanicus (p. 58)

| Unit | Base Size |
|---|---|
| Reaver Titan | Hull |
| Warbringer Nemesis Titan | Hull |
| Warhound Titan | Hull |
| Warlord Titan | Hull |

(Shortest faction table in the guide — only 4 entries, all Titanicus
super-heavies on "Hull"-type bases, and the rest of the page is blank.)

### Aeldari (pp. 59-60)

| Unit | Base Size |
|---|---|
| Asurmen | 40mm |
| Autarch | 32mm |
| Autarch wayleaper | 32mm |
| Avatar of Khaine | 80mm |
| Baharroth | 40mm |
| Corsair Skyreavers | 28.5mm |
| Corsair Voidreavers | 28.5mm |
| Corsair Voidscarred | 28.5mm |
| Crimson Hunter | 120x92mm Oval Base |
| D-cannon Platform | 40mm |
| Dark Reapers | 28.5mm |
| Death Jester | 25mm |
| Dire Avengers | 28.5mm |
| Eldrad Ulthran | 32mm |
| Falcon | Large Flying Base |
| Farseer | 25mm |
| Farseer Skyrunner | Small Flying Base |
| Fire Dragons | 28.5mm |
| Fire Prism | Large Flying Base |
| Fuegan | 40mm |
| Guardian Defenders | 28.5mm |
| Guardian Defenders: Heavy Weapon Platform | 40mm |
| Hemlock Wraithfighter | 120x92mm Oval Base |
| Howling Banshees | 28.5mm |
| Jain Zar | 40mm |
| Kharseth | 32mm |
| Lhykhis | 40mm |
| Maugan Ra | 40mm |
| Night Spinner | Large Flying Base |
| Prince Yriel | 40mm |
| Rangers | 28.5mm |
| Shadow Weaver Platform | 40mm |
| Shadowseer | 25mm |
| Shining Spears | Large Flying Base |
| Shroud Runners | Large Flying Base |
| Skyweavers | Large Flying Base |
| Solitaire | 25mm |
| Spiritseer | 25mm |
| Starfang | 105x70mm Oval Base |
| Starweaver | Large Flying Base |
| Storm Guardians | 28.5mm |
| Storm Guardians: Serpent's Scale Platform | 40mm |
| Striking Scorpions | 28.5mm |
| Swooping Hawks | 32mm |
| The Visarch | 32mm |
| The Yncarne | 80mm |
| Troupe | 25mm |
| Troupe Master | 25mm |
| Vibro Cannon Platform | 40mm |
| Voidweaver | Large Flying Base |
| Vyper | 105x70mm Oval Base |
| War Walker | 60mm |
| Warlock | 32mm |
| Warlock Conclave | 32mm |
| Warlock Skyrunners | Small Flying Base |
| Warp Spiders | 28.5mm |
| Wave Serpent | Large Flying Base |
| Windriders | Small Flying Base |
| Wraithblades | 40mm |
| Wraithguard | 40mm |
| Wraithknight | 120x92mm Oval Base |
| Wraithknight with Ghostglaive | 120x92mm Oval Base |
| Wraithlord | 60mm |
| Ynnari Archon | 32mm |
| Ynnari Incubi | 28.5mm |
| Ynnari Kabalite Warriors | 25mm |
| Ynnari Raider | Large Flying Base |
| Ynnari Reavers | Small Flying Base |
| Ynnari Succubus | 25mm |
| Ynnari Venom | Large Flying Base |
| Ynnari Wyches | 25mm |
| Yvraine | 75x42mm Oval Base |

**Imperial Armour sub-group:**

| Unit | Base Size |
|---|---|
| Phantom Titan | Hull |
| Revenant Titan | Hull |

(Note: several Ynnari entries appear inside the Aeldari faction table
rather than in a faction of their own, as printed.)

### Astra Militarum (pp. 61-62)

| Unit | Base Size |
|---|---|
| Aegis Defence Line | Hull |
| Armoured Sentinels | 80mm |
| Artillery Team | 130mm |
| Attilan Rough Riders | 60x35.5mm Oval Base |
| Baneblade | Hull |
| Banehammer | Hull |
| Banesword | Hull |
| Basilisk | Hull |
| Bullgryn squad | 40mm |
| Cadian Castellan | 28.5mm |
| Cadian Command Squad | 28.5mm |
| Cadian Heavy Weapons Squad | 50mm |
| Cadian Recon Squad | 28.5mm |
| Cadian Shock Troops | 25mm |
| Catachan Command Squad | 25mm |
| Catachan Heavy Weapons Squad | 60mm |
| Catachan Jungle Fighters | 25mm |
| Centaur RSV | Hull |
| Chimera | Hull |
| Commissar | 28.5mm |
| Commissar Graves | Hull |
| Commissar Graves on Foot | 32mm |
| Commissar Yarrick | 32mm |
| Death Korps of Krieg | 25mm |
| Death Riders | 60x35.5mm Oval Base |
| Deathstrike | Hull |
| Doomhammer | Hull |
| Field Ordnance Battery | 100mm |
| Gaunt's Ghosts | 28.5mm |
| Hellhammer | Hull |
| Hellhound | Hull |
| Hippogriff AFV | Hull |
| Hydra | Hull |
| Kasrkin | 28.5mm |
| Krieg Combat Engineers | 25mm |
| Krieg Command Squad | 25mm |
| Krieg Command Squad: Lord Commissar | 32mm |
| Krieg Heavy Weapons Squad | 50mm |
| Krieg Heavy Weapons Squad: Fire Coordinator | 25mm |
| Leman Russ Battle Tank | Hull |
| Leman Russ Commander | Hull |
| Leman Russ Demolisher | Hull |
| Leman Russ Eradicator | Hull |
| Leman Russ Executioner | Hull |
| Leman Russ Exterminator | Hull |
| Leman Russ Punisher | Hull |
| Leman Russ Vanquisher | Hull |
| Lord Marshal Dreir | 75x42mm Oval Base |
| Lord Solar Leontus | 80mm |
| Manticore | Hull |
| Militarum Tempestus Command Squad | 25mm |
| Ministorum Priest | 32mm |
| Nork Deddog | 40mm |
| Ogryn Bodyguard | 40mm |
| Ogryn squad | 40mm |
| Primaris Psyker | 32mm |
| Ratlings | 25mm |
| Ratlings: Tankstopper Rifle | 28.5mm |
| Rogal Dorn Battle Tank | Hull |
| Rogal Dorn Commander | Hull |
| Scout Sentinels | 80mm |
| Shadowsword | Hull |
| Sly Marbo | 32mm |
| Stormlord | Hull |
| Stormsword | Hull |
| Taurox | Hull |
| Taurox Prime | Hull |
| Tech-Priest Enginseer | 32mm |
| Tempestus Aquilons | 28.5mm |
| Tempestus Scions | 25mm |
| Ursula Creed | 32mm |
| Valkyrie | 120x92mm Oval Base |
| Wyvern | Hull |

**Imperial Armour sub-group:**

| Unit | Base Size |
|---|---|
| Avenger Strike Fighter | 120x92mm Oval Base |
| Cyclops Demolition Vehicle | Hull |

The Astra Militarum section appears to **end cleanly on p. 62** — the
Imperial Armour sub-group has only these two entries, and the rest of
the page is blank, consistent with the Contents page listing the next
faction (Black Templars) as starting on p. 63. Page 63 itself is
outside this assigned range; Part 3 confirms it opens fresh on "BLACK
TEMPLARS" with no continuation banner, supporting this read.

---

No pages in the 32-62 range were unreadable or ambiguous in terms of
what content type they held. The Terrain Layout diagrams (pp. 32-53)
are graphically dense and their small icons (the grey "eye" symbol, the
paired red/blue circular markers, the red slash-circle overlay) don't
have their rules meaning spelled out in text anywhere in this range —
flagged inline above rather than guessed at. The Base Size Guide
section (pp. 54-62) is unambiguous and continues past p. 62 into Part 3.
