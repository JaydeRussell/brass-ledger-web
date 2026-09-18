import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";
import type { Dossier } from "../../lib/dossier.ts";
import { ToastProvider } from "../shared/toastContext.tsx";

// This component calls useState (for the "Copied!" feedback), so it's
// tested via renderStatic (SSR), not the walk/find hookless-interaction
// helpers — see testUtils.ts's doc comment. The actual click →
// navigator.clipboard.writeText → "Copied!" transition is a stateful
// change renderStatic can't simulate (no DOM, no effects, and no real
// clipboard API in this test environment either) — verified live in a
// real browser instead, same caveat every other stateful-button test in
// this codebase carries. buildShareText (the pure text-building logic
// this button actually calls) is tested directly below instead, which
// covers the part most likely to have a real bug.

const { default: ShareDossierButton, buildShareText } = await import("./shareDossierButton.tsx");

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

test("buildShareText leads with the best placing when one exists", () => {
  const text = buildShareText(
    dossier({ bestPlacing: { placing: 1, fieldSize: 10 }, factions: [{ faction: "World Eaters", eventCount: 30 }] }),
    "https://example.invalid/dossier/u1"
  );
  assert.equal(
    text,
    "Jayde Russell — 1st-place best finish across 33 events playing World Eaters. https://example.invalid/dossier/u1"
  );
});

test("buildShareText falls back to a plain event count with no best placing or faction", () => {
  const text = buildShareText(dossier({ totalEvents: 1 }), "https://example.invalid/dossier/u1");
  assert.equal(text, "Jayde Russell — 1 event played. https://example.invalid/dossier/u1");
});

test("shows the initial Share label", () => {
  const html = renderStatic(
    React.createElement(
      ToastProvider,
      null,
      React.createElement(ShareDossierButton, { dossier: dossier(), bcpUserId: "u1" })
    )
  );
  assert.match(html, />Share</);
  assert.match(html, />Save image</);
  assert.ok(!html.includes("Copied!"));
});
