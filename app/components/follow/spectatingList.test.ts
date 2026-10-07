import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import SpectatingList from "./spectatingList.tsx";

const ev = (eventId: string, started: boolean, ended: boolean) => ({
  eventId, eventName: eventId, teamEvent: false, started, ended, playerId: "p1", playerName: "Olive", viaLink: false,
});

test("finished events sit under Recently finished, not Now", () => {
  const html = renderToStaticMarkup(
    React.createElement(SpectatingList, {
      spectating: { now: [ev("Live Cup", true, false), ev("Done Cup", true, true)], upcoming: [ev("Soon Cup", false, false)] },
      onRemove: () => {},
    })
  );
  const now = html.indexOf(">Now<"), upcoming = html.indexOf(">Upcoming<"), finished = html.indexOf(">Recently finished<");
  assert.ok(now >= 0 && upcoming > now && finished > upcoming);
  assert.ok(html.indexOf("Live Cup") < upcoming && html.indexOf("Done Cup") > finished);
});

test("an empty group shows no heading", () => {
  const html = renderToStaticMarkup(
    React.createElement(SpectatingList, { spectating: { now: [], upcoming: [ev("Soon Cup", false, false)] }, onRemove: () => {} })
  );
  assert.doesNotMatch(html, />Now<|>Recently finished</);
});
