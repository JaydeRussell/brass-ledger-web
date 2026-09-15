import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import AccentThemePicker from "./accentThemePicker.tsx";
import { renderStatic } from "../../lib/testUtils.ts";
import { ACCENT_THEMES } from "../../lib/theme.ts";

// AccentThemePicker uses useAccentTheme() internally (a hook), so — like
// ThemeToggle — it can't be walked as a plain function; rendered via
// renderStatic (real SSR) instead. SSR always sees the hook's initial
// "brass" state (no localStorage to read on the server, and effects don't
// run during SSR), so this only covers the initial render, not an actual
// click switching themes — that's verified live in a real browser.

test("AccentThemePicker renders one radio per accent theme", () => {
  const html = renderStatic(React.createElement(AccentThemePicker));
  const buttons = html.split("<button").slice(1);
  assert.equal(buttons.length, ACCENT_THEMES.length);
  for (const option of ACCENT_THEMES) {
    // renderToStaticMarkup HTML-escapes apostrophes (T'au Cyan) as &#x27;.
    const escapedLabel = option.label.replace(/'/g, "&#x27;");
    assert.match(html, new RegExp(`>${escapedLabel}<`));
  }
});

test("AccentThemePicker marks only brass as checked on initial (server) render", () => {
  const html = renderStatic(React.createElement(AccentThemePicker));
  const buttons = html.split("<button").slice(1);
  const brassButton = buttons.find((b) => b.includes(">Brass<"));
  const otherButtons = buttons.filter((b) => !b.includes(">Brass<"));
  assert.equal(otherButtons.length, ACCENT_THEMES.length - 1);
  assert.ok(brassButton?.includes('aria-checked="true"'));
  otherButtons.forEach((b) => assert.ok(b.includes('aria-checked="false"')));
});
