// Pure display/formatting helpers for color-coding already-published
// numbers — round scores and ITC rankings. Nothing here decides, ranks, or
// suggests anything; it only picks a color for a result BCP already
// published, which is a presentation concern, not a pairing computation
// (see the scope note in lib/bcp.ts).

// --- Round score outcome (5-way) -------------------------------------------

export type ScoreOutcome = "loss" | "closeLoss" | "draw" | "closeWin" | "win";

// How close a decided game counts as "close" rather than a plain win/loss:
// the two scores' difference, as a fraction of their combined total, has
// to be within this to count as close. E.g. 55–45 (a difference of 10 out
// of 100 combined) is close; 65–35 isn't. Using a fraction of the combined
// total (rather than a fixed point gap) keeps this meaningful across
// different scoring scales (a 100-point primary+secondary score, a
// smaller-scale format, etc.) without needing to know which one it is.
const CLOSE_MARGIN_FRACTION = 0.1;

/**
 * Classifies a decided game's result from `reference`'s point of view —
 * pass (myScore, opponentScore) for a "my pairings" row, or
 * (side1Score, side2Score) for a generic board row with no particular
 * side singled out. A draw is always a draw regardless of which side is
 * "reference".
 */
export function classifyScore(reference: number, other: number): ScoreOutcome {
  if (reference === other) return "draw";
  const diff = Math.abs(reference - other);
  const total = reference + other;
  const isClose = total > 0 && diff / total <= CLOSE_MARGIN_FRACTION;
  if (reference > other) return isClose ? "closeWin" : "win";
  return isClose ? "closeLoss" : "loss";
}

// A red (loss) -> orange -> amber (draw) -> lime -> green (win) spectrum.
// The two ends are this app's real semantic danger/success tokens (see
// globals.css) rather than raw Tailwind colors, matching every other
// win/loss-adjacent state in the redesign; the two "close" steps and the
// draw stay literal orange/lime/amber Tailwind classes deliberately — see
// globals.css's token comment: this is one-off five-way score grading, not
// a themed UI surface, so it doesn't need its own token family.
export const SCORE_OUTCOME_CLASSES: Record<ScoreOutcome, string> = {
  loss: "text-danger-600 dark:text-danger-400",
  closeLoss: "text-orange-600 dark:text-orange-400",
  draw: "text-amber-600 dark:text-amber-400",
  closeWin: "text-lime-600 dark:text-lime-400",
  win: "text-success-600 dark:text-success-400",
};

// --- ITC ranking gradient ---------------------------------------------------

// Rough normalization ceiling for BCP's ITC points. There's no cheap way
// to know the true current maximum across the whole leaderboard — that
// would mean pulling the full multi-thousand-row list, which this app
// deliberately avoids (see the ITC ranking section in lib/bcp.ts) — so
// this is a fixed "about as good as it currently gets" ceiling. Anything
// at or above it clamps to the same solid red rather than erroring or
// going off-scale. Kept deliberately modest (rather than a generous,
// rarely-reached number) so the gradient actually spreads out across the
// scores you'll typically see, instead of everyone clustering pale near
// the low end. Adjust this single number if the gradient stops feeling
// right for the ranking pool you're looking at.
const ITC_GRADIENT_MAX_POINTS = 1500;

// White (low score / weak ranking) through yellow and orange to red (high
// score / strong ranking). Four stops rather than a straight two-color
// blend so intermediate scores land on visually distinct colors instead of
// all reading as similar pale pink.
const LIGHT_GRADIENT_STOPS = [
  { r: 255, g: 255, b: 255 }, // white
  { r: 250, g: 204, b: 21 }, // yellow-400
  { r: 249, g: 115, b: 22 }, // orange-500
  { r: 220, g: 38, b: 38 }, // red-600
];

// A dimmer counterpart for dark mode — starting the gradient at pure white
// reads as glaring against a charcoal card, so this starts from a mid gray
// instead and uses somewhat deeper yellow/orange/red, while keeping the
// same "weak to strong" direction. Kept fairly vivid/high-saturation
// rather than dark-and-muted throughout: blending a gray straight into a
// dull, low-saturation yellow/orange lands on a muddy brown in the middle
// of the ramp — staying vivid avoids that "mud" zone.
const DARK_GRADIENT_STOPS = [
  { r: 101, g: 105, b: 112 }, // globals.css's --text-tertiary (dark mode), converted from oklch(0.52 0.012 260) — a real token from this app's own palette rather than an arbitrary gray, chosen because it lands at nearly the same lightness as the zinc-500 this replaced. surface-2/surface-border were tried first and rejected: they compile to (36,39,42)/(50,54,59), too dark to read as "weak" rather than "blends into the card"; brass-900 was rejected too — it's already reddish, which would undercut the ramp's own "weak to strong, ending in red" direction right at its starting point.
  { r: 245, g: 158, b: 11 }, // amber-500
  { r: 234, g: 88, b: 12 }, // orange-600
  { r: 185, g: 28, b: 28 }, // red-700
];

function interpolateGradient(
  stops: { r: number; g: number; b: number }[],
  t: number
): { r: number; g: number; b: number } {
  const clamped = Math.min(1, Math.max(0, t));
  const segments = stops.length - 1;
  const scaled = clamped * segments;
  const index = Math.min(segments - 1, Math.floor(scaled));
  const localT = scaled - index;
  const a = stops[index];
  const b = stops[index + 1];
  return {
    r: Math.round(a.r + (b.r - a.r) * localT),
    g: Math.round(a.g + (b.g - a.g) * localT),
    b: Math.round(a.b + (b.b - a.b) * localT),
  };
}

/**
 * A white-through-yellow-and-orange-to-red background/text pair for one
 * ITC points value, scaled against ITC_GRADIENT_MAX_POINTS. Pass
 * `isDark` (the viewer's actual color scheme, not just a vibe) to use the
 * darker, dark-mode-appropriate version of the same gradient. The text
 * color flips from dark to light partway through so the label stays
 * readable as the background darkens.
 */
export function itcGradientStyle(
  points: number,
  isDark = false
): { backgroundColor: string; color: string } {
  const stops = isDark ? DARK_GRADIENT_STOPS : LIGHT_GRADIENT_STOPS;
  const { r, g, b } = interpolateGradient(stops, points / ITC_GRADIENT_MAX_POINTS);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return {
    backgroundColor: `rgb(${r}, ${g}, ${b})`,
    color: luminance > 0.6 ? "#27272a" /* zinc-800 */ : "#fafafa" /* zinc-50 */,
  };
}
