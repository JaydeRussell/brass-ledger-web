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

// Rough normalization ceiling for BCP's ITC points — only used as a
// fallback for the rare ranking that carries points but no placing (see
// rankingStrength below). There's no cheap way to know the true current
// maximum across the whole leaderboard — that would mean pulling the
// full multi-thousand-row list, which this app deliberately avoids (see
// the ITC ranking section in lib/bcp.ts) — so this is a fixed "about as
// good as it currently gets" ceiling.
const ITC_GRADIENT_MAX_POINTS = 1500;

// Rough normalization floor for a BCP placing (rank) — same idea as
// ITC_GRADIENT_MAX_POINTS above but for rankingStrength's preferred,
// placing-based path: there's no cheap way to know how large the whole
// leaderboard actually is, so this is a fixed "about as deep as a real
// field realistically goes" floor. A placing at or beyond it clamps to
// the weakest end of the ramp rather than continuing to fade forever.
const ITC_GRADIENT_PLACING_FLOOR = 10000;

/**
 * Maps one ranking to a 0 (weakest) .. 1 (strongest) "strength" — the
 * single number both itcGradientStyle and its viewer-relative remap (see
 * relativeToViewer below) actually work in. Prefers `placing` over
 * `points` whenever it's known, and needs its own nonlinear (log) curve
 * to do it: raw points cluster tightly in practice (a typical field
 * mostly sits within a few hundred points of each other), so a plain
 * points/ceiling ratio barely moves across a whole roster — not much
 * variance to color by. `placing` doesn't have that problem, but a
 * straight linear rank/ceiling ratio would just trade one flat scale for
 * another: it's the *ratio* between two placings that reflects a real
 * skill gap, not their raw difference. #100 vs #400 (a 4x ratio) is a
 * massive gap; #6,700 vs #7,000 (a ~1.04x ratio) is noise, even though
 * both are 300 ranks apart. A log scale captures exactly that — equal
 * *ratios* end up equally far apart on the 0..1 scale, however far apart
 * the raw rank numbers are.
 */
function rankingStrength(ranking: { points: number; placing?: number }): number {
  if (ranking.placing && ranking.placing > 0) {
    const t = 1 - Math.log(ranking.placing) / Math.log(ITC_GRADIENT_PLACING_FLOOR);
    return Math.min(1, Math.max(0, t));
  }
  return Math.min(1, Math.max(0, ranking.points / ITC_GRADIENT_MAX_POINTS));
}

/**
 * Reshapes a strength value (see rankingStrength above) around the
 * signed-in viewer's own strength instead of the fixed 0..1 scale:
 * `viewerStrength` becomes the ramp's exact midpoint, everything weaker
 * than the viewer fills the lower half, everything stronger fills the
 * upper half. That way a player only slightly stronger or weaker than
 * the viewer still shows a visibly different color regardless of how
 * strong the field around them is overall — "would probably beat me"
 * always leans toward the danger end and "I'd probably beat them" always
 * leans toward the neutral end, whether this is an elite pod or a
 * beginner one.
 */
function relativeToViewer(strength: number, viewerStrength: number): number {
  if (strength <= viewerStrength) {
    return viewerStrength <= 0 ? 0.5 : 0.5 * (strength / viewerStrength);
  }
  return viewerStrength >= 1 ? 0.5 : 0.5 + (0.5 * (strength - viewerStrength)) / (1 - viewerStrength);
}

type OklchStop = { l: number; c: number; h: number };

// A full blue -> green -> yellow -> orange -> red spectrum — a wider
// spread of hues than this file's earlier neutral-to-brass ramp, closer
// to the kind of "matchup difficulty" color scale a lot of competitive
// games converge on independently (cool = weak/underdog, hot = strong/
// favored), and picked over the earlier version specifically for more
// perceptual contrast between adjacent ranks. Reuses this app's own
// success/warning/brass/danger tokens for the green/yellow/orange/red
// legs (straight from globals.css's :root/.dark blocks, not RGB
// approximations of them) and adds one new blue anchor at the weak end
// for the one hue this app's palette didn't already have. Interpolated in
// OKLCH space itself (see interpolateGradient below) rather than plain
// RGB: a straight RGB blend between hues this different crosses a
// desaturated, muddy zone in between, since RGB interpolation isn't
// perceptually uniform the way OKLCH's own L/C/H axes are. Doing the
// blend in OKLCH sidesteps that entirely — every intermediate step stays
// as saturated as its neighbors.
const LIGHT_GRADIENT_STOPS: OklchStop[] = [
  { l: 0.6, c: 0.18, h: 250 }, // blue — weakest
  { l: 0.65, c: 0.17, h: 150 }, // success-500
  { l: 0.75, c: 0.16, h: 85 }, // warning-500
  { l: 0.58, c: 0.13, h: 72 }, // brass-600
  { l: 0.55, c: 0.2, h: 15 }, // danger-600 — strongest
];

// The same ramp, shifted to the lighter *-400/*-500 token steps dark mode
// already reaches for elsewhere (see ui/badge.tsx's tone classes: light
// mode text is `*-600`, dark mode text is `*-400`) so each stop stays
// vivid against a charcoal card instead of reading dark-and-muted.
const DARK_GRADIENT_STOPS: OklchStop[] = [
  { l: 0.7, c: 0.15, h: 250 }, // blue — weakest
  { l: 0.75, c: 0.15, h: 150 }, // success-400
  { l: 0.75, c: 0.16, h: 85 }, // warning-500
  { l: 0.68, c: 0.13, h: 75 }, // brass-500
  { l: 0.63, c: 0.21, h: 15 }, // danger-500 — strongest
];

// Standard OKLab -> linear sRGB -> gamma-encoded sRGB conversion (Björn
// Ottosson's oklab reference matrices) — the one piece of math this file
// needs to turn an interpolated (L, C, H) back into a color a browser can
// actually paint, since an inline style can't hand the DOM an oklch()
// string the way a stylesheet's `var(--brass-600)` can.
function oklchToSrgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  const rLinear = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLinear = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLinear = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  const gammaEncode = (channel: number) => {
    const clamped = Math.min(1, Math.max(0, channel));
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  return {
    r: Math.round(gammaEncode(rLinear) * 255),
    g: Math.round(gammaEncode(gLinear) * 255),
    b: Math.round(gammaEncode(bLinear) * 255),
  };
}

function interpolateGradient(stops: OklchStop[], t: number): { r: number; g: number; b: number } {
  const clamped = Math.min(1, Math.max(0, t));
  const segments = stops.length - 1;
  const scaled = clamped * segments;
  const index = Math.min(segments - 1, Math.floor(scaled));
  const localT = scaled - index;
  const a = stops[index];
  const b = stops[index + 1];
  return oklchToSrgb(
    a.l + (b.l - a.l) * localT,
    a.c + (b.c - a.c) * localT,
    a.h + (b.h - a.h) * localT
  );
}

/**
 * A blue-through-green-and-yellow-and-orange-to-red background/text pair
 * for one ITC ranking (see LIGHT_GRADIENT_STOPS and rankingStrength
 * above). Pass `isDark` (the viewer's actual color scheme, not just a
 * vibe) to use the dark-mode-appropriate version of the same gradient.
 *
 * Pass `viewerRanking` — the signed-in visitor's own ranking in this same
 * league, when one's known — to color `ranking` *relative to them*
 * instead of on the fixed absolute scale (see relativeToViewer above).
 * Omit it (or pass null/undefined — the "not signed in", "no linked BCP
 * profile", and "not this league" cases all collapse to the same thing)
 * to fall back to today's plain absolute scale.
 *
 * The text color flips from dark to light partway through so the label
 * stays readable as the background darkens.
 */
export function itcGradientStyle(
  ranking: { points: number; placing?: number },
  isDark = false,
  viewerRanking?: { points: number; placing?: number } | null
): { backgroundColor: string; color: string } {
  const stops = isDark ? DARK_GRADIENT_STOPS : LIGHT_GRADIENT_STOPS;
  const strength = rankingStrength(ranking);
  const t = viewerRanking ? relativeToViewer(strength, rankingStrength(viewerRanking)) : strength;
  const { r, g, b } = interpolateGradient(stops, t);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return {
    backgroundColor: `rgb(${r}, ${g}, ${b})`,
    color: luminance > 0.6 ? "#27272a" /* zinc-800 */ : "#fafafa" /* zinc-50 */,
  };
}
