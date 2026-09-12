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

Sourced from a 2026-09-12 pass: a live-app UX/usability review (actually
clicked through the running app, not just read the code) plus the user's
own feature requests from the same conversation. Scored 1–10 on
**effort** and **usefulness** the same way the last batch was, ranked by
usefulness ÷ effort.

### 1. "Your round" team-roster fallback when boards aren't published
**Effort: 2/10 · Usefulness: 7/10**

`MyRoundCard`'s team-event fallback (no individual board resolved yet)
currently shows nothing but the opposing team's name. `RoundBoard` and
`MyPairings` already solve this exact situation with
`TeamRosterFallback` (showing both sides' rosters instead of nothing) —
`MyRoundCard` was just built later and never got the same treatment.
Small, contained fix: reuse the existing component instead of building
anything new.

### 2. Fix the duplicated zip code in event location
**Effort: 1/10 · Usefulness: 3/10**

Overview tab shows "25 N Sports Pk Dr, Farmington, UT 84025 84025, USA"
— the zip appears twice. `formatLocation` in `internal/bcp/events.go`
likely isn't deduping BCP's own `zip` field against a zip that's already
embedded in another field it joins in (e.g. `state`). A straightforward
data-formatting bug, not really a "feature," but worth fixing — a
visible glitch like this undermines confidence in the rest of the
display, which is otherwise just passing through BCP's own data
faithfully.

### 3. Linkify event description's markdown-style links
**Effort: 2/10 · Usefulness: 5/10**

BCP's event description field contains real markdown links — e.g.
`[Player Pack here.](https://...)` — that currently render as raw
literal text, brackets and all, on the Overview tab. These are exactly
the links a player most wants (rules pack, player portal) and they're
dead. Parse `[text](url)` patterns in the description and render them
as real anchor tags rather than adding a full markdown renderer
dependency for one field.

### 4. Neutral side-by-side team stat comparison
**Effort: 3/10 · Usefulness: 6/10**

For a followed team's pairing and "Your round" (team events), show both
sides' already-published average ITC (or another already-published
stat) plainly next to each other — "Master Crafted: Avg ITC 1,540 ·
Rose City Ruffians: Avg ITC 1,410" — with no framing, no bar, no
"favored"/"underdog" label, and no color-coding tied to which number is
higher. Deliberately *not* a computed judgment about the matchup: two
already-published numbers displayed side by side, the same posture the
app already takes with an individual player's own ITC badge today, just
extended to show both sides at once instead of one at a time.

**Scope history (2026-09-12)**: this replaces an earlier version of the
idea — a "favored" indicator/bar explicitly marking one side as more
likely to win, discussed and declined; see "Declined" below for why,
including a real finding about team events' live captain-driven board
assignment process that a favored-style indicator (even at team
aggregate level, not per-board) could function as decision support for.
This neutral version was chosen specifically to avoid that.

### 5. My Events: simplify the click-to-expand card
**Effort: 2/10 · Usefulness: 4/10**

Expanding a Past/Ongoing/Future card on `/my-events` currently reveals
"Status" and "Dates" — both already visible on the collapsed card — plus
a "View event page →" link. The expand step adds a click for zero new
information. Simplest fix: put the link directly on the collapsed card
and drop the expand/collapse interaction entirely, since it isn't
actually hiding anything worth hiding.

### 6. Overview: don't duplicate "Your round" and "Following yourself"
**Effort: 3/10 · Usefulness: 5/10**

If a signed-in account follows its own team (a natural thing to do),
Overview shows a "Your round" card immediately followed by a "Following
[team name]" card repeating the identical round/table/opponent — looks
like a glitch, not two intentional features. Suppress the "Following"
summary card on Overview specifically when its target is the same
roster row `myPlayer`/"Your round" already covers; the full
round-by-round history on the Pairings tab for that same followed team
doesn't need to change, since it shows more than "Your round" does
(every round, not just the current one).

### 7. Placings tab improvements
**Effort: 5/10 · Usefulness: 8/10**

Three related changes to the same tab, worth doing together:
- Lead with the win/loss record as the first column, rather than
  wherever it happens to fall in BCP's own metric ordering — the number
  most players actually track first.
- A click-to-expand row for team-event placings showing that team's
  roster (reusing the roster-by-team-id data already fetched for
  Roster/Pairings — see `rosterByTeamId` patterns already established
  there).
- Highlight a followed team/player's row, matching the visual treatment
  Roster (sorts to front, highlighted card) and Pairings (highlighted
  row) already give a followed entry. Placings is currently the one tab
  where "where do I stand" matters most and is the one tab that doesn't
  do this — an inconsistency, not a deliberate choice.

(Linking a singles-event row to its player-stats page is already
shipped — confirmed live in `placingsTable.tsx` via `PlayerStatsLink`.)

### 8. Richer followed-pairing info + mobile-friendly layout
**Effort: 5/10 · Usefulness: 8/10**

Two related changes to `MyPairings`/`RoundBoard`'s pairing rows:
- Surface faction, disposition, and a list link on each followed
  pairing row — the roster data carrying these fields (`Player.Faction`,
  `Player.Disposition`, `Player.List`) is already fetched for the event;
  it's just not threaded through to this specific display today.
- On narrow screens, reflow the current single cramped row into 2–3
  stacked rows, and drop the full ITC badge ("#15 · 1,465 pts") down to
  just placing — the more universally-readable single number at that
  width — rather than cutting off or squeezing the existing layout.

### 9. Jump to your own table on a large pairings board
**Effort: 4/10 · Usefulness: 6/10**

The full "Round pairings" board (`RoundBoard`) is a fixed-height,
internally-scrolling list with no way to jump straight to your own
match — on a large round (Challengers Cup has 68 teams) your own table
could be 20+ rows down with only a faint scrollbar as a hint it even
scrolls. The app already knows which team/player is "yours" (via
following or the BCP-profile link that powers "Your round"); use that to
auto-scroll your row into view on load, or add an explicit "jump to
mine" control.

### 10. Minor UI polish batch
**Effort: 2/10 · Usefulness: 3/10**

Small, independent nits, grouped here rather than as five separate
entries:
- Confirm the Stats page's existing `useDelayedFlag` "taking longer
  than usual" hint actually fires at a reasonable threshold — a
  first-time load with many events took ~5–7s in testing with no
  visible acknowledgment beyond a bare spinner.
- My Events cards give no visual cue (chevron, hover state) that
  they're expandable — moot if item 5 above removes the expand
  interaction entirely.
- Calendar day chips truncate event names ("The Challen...") with no
  tooltip to disambiguate if two truncate identically.
- Roster's "Compare two teams" control is a plain, easy-to-miss text
  link with no icon or visual weight, despite being a genuinely useful
  feature.
- Roster's search placeholder copy doesn't hint that following is also
  available from that tab.

### 11. My Events: dedupe or label same-event placing rows
**Effort: 4/10 · Usefulness: 5/10**

The Past tab on `/my-events` shows the same event as two separate rows
with different points when BCP scores it under two leagues at once
(flagship + Hobby Track) — confirmed live (e.g. "Cowboy Classic 2"
appearing twice). `internal/api/stats.go`'s `canonicalPlacingPerEvent`
already knows how to resolve exactly this ambiguity for the Stats page;
My Events' own list doesn't, so it just reads as a bug. Either dedupe to
the flagship placing the same way, or — if both are worth keeping
visible — label each row ("Flagship" / "Hobby Track") so it reads as
intentional rather than broken.

### 12. Admin page: search, status tabs, and a confirm on Reject
**Effort: 5/10 · Usefulness: 5/10**

`/admin` is currently a flat list of every account regardless of status
— no Pending/Approved/Rejected split, no search by name/email, no way
to approve a batch of new sign-ups after an event in one action. Already
a bit unwieldy with a small seed-data-sized list; won't scale as the
user base grows. Reject in particular has no confirmation step despite
being a one-way action a new user can't self-recover from — worth at
least a confirm dialog even before the rest of this lands.

### Ranked (usefulness ÷ effort)

| Rank | Feature | Effort | Usefulness |
|---|---|---|---|
| 1 | "Your round" team-roster fallback | 2 | 7 |
| 2 | Fix duplicated zip code | 1 | 3 |
| 3 | Linkify event description links | 2 | 5 |
| 4 | Neutral side-by-side team stat comparison | 3 | 6 |
| 5 | My Events: simplify click-to-expand | 2 | 4 |
| 6 | Overview: don't duplicate "Your round"/"Following yourself" | 3 | 5 |
| 7 | Placings tab improvements | 5 | 8 |
| 8 | Richer followed-pairing info + mobile layout | 5 | 8 |
| 9 | Jump to your own table on a large board | 4 | 6 |
| 10 | Minor UI polish batch | 2 | 3 |
| 11 | My Events: dedupe/label same-event rows | 4 | 5 |
| 12 | Admin page: search/tabs/confirm | 5 | 5 |

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
