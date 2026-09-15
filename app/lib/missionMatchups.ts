import type { Disposition } from "./dispositions";
import { dispositionSlug } from "./dispositions";

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
      "Take and Hold should keep moving — the Any Battle Round band only pays for objectives you didn't hold at the start of the turn, so parking on ground you already control earns nothing extra from it (the Round-2-onwards band still pays flat VP for everything you hold, new or not) — prioritize contesting new ground, especially on the opponent's side of the table.",
      "Disruption's big lever is terrain, not objectives directly — claim terrain areas early (especially ones that double as objectives) and use them to ambush anyone who parks a unit inside.",
      "Because Determined Acquisition rewards pushing into enemy territory, Disruption should expect pressure on its own side and keep answers there.",
    ],
  },
  {
    dispositions: ["Take and Hold", "Reconnaissance"],
    summary:
      "Take and Hold scores Purge and Secure, which needs kills specifically near objectives, not anywhere on the table. Reconnaissance scores Reconnaissance Sweep, which rewards spreading 3-4 units across different table quarters plus 1VP for every enemy unit killed anywhere on the table.",
    tactics: [
      "Take and Hold should pull fights onto objectives — a kill in the open scores nothing here, the same kill next to an objective does.",
      "Reconnaissance's spread requirement pulls against clumping up for one big alpha strike — plan deployment and movement with that spread in mind from turn one.",
      "Both sides also get real value from objective holding from Round 2 on, so don't let either mission's \"kill\" half fully distract from contesting objectives directly.",
    ],
  },
  {
    dispositions: ["Take and Hold", "Priority Assets"],
    summary:
      "Take and Hold scores Inescapable Dominion, a map-control grind whose own-territory majority bonus and its end-of-battle enemy-home-objective bonus are both worth about the same (4-5VP) — there's no one big finisher to build a plan around. Priority Assets scores Secure Asset, built around a reverse-side asset-securing action plus punishing kills near central objectives.",
    tactics: [
      "Take and Hold should still plan a late push at the opponent's home objective — 5VP at the very end is worth about as much as a full round's objective-count swing, so it's worth the detour even though it isn't a huge spike.",
      "Priority Assets should use the asset-securing action every round it can — it's VP independent of who's winning the objective fight.",
      "Inescapable Dominion rewards holding more objectives than your opponent from Round 2 on, while Secure Asset just cares about hitting its own objective-count thresholds (1+, then 3+) — different mechanics, but early skirmishing over the middle objectives still matters to both.",
    ],
  },
  {
    dispositions: ["Purge the Foe", "Purge the Foe"],
    summary:
      "A mirror: both of you play Meatgrinder — any kill scores, objective holding from Round 2 is a flat bonus, out-killing your own previous turn is a bonus, and the opponent's home objective is a big finisher.",
    tactics: [
      "The \"more kills than last turn\" band rewards escalating aggression, not constant grinding — pace commitments so each turn can outdo the last rather than spending everything on Round 2.",
      "Since both sides score identically, objective holding (4VP a round from Round 2 on) is just as reliable a VP source here as kills — don't fixate on the kill race and forget to actually sit on ground you can hold.",
      "The home-objective finisher is worth planning a dedicated push for once the kill race is close.",
    ],
  },
  {
    dispositions: ["Purge the Foe", "Disruption"],
    summary:
      "Purge the Foe scores Punishment, a targeted-kill mission — you only score for killing the specific 1-3 units you \"condemn\" that turn — with a huge 8VP home-objective finisher. Disruption scores Delaying Action, which pays for any kill plus holding a central and an expansion objective at once.",
    tactics: [
      "Purge the Foe should condemn units it has a real chance of killing soon — condemned status lasts from the start of your turn through the start of your next one, so a condemned unit that dies to overwatch or a counter-charge during your opponent's turn still scores; condemning something with no plausible route to death in either turn is what actually wastes the choice.",
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
      "Purge the Foe should kill within reach of an objective it can then stand near — consecration is checked at the end of the very same turn the kill happens, so positioning the killing unit by objectives before your turn ends is what scores it, not a separate follow-up turn.",
      "Triangulation's reward jumps sharply from two to three objectives (6VP to 10VP) — it's worth stretching to hit three at once rather than settling for two.",
      "Consecrating the enemy's own home objective is worth a flat 5VP, and — going by the card's \"has been consecrated\" phrasing — looks like a one-time achievement rather than something you need to still be holding at the final bell (worth double-checking against a physical card). It's not actually the mission's biggest number either way: 3+ objectives consecrated in a single turn pays 6VP and can repeat round after round, so don't chase the home-objective prize at the expense of the recurring one.",
    ],
  },
  {
    dispositions: ["Purge the Foe", "Priority Assets"],
    summary:
      "Purge the Foe scores Destroyer's Wrath, which pays extremely well (6VP) for simply holding more objectives than your opponent, on top of ordinary kill VP. Priority Assets scores Vital Link, which rewards building operation markers around central objectives and stacking objective-type bonuses toward a 10VP home-objective finisher.",
    tactics: [
      "Destroyer's Wrath's majority bonus (6VP) is the richest repeating, every-round reward in this matchup — prioritize objective count over chasing every kill. (Vital Link's 10VP home-objective finisher is bigger, but it only pays out once, at the end — see below.)",
      "Priority Assets should invest early in placing operation markers near central objectives — the bonus rewards setup over the course of the game, not one big turn.",
      "Priority Assets' home-objective finisher (10VP) is worth committing a mobile unit toward late, since Destroyer's Wrath has no equivalent single deep prize to race for.",
    ],
  },
  {
    dispositions: ["Disruption", "Disruption"],
    summary:
      "A mirror: both of you play Outmanoeuvre. Its real engine is 10VP at the end of every single one of your turns you control the enemy's home objective — not a one-time bonus — on top of an escalating reward for holding your own other objectives (4/5/6VP as the game goes on).",
    tactics: [
      "The per-objective reward escalates round over round, so the same held objective is worth more late than early — don't trade units to hold ground in Round 1 you can't keep past Round 3.",
      "Controlling the enemy's home objective pays 10VP at the end of every one of your turns you hold it, not just once — seize it by Round 2 and hold it through Round 5 and that's potentially 40VP, dwarfing everything else in the mission. Racing for it and then holding it is very likely the dominant play in this mirror.",
      "Because that 10VP is checked every turn, losing the enemy home objective even briefly costs you that turn's VP and hands your opponent the same shot at it — commit real defensive resources to holding it once you have it, not just enough to take it.",
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
      "Disruption's own mission rewards it too for getting down to exactly one surviving marker, as long as a Disruption unit — not an enemy one — is holding that terrain area, so this isn't simply \"markers lost = bad for Disruption.\" It's a race to be the side standing on the last marker's terrain when the dust settles; defend whichever marker you can most realistically hold to the end rather than spreading defense evenly across all five.",
      "Priority Assets should identify which of Disruption's markers is easiest to isolate and contest that one specifically, rather than spreading pressure evenly across all five.",
      "Both sides also score for kills near objectives specifically — not the marker-holding terrain areas, which sit outside deployment zones and aren't necessarily objectives at all — so don't assume defending a marker's ground also covers this bonus, or neglect the real objectives while doing it.",
    ],
  },
  {
    dispositions: ["Reconnaissance", "Reconnaissance"],
    summary:
      "A mirror: both of you play Gather Intel — a strong Round-1 rush for the centre, then the mission's real engine kicks in: a repeatable, 7VP-per-unit reverse-side \"extracted intelligence\" action available every round from Round 2 on, with a smaller bonus for operation-marker count and placement at the very end.",
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
      "The deep bonus only needs the sabotaging unit within range of an objective in your opponent's territory — their half of the board, not specifically their deployment zone — and it's cumulative per unit, so sending several cheap, expendable units to do it outscores committing everything to one push.",
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
