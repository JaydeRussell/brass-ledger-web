import { test } from "node:test";
import assert from "node:assert/strict";
import type { Dossier } from "./dossier.ts";

const { buildShareCardText } = await import("./shareCard.ts");

// renderShareCardCanvas/downloadShareCardImage need a real <canvas> and
// getComputedStyle — no DOM in this project's test setup (see
// app/lib/testUtils.ts) — verified live instead. buildShareCardText (the
// pure text logic those two actually draw/never differs by canvas
// support) is tested directly here, same split shareDossierButton.tsx's
// own buildShareText/ShareDossierButton already established.

function dossier(overrides: Partial<Dossier> = {}): Dossier {
  return {
    name: "Jayde Russell",
    linked: true,
    totalEvents: 33,
    factions: [],
    history: [],
    ...overrides,
  };
}

test("buildShareCardText leads with the best placing when one exists", () => {
  const { headline, subline } = buildShareCardText(
    dossier({ bestPlacing: { placing: 1, fieldSize: 10 } })
  );
  assert.equal(headline, "1st-place best finish");
  assert.equal(subline, "across 33 events");
});

test("buildShareCardText falls back to a plain event count with no best placing", () => {
  const { headline, subline } = buildShareCardText(dossier({ totalEvents: 1, bestPlacing: undefined }));
  assert.equal(headline, "No concluded events yet");
  assert.equal(subline, "1 event played");
});

test("buildShareCardText: ordinal suffixes (1st/2nd/3rd/4th, and the 11th-13th exception)", () => {
  const placingHeadline = (placing: number) =>
    buildShareCardText(dossier({ bestPlacing: { placing } })).headline;
  assert.equal(placingHeadline(1), "1st-place best finish");
  assert.equal(placingHeadline(2), "2nd-place best finish");
  assert.equal(placingHeadline(3), "3rd-place best finish");
  assert.equal(placingHeadline(4), "4th-place best finish");
  assert.equal(placingHeadline(11), "11th-place best finish");
  assert.equal(placingHeadline(12), "12th-place best finish");
  assert.equal(placingHeadline(13), "13th-place best finish");
  assert.equal(placingHeadline(21), "21st-place best finish");
});

test("buildShareCardText lists up to the top 3 factions", () => {
  const { factionLines } = buildShareCardText(
    dossier({
      factions: [
        { faction: "World Eaters", eventCount: 30 },
        { faction: "Necrons", eventCount: 2 },
        { faction: "Aeldari", eventCount: 1 },
        { faction: "Orks", eventCount: 1 },
      ],
    })
  );
  assert.deepEqual(factionLines, [
    "World Eaters — 30 events",
    "Necrons — 2 events",
    "Aeldari — 1 event",
  ]);
});
