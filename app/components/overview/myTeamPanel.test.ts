import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MyTeamPanel from "./myTeamPanel.tsx";
import type { MyPairing } from "../../lib/bcp.ts";

function player(overrides: Partial<Player> = {}): Player {
  return { id: "p1", name: "Teammate One", faction: "Necrons", homeClub: "Thundercluckers", ...overrides };
}

test("renders nothing when there are no teammates", () => {
  const html = renderToStaticMarkup(React.createElement(MyTeamPanel, { teammates: [] }));
  assert.equal(html, "");
});

test("shows the shared club name in the header", () => {
  const html = renderToStaticMarkup(
    React.createElement(MyTeamPanel, {
      teammates: [{ player: player(), pairings: [], loading: false, error: null }],
    })
  );
  assert.match(html, /Thundercluckers players at this event/);
});

test("shows a loading skeleton for a teammate whose pairings haven't resolved yet", () => {
  const html = renderToStaticMarkup(
    React.createElement(MyTeamPanel, {
      teammates: [{ player: player(), pairings: [], loading: true, error: null }],
    })
  );
  assert.doesNotMatch(html, /Not published yet/);
});

test("shows an error message for a teammate whose pairings failed to load", () => {
  const html = renderToStaticMarkup(
    React.createElement(MyTeamPanel, {
      teammates: [{ player: player(), pairings: [], loading: false, error: "boom" }],
    })
  );
  assert.match(html, /Couldn&#x27;t load pairings: boom/);
});

test("shows the latest round's opponent/table and the full round-score-strip record", () => {
  const pairings: MyPairing[] = [
    { round: 1, published: true, isDone: true, opponentName: "Old Foe", table: 2, myScore: 40, opponentScore: 60 },
    { round: 2, published: true, isDone: true, opponentName: "Rival", table: 7, myScore: 90, opponentScore: 10 },
  ];
  const html = renderToStaticMarkup(
    React.createElement(MyTeamPanel, {
      teammates: [{ player: player(), pairings, loading: false, error: null }],
    })
  );
  assert.match(html, /Teammate One/);
  assert.match(html, /vs Rival/);
  assert.match(html, /Table 7/);
  // The summary line's score slot is the full record strip (both rounds'
  // own scores), not just the latest round's score pair.
  assert.match(html, />40</);
  assert.match(html, />90</);
  // The earlier round is tucked behind the disclosure, not in the summary line.
  assert.match(html, /1 earlier round/);
});

test("shows a \"#N\" placing badge next to the name when a placing is known", () => {
  const html = renderToStaticMarkup(
    React.createElement(MyTeamPanel, {
      teammates: [{ player: player(), pairings: [], loading: false, error: null, placing: 4 }],
    })
  );
  assert.match(html, />#4</);
});

test("omits the placing badge when no placing is known yet", () => {
  const html = renderToStaticMarkup(
    React.createElement(MyTeamPanel, {
      teammates: [{ player: player(), pairings: [], loading: false, error: null }],
    })
  );
  assert.ok(!html.includes("#"));
});

test("shows \"Not published yet\" when no round has been published", () => {
  const html = renderToStaticMarkup(
    React.createElement(MyTeamPanel, {
      teammates: [{ player: player(), pairings: [], loading: false, error: null }],
    })
  );
  assert.match(html, /Not published yet/);
});

test("resolves the opponent's disposition from the roster, but not their faction or a list link", () => {
  const pairings: MyPairing[] = [
    { round: 1, published: true, isDone: false, opponentName: "Rival", opponentUserId: "u-rival" },
  ];
  const players: Player[] = [
    {
      id: "p2",
      name: "Rival",
      faction: "Orks",
      disposition: "Purge the Foe",
      list: "https://example.com/list.pdf",
      bcpUserId: "u-rival",
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(MyTeamPanel, {
      teammates: [{ player: player(), pairings, loading: false, error: null }],
      players,
    })
  );
  assert.match(html, />Purge</);
  assert.ok(!html.includes("(Orks)"));
  assert.ok(!html.includes("list.pdf"));
});

test("sorts by placing, best first, with an unplaced teammate last", () => {
  const html = renderToStaticMarkup(
    React.createElement(MyTeamPanel, {
      teammates: [
        { player: player({ id: "p1", name: "Unplaced" }), pairings: [], loading: false, error: null },
        { player: player({ id: "p2", name: "Third Place" }), pairings: [], loading: false, error: null, placing: 3 },
        { player: player({ id: "p3", name: "First Place" }), pairings: [], loading: false, error: null, placing: 1 },
      ],
    })
  );
  const order = ["First Place", "Third Place", "Unplaced"];
  let lastIndex = -1;
  for (const name of order) {
    const index = html.indexOf(name);
    assert.ok(index > lastIndex, `expected ${name} to appear after the previous entry`);
    lastIndex = index;
  }
});

test("ties in placing are broken by current-round table number", () => {
  const html = renderToStaticMarkup(
    React.createElement(MyTeamPanel, {
      teammates: [
        {
          player: player({ id: "p1", name: "Table Nine" }),
          pairings: [{ round: 1, published: true, isDone: false, opponentName: "X", table: 9 }],
          loading: false,
          error: null,
          placing: 5,
        },
        {
          player: player({ id: "p2", name: "Table Two" }),
          pairings: [{ round: 1, published: true, isDone: false, opponentName: "Y", table: 2 }],
          loading: false,
          error: null,
          placing: 5,
        },
      ],
    })
  );
  assert.ok(html.indexOf("Table Two") < html.indexOf("Table Nine"));
});

test("marks the signed-in account's own row as (you)", () => {
  const html = renderToStaticMarkup(
    React.createElement(MyTeamPanel, {
      teammates: [
        { player: player({ id: "p1", name: "Me" }), pairings: [], loading: false, error: null },
        { player: player({ id: "p2", name: "Ally" }), pairings: [], loading: false, error: null },
      ],
      myPlayerId: "p1",
    })
  );
  const meIndex = html.indexOf("Me");
  const allyIndex = html.indexOf("Ally");
  const youIndex = html.indexOf("(you)");
  assert.ok(youIndex > -1, "expected exactly one (you) marker");
  assert.equal(html.indexOf("(you)", youIndex + 1), -1, "expected exactly one (you) marker");
  assert.ok(meIndex < youIndex && youIndex < allyIndex, "expected (you) to sit right after Me, before Ally");
});
