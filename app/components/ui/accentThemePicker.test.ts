import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import AccentThemePicker from "./accentThemePicker.tsx";
import { renderStatic } from "../../lib/testUtils.ts";
import { ACCENT_THEMES } from "../../lib/theme.ts";

// AccentThemePicker uses useAccentTheme() internally (a hook), so it
// can't be walked as a plain function; rendered via renderStatic (real
// SSR) instead. SSR always sees the hook's initial
// "brass" accent (no localStorage to read on the server) and the
// picker's own `expanded` state starting false, so this only covers the
// initial collapsed render — expanding the grid and picking a swatch is
// a stateful transition this project's hookless test helpers can't
// simulate, so (like an actual theme switch) that's verified live in a
// real browser instead.

test("AccentThemePicker renders collapsed, showing only the active theme", () => {
  const html = renderStatic(React.createElement(AccentThemePicker));
  const buttons = html.split("<button").slice(1);
  assert.equal(buttons.length, 1);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, />Brass</);
});

test("AccentThemePicker's collapsed row doesn't leak the other 11 theme labels", () => {
  const html = renderStatic(React.createElement(AccentThemePicker));
  for (const option of ACCENT_THEMES) {
    if (option.value === "brass") continue;
    // renderToStaticMarkup HTML-escapes apostrophes (T'au Cyan) as &#x27;.
    const escapedLabel = option.label.replace(/'/g, "&#x27;");
    assert.doesNotMatch(html, new RegExp(`>${escapedLabel}<`));
  }
});
