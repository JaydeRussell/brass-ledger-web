import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import EventSettings from "./eventSettings.tsx";

// EventSettings keeps its dropdown-open state in useState, defaulting to
// closed — so a static SSR pass (the only rendering available without a
// DOM to click into; see app/lib/testUtils.ts) can only ever exercise the
// always-visible gear button, never the opened dropdown itself. That's a
// real gap versus a real click-through test; worth upgrading once
// jsdom/@testing-library/react are installable (see CLAUDE.md).

test("shows the event name on the gear button when known", () => {
  const html = renderToStaticMarkup(
    React.createElement(EventSettings, {
      eventId: "e1",
      eventName: "The Challengers Cup 2026",
      recentEvents: [],
      onChangeEvent: () => {},
    })
  );
  assert.match(html, /The Challengers Cup 2026/);
});

test("falls back to a loading label when the event name isn't known yet", () => {
  const html = renderToStaticMarkup(
    React.createElement(EventSettings, {
      eventId: "e1",
      recentEvents: [],
      onChangeEvent: () => {},
    })
  );
  assert.match(html, /Loading event…/);
});

test("the dropdown itself is closed on first render", () => {
  const html = renderToStaticMarkup(
    React.createElement(EventSettings, {
      eventId: "e1",
      eventName: "Event",
      recentEvents: [{ id: "e2", name: "Other Event", teamEvent: false, lastViewedAt: 0 }],
      onChangeEvent: () => {},
    })
  );
  assert.ok(!html.includes("BCP event URL or ID"));
  assert.ok(!html.includes("Other Event"));
});
