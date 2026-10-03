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

**"What's new" popup on visit** (2026-10-02): on opening the app, show
the `app/lib/changelog.ts` entries released since this person last
looked, and nothing at all when there are none. Dismissing it records
the newest version shown as seen.
- **Cross-device**: for a signed-in account, the last-seen version is
  stored server-side on the account (one version string, e.g. a
  `last_seen_version` column on `users`, read with `/api/me`, written
  by a small `PUT`), so dismissing on a phone stops it showing on the
  laptop. Signed out, it lives in `localStorage`. On sign-in, take the
  newer of the two, so a version already dismissed on this device isn't
  shown again.
- **First visit ever** (no record anywhere): record the current version
  without showing the whole history. At most, show only the latest
  entry.
- **Several releases missed**: list them newest first in one popup,
  capped at a few with a link to the full changelog page.
- **User data added**: one version string per account, no new personal
  data. Delete it with the account.

The 2026-09-12 UX-review batch (team-roster
fallback, zip-dedup, linkified links, neutral stat comparison,
My Events click-to-expand, Overview self-follow duplicate, Placings
tab, richer pairing rows, jump-to-mine, polish batch, dual-league
dedupe, admin search/tabs/confirm) all shipped — see the changelog for
what landed. Per this file's own "Done / promoted" convention below,
shipped entries are dropped rather than checked off in place.

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

**"Favored" team-matchup indicator** (2026-09-12): a bar/label
explicitly marking one side of a followed team pairing (or "Your
round") as more likely to win, computed from a comparison of
already-published average ITC. Discussed at length: the literal
Challengers Cup event-pack language bans methodology "for the pairings
process" specifically, and once BCP publishes a team-vs-team pairing
that process is technically over — a purely team-level (not per-board)
outcome indicator doesn't touch it. But this project's own rule in
`CLAUDE.md` is written deliberately broader than that literal quote
(bans "pairing **or matchup**," explicitly "even a plain deterministic
heuristic"), matching how a prior pairing-matrix idea was declined even
in a pure-data-collection form. Live research also found team events
(including Challengers Cup's own 8-person format) run a captain-driven
"Defender/Attacker" process to assign *individual boards* within an
already-decided team pairing, using "team goals, list roles, and
expected scoring outcomes" — an active pairing sub-process a
team-level favored indicator could function as decision support for,
even without being board-specific itself. Declined on that basis;
replaced with a neutral, unranked side-by-side stat comparison instead
(see "Neutral side-by-side team stat comparison" above), which was
built specifically to avoid computing or framing any judgment about
the matchup.

## Done / promoted

Once an idea here actually ships, drop its entry (the changelog is the
record of what happened) rather than checking it off in place.
