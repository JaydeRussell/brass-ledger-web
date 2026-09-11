# Roadmap

Potential features for Brass Ledger, across both repos (this one and
`brass-ledger-api`). Not a commitment or a schedule — just a place to
capture ideas worth doing before they're forgotten, and to pull from
when deciding what's next.

An item here is a candidate, not a plan. Nothing gets implemented off
this list without being discussed first — see each entry's own notes
for how firm/vague it is.

**Scope reminder**: nothing here may compute, rank, or suggest a
pairing/matchup, even a plain deterministic heuristic with no AI
involved — see this repo's `CLAUDE.md` "Scope limit" section. Any
roadmap item that brushes up against that needs to stay on the
"already-published BCP data" side of the line.

## Ideas

Sourced from a 2026-09-11 thought experiment: "what would I want as a
player using this app live at a tournament?" All five stay on the
already-published-BCP-data side of the scope line.

Scored 1–10 on **effort** (build cost, given what's already fetched/
built) and **usefulness** (value to a player at a live event), ranked by
usefulness-per-effort — highest-leverage first, not necessarily
highest-usefulness first.

### 1. Opponent quick-look on pairing
**Effort: 3/10 · Usefulness: 8/10**

The moment my pairing posts, show my opponent's faction, ITC ranking,
and event history inline — not spread across tabs I'd have to visit
separately. Low effort because the per-player stats lookup this needs
already exists (added alongside the manual-refresh work) — this is
mostly reusing it in a new spot, not building new data access.

### 2. "My round" view
**Effort: 4/10 · Usefulness: 9/10**

One screen: current round, my table, my opponent, and the round's
mission/deployment if BCP publishes it. Moderate effort — leverages the
same "which roster row is me" pattern "My events"/the roster picker
already established, and the pairings data is already fetched; the
mission/deployment piece needs checking whether BCP's event data
actually exposes that per round, which could add scope.

### 3. Resilience on bad venue wifi
**Effort: 5/10 · Usefulness: 9/10**

Cache the last-known state aggressively (service worker + local cache)
so a spotty connection leaves the last good view up instead of a blank
page. Moderate, mostly-frontend infra work — and it shares a service
worker with item 4 below, so building them together is cheaper than
either alone.

### 4. Notification nudge for new data
**Effort: 8/10 · Usefulness: 8/10**

A push (or at least in-app) notification when pairings post or a result
comes in, instead of manually mashing refresh. Highest effort of the
five as a true push notification: needs a service worker, a push-
subscription store, permission UX, and a backend job comparing old vs.
new cached data per linked event before it can decide to send anything.
A lighter in-app-only version (toast when the tab is already open, no
push infra) would cut this to roughly a 3, at the cost of only working
when the app's already open.

### 5. Personal trend view
**Effort: 6/10 · Usefulness: 6/10**

Extend the existing player-stats page with placing/points-over-time
trends (cheap — reuses the placings history already fetched there) and
win-rate by opponent faction (expensive — placings history is event-
level standings, not round-by-round results, so faction-matchup trends
need a new historical pairings fetch across every past event). The 6/10
effort reflects doing both; the placing-trend half alone would be closer
to a 3.

### Ranked (usefulness ÷ effort)

| Rank | Feature | Effort | Usefulness |
|---|---|---|---|
| 1 | Opponent quick-look on pairing | 3 | 8 |
| 2 | "My round" view | 4 | 9 |
| 3 | Resilience on bad venue wifi | 5 | 9 |
| 4 | Notification nudge for new data | 8 | 8 |
| 5 | Personal trend view | 6 | 6 |

## Done / promoted

Once an idea here actually ships, drop its entry (the changelog is the
record of what happened) rather than checking it off in place.
