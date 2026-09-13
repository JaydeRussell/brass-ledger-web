import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyScore, itcGradientStyle, SCORE_OUTCOME_CLASSES } from "./scoreColor.ts";
import type { ScoreOutcome } from "./scoreColor.ts";

// Table-driven: every branch of classifyScore (draw / win / close win /
// loss / close loss) plus the edge cases that make "close" tricky —
// zero-zero (no division by zero), and margins right at the 10% boundary.
test("classifyScore", () => {
  const cases: { name: string; reference: number; other: number; want: ScoreOutcome }[] = [
    { name: "equal scores are always a draw", reference: 50, other: 50, want: "draw" },
    { name: "zero-zero is a draw, not a division-by-zero crash", reference: 0, other: 0, want: "draw" },
    { name: "a big win is a plain win", reference: 90, other: 10, want: "win" },
    { name: "a big loss is a plain loss", reference: 10, other: 90, want: "loss" },
    { name: "a narrow win (within 10% of combined) is a close win", reference: 55, other: 45, want: "closeWin" },
    { name: "a narrow loss (within 10% of combined) is a close loss", reference: 45, other: 55, want: "closeLoss" },
    // 65-35: diff 30 / total 100 = 0.3, well outside the 0.1 threshold.
    { name: "a win just outside the close margin is a plain win", reference: 65, other: 35, want: "win" },
    { name: "a loss just outside the close margin is a plain loss", reference: 35, other: 65, want: "loss" },
    // 55-45: diff 10 / total 100 = 0.10 exactly — the <= boundary counts as close.
    { name: "exactly at the close-margin boundary counts as close", reference: 55, other: 45, want: "closeWin" },
  ];

  for (const tc of cases) {
    const got = classifyScore(tc.reference, tc.other);
    assert.equal(got, tc.want, `${tc.name}: classifyScore(${tc.reference}, ${tc.other}) = ${got}, want ${tc.want}`);
  }
});

test("SCORE_OUTCOME_CLASSES has a class for every ScoreOutcome classifyScore can produce", () => {
  const outcomes: ScoreOutcome[] = ["loss", "closeLoss", "draw", "closeWin", "win"];
  for (const outcome of outcomes) {
    assert.ok(
      typeof SCORE_OUTCOME_CLASSES[outcome] === "string" && SCORE_OUTCOME_CLASSES[outcome].length > 0,
      `SCORE_OUTCOME_CLASSES is missing a non-empty entry for ${outcome}`
    );
  }
});

// Table-driven: itcGradientStyle across the ranking range (below zero,
// zero, mid-range, the max, and above the max — both by points and by
// placing) in both light and dark mode — checking it always returns a
// valid rgb() string and a plausible text color, and that it never throws
// regardless of how extreme the input is.
test("itcGradientStyle", () => {
  const cases: { name: string; ranking: { points: number; placing?: number }; isDark: boolean }[] = [
    { name: "zero points, no placing, light mode", ranking: { points: 0 }, isDark: false },
    { name: "zero points, no placing, dark mode", ranking: { points: 0 }, isDark: true },
    { name: "mid-range points, no placing, light mode", ranking: { points: 750 }, isDark: false },
    { name: "mid-range points, no placing, dark mode", ranking: { points: 750 }, isDark: true },
    { name: "at the points ceiling, no placing, light mode", ranking: { points: 1500 }, isDark: false },
    { name: "above the points ceiling clamps rather than erroring", ranking: { points: 5000 }, isDark: false },
    { name: "negative points clamp rather than erroring", ranking: { points: -100 }, isDark: false },
    { name: "rank 1 (best possible), light mode", ranking: { points: 2000, placing: 1 }, isDark: false },
    { name: "rank 1 (best possible), dark mode", ranking: { points: 2000, placing: 1 }, isDark: true },
    { name: "mid-pack rank, light mode", ranking: { points: 900, placing: 500 }, isDark: false },
    { name: "deep in the field, light mode", ranking: { points: 300, placing: 9000 }, isDark: false },
    { name: "beyond the placing floor clamps rather than erroring", ranking: { points: 100, placing: 50000 }, isDark: false },
  ];

  const rgbPattern = /^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/;

  for (const tc of cases) {
    const style = itcGradientStyle(tc.ranking, tc.isDark);
    assert.match(
      style.backgroundColor,
      rgbPattern,
      `${tc.name}: backgroundColor ${style.backgroundColor} isn't a valid rgb() string`
    );
    assert.ok(
      style.color === "#27272a" || style.color === "#fafafa",
      `${tc.name}: color ${style.color} isn't one of the two expected text colors`
    );
  }
});

test("itcGradientStyle defaults to light mode when isDark is omitted", () => {
  const withDefault = itcGradientStyle({ points: 750 });
  const explicitLight = itcGradientStyle({ points: 750 }, false);
  assert.deepEqual(withDefault, explicitLight);
});

// Parses "rgb(r, g, b)" back into numbers so a test can reason about how
// far apart two colors actually are, rather than just that they're both
// valid-looking strings.
function parseRgb(rgb: string): [number, number, number] {
  const match = rgb.match(/rgb\((\d+), (\d+), (\d+)\)/);
  if (!match) throw new Error(`not an rgb() string: ${rgb}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = parseRgb(a);
  const [r2, g2, b2] = parseRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// The whole point of preferring `placing` over `points`: BCP points
// cluster tightly (a realistic roster might all sit within a couple
// hundred points of each other), so two rankings a fixed points-apart
// barely differ in color, but the same two rankings expressed as
// placings a proportionally similar distance apart should look
// noticeably more different — there's more variance to work with.
test("placing-based rankings spread out more than points-only ones across a realistic field", () => {
  const pointsOnlyGap = colorDistance(
    itcGradientStyle({ points: 1000 }).backgroundColor,
    itcGradientStyle({ points: 1100 }).backgroundColor
  );
  const placingGap = colorDistance(
    itcGradientStyle({ points: 1000, placing: 300 }).backgroundColor,
    itcGradientStyle({ points: 1100, placing: 200 }).backgroundColor
  );
  assert.ok(
    placingGap > pointsOnlyGap,
    `expected placing-based rankings to spread out more (${placingGap}) than points-only ones (${pointsOnlyGap})`
  );
});

// The actual "rank 100 vs 400 is a big gap, rank 6,000 vs 7,000 isn't"
// requirement: equal-sized *rank* gaps near the top of the field should
// produce a much bigger color difference than the same size gap deep in
// the field, because it's the ratio between two placings that matters.
test("placing differences matter far more near rank 1 than deep in the field", () => {
  const eliteGap = colorDistance(
    itcGradientStyle({ points: 1200, placing: 100 }).backgroundColor,
    itcGradientStyle({ points: 1150, placing: 400 }).backgroundColor
  );
  const deepFieldGap = colorDistance(
    itcGradientStyle({ points: 600, placing: 6700 }).backgroundColor,
    itcGradientStyle({ points: 590, placing: 7000 }).backgroundColor
  );
  assert.ok(
    eliteGap > deepFieldGap * 5,
    `expected the elite gap (${eliteGap}) to dwarf the deep-field gap (${deepFieldGap}) for the same 300-rank spread`
  );
});

// itcGradientStyle's third argument: a ranking should read as roughly
// neutral (the ramp's midpoint) when it's compared against a viewer with
// the same strength, "danger"-ward when it's stronger than the viewer,
// and toward the weak end when it's weaker than the viewer — regardless
// of where either one sits on the fixed absolute scale.
test("itcGradientStyle colors relative to a given viewerRanking instead of the absolute scale", () => {
  const viewer = { points: 1000, placing: 500 };
  const sameAsViewer = itcGradientStyle(viewer, false, viewer).backgroundColor;
  const strongerThanViewer = itcGradientStyle({ points: 1400, placing: 50 }, false, viewer).backgroundColor;
  const weakerThanViewer = itcGradientStyle({ points: 500, placing: 5000 }, false, viewer).backgroundColor;

  // A far-stronger opponent should sit closer to the absolute "elite" end
  // of the scale than someone merely at parity with the viewer does.
  const eliteAbsolute = itcGradientStyle({ points: 1500, placing: 1 }, false).backgroundColor;
  assert.ok(
    colorDistance(strongerThanViewer, eliteAbsolute) < colorDistance(sameAsViewer, eliteAbsolute),
    "a much stronger opponent should read closer to the elite end than someone at parity with the viewer"
  );

  // A far-weaker opponent should sit closer to the absolute weakest end
  // than someone at parity with the viewer does.
  const weakestAbsolute = itcGradientStyle({ points: 0 }, false).backgroundColor;
  assert.ok(
    colorDistance(weakerThanViewer, weakestAbsolute) < colorDistance(sameAsViewer, weakestAbsolute),
    "a much weaker opponent should read closer to the weakest end than someone at parity with the viewer"
  );

  // Parity with the viewer shouldn't itself land at either extreme.
  assert.ok(
    colorDistance(sameAsViewer, eliteAbsolute) > 10 && colorDistance(sameAsViewer, weakestAbsolute) > 10,
    "someone at parity with the viewer shouldn't read as either extreme"
  );
});

test("itcGradientStyle ignores a null/undefined viewerRanking and falls back to the absolute scale", () => {
  const ranking = { points: 1000, placing: 500 };
  const withNull = itcGradientStyle(ranking, false, null);
  const withUndefined = itcGradientStyle(ranking, false, undefined);
  const withOmitted = itcGradientStyle(ranking, false);
  assert.deepEqual(withNull, withOmitted);
  assert.deepEqual(withUndefined, withOmitted);
});
