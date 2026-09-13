import type { Disposition } from "./dispositions";
import { dispositionSlug } from "./dispositions";

// Special-action terms cited by missionScoring.ts (e.g. "sensor sweep")
// whose exact rule text lives on the physical mission card's reverse side,
// not in the front-faces-only "Primary Missions Print Sheets" PDF this
// content was transcribed from (see missionSources.ts's `printSheets`
// entry). TODO(mission-glossary): replace each citation in
// missionScoring.ts with the real definition once that text is available,
// and remove this list.
export const MISSING_GLOSSARY_TERMS: readonly string[] = [
  "Surveilled",
  "Sensor sweep",
  "Committed sabotage",
  "Secured the asset",
  "Vanguard operation",
  "Extracted intelligence",
  "Triangulated",
  "Trapped",
  "Decoyed",
];

export type MissionMatchup = {
  // The two dispositions this write-up covers — order doesn't matter,
  // lookup is unordered (see getMissionMatchup). Equal values means this
  // entry is a mirror matchup.
  dispositions: [Disposition, Disposition];
  // Plain-language explanation of what each side is actually trying to do
  // this game, referencing both missions by name.
  summary: string;
  // Tactical suggestions specific to this pairing — informed by both
  // sides' scoring shape (timing, what each mission rewards), not generic
  // 40k advice.
  tactics: string[];
};

// Hand-authored from the verified missionMatrix.ts pairings and the full
// VP scoring in missionScoring.ts — one entry per unordered disposition
// pair (15 total, mirrors included once).
export const MISSION_MATCHUPS: readonly MissionMatchup[] = [
  {
    dispositions: ["Take and Hold", "Take and Hold"],
    summary:
      "A mirror: both of you play Battlefield Dominance, a straightforward objective-count majority that pays out every round from Round 2 on and rewards holding your own home objective while also holding others.",
    tactics: [
      "Early rounds are close to free VP for whoever grabs more objectives first — commit to a fast, even spread rather than turtling on your home objective alone.",
      "The cumulative bonus needs your home objective held too, so don't overextend everything forward — leave enough back to keep your own home safe.",
      "From Round 2 the swing is in raw objective count, not who \"wins\" a fight — trading a unit to free up an objective is often worth it.",
    ],
  },
  {
    dispositions: ["Take and Hold", "Purge the Foe"],
    summary:
      "The Take and Hold player scores Immovable Object, a slow, steady map-control mission with no big late finisher. The Purge the Foe player scores Unstoppable Force, which pays for kills every round plus a Round-5 bonus for holding a central objective.",
    tactics: [
      "Take and Hold wants a long, quiet game — trade space for board presence and avoid committing units to fights they don't need to win.",
      "Purge the Foe should force engagements early and often; every round with a kill is worth VP regardless of the objective picture.",
      "Take and Hold should hold its central objective(s) right to the very end — Unstoppable Force also rewards central-objective control at Round 5, so this becomes a contested prize late.",
    ],
  },
  {
    dispositions: ["Take and Hold", "Disruption"],
    summary:
      "Take and Hold scores Determined Acquisition, which rewards seizing objectives you didn't already hold — especially deep in your opponent's territory. Disruption scores Death Trap, which rewards trapping terrain areas (a reverse-side action) and killing enemies caught inside them.",
    tactics: [
      "Take and Hold should keep moving — an objective you already held last turn earns nothing new, so contest ground you don't hold yet, especially on the opponent's side of the table.",
      "Disruption's big lever is terrain, not objectives directly — claim terrain areas early (especially ones that double as objectives) and use them to ambush anyone who parks a unit inside.",
      "Because Determined Acquisition rewards pushing into enemy territory, Disruption should expect pressure on its own side and keep answers there.",
    ],
  },
  {
    dispositions: ["Take and Hold", "Reconnaissance"],
    summary:
      "Take and Hold scores Purge and Secure, which needs kills specifically near objectives, not anywhere on the table. Reconnaissance scores Reconnaissance Sweep, which rewards spreading 3-4 units across different table quarters plus a flat VP for any kill at all.",
    tactics: [
      "Take and Hold should pull fights onto objectives — a kill in the open scores nothing here, the same kill next to an objective does.",
      "Reconnaissance's spread requirement pulls against clumping up for one big alpha strike — plan deployment and movement with that spread in mind from turn one.",
      "Both sides also get real value from objective holding from Round 2 on, so don't let either mission's \"kill\" half fully distract from contesting objectives directly.",
    ],
  },
  {
    dispositions: ["Take and Hold", "Priority Assets"],
    summary:
      "Take and Hold scores Inescapable Dominion, a map-control grind with a large single payoff for holding the opponent's home objective at the end. Priority Assets scores Secure Asset, built around a reverse-side asset-securing action plus punishing kills near central objectives.",
    tactics: [
      "Take and Hold should treat the opponent's home objective as the real prize — 5VP at the very end is worth planning a late push for, not just holding your own side.",
      "Priority Assets should use the asset-securing action every round it can — it's VP independent of who's winning the objective fight.",
      "Both sides benefit from majority objective control from Round 2, so early skirmishing over the middle objectives matters to both.",
    ],
  },
  {
    dispositions: ["Purge the Foe", "Purge the Foe"],
    summary:
      "A mirror: both of you play Meatgrinder — any kill scores, objective holding from Round 2 is a flat bonus, out-killing your own previous turn is a bonus, and the opponent's home objective is a big finisher.",
    tactics: [
      "The \"more kills than last turn\" band rewards escalating aggression, not constant grinding — pace commitments so each turn can outdo the last rather than spending everything on Round 2.",
      "Since both sides score identically, the game is decided by trading efficiently, not by holding more ground — don't spend units to grab objectives that don't need defending.",
      "The home-objective finisher is worth planning a dedicated push for once the kill race is close.",
    ],
  },
  {
    dispositions: ["Purge the Foe", "Disruption"],
    summary:
      "Purge the Foe scores Punishment, a targeted-kill mission — you only score for killing the specific 1-3 units you \"condemn\" that turn — with a huge 8VP home-objective finisher. Disruption scores Delaying Action, which pays for any kill plus holding a central and an expansion objective at once.",
    tactics: [
      "Purge the Foe should condemn units it can actually reach and kill that turn, not just the biggest threat — condemning something out of range wastes the whole turn's scoring chance.",
      "Disruption doesn't care which units die, so it can happily trade down or pick off easy kills anywhere on the table.",
      "Disruption's central-plus-expansion bonus rewards spreading control across objective types — don't stack every holding on one flank.",
      "Punishment's home-objective payoff (8VP) is the single biggest number in this matchup — worth a dedicated late push if the game is close.",
    ],
  },
  {
    dispositions: ["Purge the Foe", "Reconnaissance"],
    summary:
      "Purge the Foe scores Consecrate, where kills turn units into \"consecration units\" that consecrate nearby objectives at end of turn. Reconnaissance scores Triangulation, a pure objective mission built on a reverse-side action that pays off steeply once you triangulate three objectives at once.",
    tactics: [
      "Purge the Foe should kill near the objectives it wants to hold, not just anywhere — a kill next to an empty objective sets up next turn's VP, a kill in open ground doesn't.",
      "Triangulation's reward jumps sharply from two to three objectives (6VP to 10VP) — it's worth stretching to hit three at once rather than settling for two.",
      "Purge the Foe's biggest single prize is consecrating the enemy's own home objective — that needs a unit alive and killing right next to it, so plan an approach there specifically.",
    ],
  },
  {
    dispositions: ["Purge the Foe", "Priority Assets"],
    summary:
      "Purge the Foe scores Destroyer's Wrath, which pays extremely well (6VP) for simply holding more objectives than your opponent, on top of ordinary kill VP. Priority Assets scores Vital Link, which rewards building operation markers around central objectives and stacking objective-type bonuses toward a 10VP home-objective finisher.",
    tactics: [
      "Destroyer's Wrath's majority bonus is the richest \"just hold more ground\" reward in this matchup — prioritize objective count over chasing every kill.",
      "Priority Assets should invest early in placing operation markers near central objectives — the bonus rewards setup over the course of the game, not one big turn.",
      "Priority Assets' home-objective finisher (10VP) is worth committing a mobile unit toward late, since Destroyer's Wrath has no equivalent single deep prize to race for.",
    ],
  },
  {
    dispositions: ["Disruption", "Disruption"],
    summary:
      "A mirror: both of you play Outmanoeuvre — a flat, escalating reward for holding objectives (4/5/6VP as the game goes on) plus a flat 10VP for outright controlling the enemy's home objective at any point.",
    tactics: [
      "The per-objective reward escalates round over round, so the same held objective is worth more late than early — don't trade units to hold ground in Round 1 you can't keep past Round 3.",
      "A single successful raid on the enemy home objective is worth grabbing and immediately defending — 10VP for one objective dwarfs the escalating per-objective rate.",
      "Symmetric missions turn on efficiency, not scheme — the winner is whoever spends fewer resources per objective held.",
    ],
  },
  {
    dispositions: ["Disruption", "Reconnaissance"],
    summary:
      "Both sides run their own operation-marker economy: Disruption's Smoke and Mirrors scores for \"decoyed\" objectives (more if they're in your opponent's own territory), while Reconnaissance's Surveil the Foe scores for \"surveilled\" enemy units and separately rewards clearing all of Disruption's operation markers off the board.",
    tactics: [
      "Disruption should push decoys into the opponent's own territory specifically — that's a cumulative bonus, not just base VP, and the 4+ decoy finisher rewards spreading them across the board rather than stacking a few.",
      "Reconnaissance's late \"no enemy operation markers on the battlefield\" bonus is a direct answer to Disruption's plan — prioritize clearing markers once you're contesting deep in their setup.",
      "Both sides also score for ordinary objective holding from Round 2, so don't let the operation-marker sub-game fully distract from contesting the open board.",
    ],
  },
  {
    dispositions: ["Disruption", "Priority Assets"],
    summary:
      "The most directly interlocking pairing in the matrix: Disruption's Locate and Deny places five operation markers outside its deployment zone and scores for narrowing them down to one survivor, while Priority Assets' Extract Relic scores for doing the exact same thing to Disruption's markers from the other side.",
    tactics: [
      "Disruption should spread its five markers so no single push threatens more than one or two at once — losing them too fast hands Priority Assets easy VP on the same objective.",
      "Priority Assets should identify which of Disruption's markers is easiest to isolate and contest that one specifically, rather than spreading pressure evenly across all five.",
      "Both sides also score for kills near objectives, so this matchup rewards fighting near the terrain areas holding those markers rather than off in open ground.",
    ],
  },
  {
    dispositions: ["Reconnaissance", "Reconnaissance"],
    summary:
      "A mirror: both of you play Gather Intel — a strong Round-1 rush for the centre, then a long operation-marker buildup (via a reverse-side \"extracted intelligence\" action) that pays off heavily at the very end.",
    tactics: [
      "The Round-1 central-objective VP (6) is the richest early-game reward in this mirror — prioritize contesting the centre turn one over anything else.",
      "The end-of-battle bonuses reward marker count and one marker's location separately, so don't just drop markers wherever's safe — route at least one toward the opponent's home objective over the course of the game.",
      "The intelligence-extraction action is worth doing every round it's available from Round 2 on — it's the highest single per-instance VP (7) in the mission.",
    ],
  },
  {
    dispositions: ["Reconnaissance", "Priority Assets"],
    summary:
      "Reconnaissance scores Search and Scour, which rewards clearing your own territory of enemies and punishing anyone camping in terrain. Priority Assets scores Vanguard Operation, which gives one of the biggest single payoffs in the matrix (10VP) for a late push on the enemy home objective.",
    tactics: [
      "Reconnaissance's \"no enemy units in your territory\" finisher means giving ground late can cost a lot of VP — keep at least a screening presence on your own side through Round 5.",
      "Priority Assets should treat the home-objective push as the real win condition here — 10VP is more than most other bands combined, so commit a fast, durable unit early enough that it survives the trip.",
      "Both sides get real value from objective control from Round 2, so the mid-game objective fight still matters even with those big late-game swings in view.",
    ],
  },
  {
    dispositions: ["Priority Assets", "Priority Assets"],
    summary:
      "A mirror: both of you play Sabotage — a repeatable reverse-side sabotage action, paying extra for doing it deep in your opponent's own territory, on top of ordinary objective holding.",
    tactics: [
      "The deep-territory bonus is cumulative per unit, so sending several cheap, expendable units to sabotage inside the opponent's deployment zone outscores one big push.",
      "This mission has no big late-game finisher, unlike most of this matrix — VP is earned steadily every round, so don't hold back \"for a big Round 5 push\" the way some other missions reward.",
      "Objective holding from Round 2 is a flat, easy-to-neglect bonus here — don't skip it while chasing sabotage actions on the far side of the table.",
    ],
  },
];

export function getMissionMatchup(a: Disposition, b: Disposition): MissionMatchup {
  const match = MISSION_MATCHUPS.find(
    (m) =>
      (m.dispositions[0] === a && m.dispositions[1] === b) ||
      (m.dispositions[0] === b && m.dispositions[1] === a)
  );
  if (!match) {
    throw new Error(`No mission matchup content for ${a} vs ${b}`);
  }
  return match;
}

export type DeploymentMapImage = { layout: "A" | "B" | "C"; src: string };

/** The 3 alternate deployment-map images for this disposition pairing —
 * canonicalized (slugs sorted) so either argument order resolves to the
 * same directory, matching scripts/crop-deployment-maps.sh's output. */
export function deploymentMapImages(a: Disposition, b: Disposition): DeploymentMapImage[] {
  const [x, y] = [dispositionSlug(a), dispositionSlug(b)].sort();
  const dir = `/deployment-maps/${x}-vs-${y}`;
  return [
    { layout: "A", src: `${dir}/a.webp` },
    { layout: "B", src: `${dir}/b.webp` },
    { layout: "C", src: `${dir}/c.webp` },
  ];
}
