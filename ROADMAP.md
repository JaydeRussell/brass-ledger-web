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
player using this app live at a tournament?" All five stayed on the
already-published-BCP-data side of the scope line; all five are now
resolved (shipped or declined) — see the changelog and "Declined" below
for what happened to each. Nothing queued here right now; add a new idea
above this line when one comes up.

## Declined

Not dropped because it shipped (see "Done / promoted" below) — dropped
because it can't be built within this project's own rules. Kept here,
unlike a shipped item, so a future session doesn't re-propose the same
thing without the context of why it didn't happen.

**Notification nudge for new data** (2026-09-11): true push
notifications need a backend job periodically re-checking BCP with
nobody actively using the app — a direct conflict with both repos'
"no polling / fetch on page load and explicit user action only" rule,
not just a high-effort feature. A narrower, technically-compliant
version was proposed (frontend polls its own backend, not BCP, capped
interval, only for the open event, only while the tab is visible) and
declined too — "a bit too loose with our rules." A fully-compliant
fallback exists (toast triggered only when the tab regains focus, no
timer at all) but wasn't pursued either; the whole idea was dropped
rather than built in a diminished form.

**Win-rate by opponent faction** (half of "Personal trend view",
2026-09-11): reconstructing this needs a full round-by-round pairings
fetch across every past event — the same "hundreds of extra BCP
requests for one stat" cost `internal/api/stats.go`'s `StatsHandler` doc
comment had already declined once before, for the same reason. The
other half of that idea (placing/points over time) had no such
conflict and shipped — see the changelog for v0.9.0.

## Done / promoted

Once an idea here actually ships, drop its entry (the changelog is the
record of what happened) rather than checking it off in place.
