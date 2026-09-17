import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";

// This component calls useState, so it's tested via renderStatic (SSR),
// not the walk/find hookless-interaction helpers — see testUtils.ts's
// doc comment. The toggle's actual click → fetch → state-change behavior
// (and its "saving"/disabled state, and error text after a failed save)
// is a stateful transition renderStatic can't simulate (no DOM, no
// effects) — verified live in a real browser instead, same caveat every
// other stateful-toggle test in this codebase carries.

const { default: DossierVisibilityToggle } = await import("./dossierVisibilityToggle.tsx");

test("shows the public-dossier state with a link to view it", () => {
  const html = renderStatic(
    React.createElement(DossierVisibilityToggle, { bcpUserId: "u1", dossierPublic: true, onChange: () => {} })
  );
  assert.match(html, /Public dossier/);
  assert.match(html, /Anyone with the link can see this/);
  assert.match(html, /href="\/dossier\/u1"/);
  assert.match(html, /aria-checked="true"/);
});

test("shows the private state with no link", () => {
  const html = renderStatic(
    React.createElement(DossierVisibilityToggle, { bcpUserId: "u1", dossierPublic: false, onChange: () => {} })
  );
  assert.match(html, /Hidden — only you can see this/);
  assert.ok(!html.includes("/dossier/u1"));
  assert.match(html, /aria-checked="false"/);
});

test("encodes a bcpUserId that needs URL-escaping in the view link", () => {
  const html = renderStatic(
    React.createElement(DossierVisibilityToggle, { bcpUserId: "u 1/x", dossierPublic: true, onChange: () => {} })
  );
  assert.match(html, /href="\/dossier\/u%201%2Fx"/);
});
