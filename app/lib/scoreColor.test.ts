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

// Table-driven: itcGradientStyle across the score range (below zero,
// zero, mid-range, the max, and above the max) in both light and dark
// mode — checking it always returns a valid rgb() string and a plausible
// text color, and that it never throws regardless of how extreme the
// input is.
test("itcGradientStyle", () => {
  const cases: { name: string; points: number; isDark: boolean }[] = [
    { name: "zero points, light mode", points: 0, isDark: false },
    { name: "zero points, dark mode", points: 0, isDark: true },
    { name: "mid-range points, light mode", points: 750, isDark: false },
    { name: "mid-range points, dark mode", points: 750, isDark: true },
    { name: "at the gradient ceiling, light mode", points: 1500, isDark: false },
    { name: "above the gradient ceiling clamps rather than erroring", points: 5000, isDark: false },
    { name: "negative points clamp rather than erroring", points: -100, isDark: false },
  ];

  const rgbPattern = /^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/;

  for (const tc of cases) {
    const style = itcGradientStyle(tc.points, tc.isDark);
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
  const withDefault = itcGradientStyle(750);
  const explicitLight = itcGradientStyle(750, false);
  assert.deepEqual(withDefault, explicitLight);
});
