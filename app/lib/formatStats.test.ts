import { test } from "node:test";
import assert from "node:assert/strict";
import { ordinal, fieldDetail } from "./formatStats.ts";

// Neither helper had a direct test while they lived in
// playerStatsPanel.tsx — they were only ever exercised through rendered
// markup. Both are pure, so they're cheap to pin down properly now that
// five call sites share them.

test("ordinal: the regular 1st/2nd/3rd/4th rule", () => {
  const cases: [number, string][] = [
    [1, "1st"], [2, "2nd"], [3, "3rd"], [4, "4th"], [5, "5th"],
    [21, "21st"], [22, "22nd"], [23, "23rd"], [24, "24th"],
    [101, "101st"], [102, "102nd"], [103, "103rd"],
  ];
  for (const [n, want] of cases) assert.equal(ordinal(n), want, `ordinal(${n})`);
});

test("ordinal: the 11/12/13 exception, including past 100", () => {
  for (const [n, want] of [[11, "11th"], [12, "12th"], [13, "13th"], [111, "111th"], [112, "112th"], [113, "113th"]] as [number, string][]) {
    assert.equal(ordinal(n), want, `ordinal(${n})`);
  }
});

test("ordinal: rounds a fractional placing (placingTrendChart interpolates)", () => {
  assert.equal(ordinal(2.4), "2nd");
  assert.equal(ordinal(2.6), "3rd");
  assert.equal(ordinal(10.5), "11th");
});

test("fieldDetail: field size and percentile", () => {
  assert.equal(fieldDetail({ placing: 2, fieldSize: 53 }), "of 53 · top 4%");
  assert.equal(fieldDetail({ placing: 1, fieldSize: 12 }), "of 12 · top 8%");
});

test("fieldDetail: last place is still top 100%, never over", () => {
  assert.equal(fieldDetail({ placing: 53, fieldSize: 53 }), "of 53 · top 100%");
});

test("fieldDetail: a win at a huge event floors at 1%, never 0%", () => {
  assert.equal(fieldDetail({ placing: 1, fieldSize: 265 }), "of 265 · top 1%");
});

test("fieldDetail: undefined when the event published no field size", () => {
  assert.equal(fieldDetail(undefined), undefined);
  assert.equal(fieldDetail({ placing: 3 }), undefined);
  assert.equal(fieldDetail({ placing: 3, fieldSize: 0 }), undefined);
});
