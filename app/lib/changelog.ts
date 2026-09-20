// The content behind /changelog (and the footer's version link) —
// deliberately a typed data module, not a literal .md/.txt file read at
// request time: this app deploys live to Cloudflare Workers via vinext,
// which has no filesystem to read from at runtime, and the project also
// builds under plain
// Next.js/Turbopack locally — a static import is the one thing both
// pipelines are guaranteed to handle identically, the same reasoning
// footer.tsx already relies on for importing package.json directly
// rather than fetching it. Update this file (and package.json's
// `version`) together when cutting a release — see CLAUDE.md's
// "Releases" section for the full process.
export type ChangelogRelease = {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  highlights: string[];
};

// Newest first. v0.1.0–v0.5.0 are a retroactive pass over this project's
// existing commit history (see CLAUDE.md's "Releases" section for how
// the grouping/version-size decisions were made) rather than something
// tracked release-by-release from the start; from v0.6.0 on, this is
// meant to be kept current as work actually ships.
export const CHANGELOG: ChangelogRelease[] = [
  {
    version: "0.19.6",
    date: "2026-09-20",
    title: "My Events stops re-checking future events",
    highlights: [
      "My Events was asking Best Coast Pairings about your upcoming events every time the server woke up — including one two months away that obviously hadn't changed. Details for events more than a day out are now remembered between restarts, so the page has nothing left to look up on a normal visit.",
      "Events happening right now, or starting within a day, are still re-checked constantly — that's where the round and standings actually move.",
    ],
  },
  {
    version: "0.19.5",
    date: "2026-09-20",
    title: "Player Stats, the first time you load it",
    highlights: [
      "Player Stats builds its summary by looking up details for every event you've ever placed in. Those were being fetched strictly one after another, which nobody noticed because after the first visit they're all cached — but the first visit, on an account with a long history, could take tens of seconds. They're now fetched several at a time.",
      "Nothing changes for a normal visit: that was already well under a second and still is. This is about the very first load of an account with hundreds of events, and about the load right after a cache reset.",
    ],
  },
  {
    version: "0.19.4",
    date: "2026-09-20",
    title: "My Events and Home finish loading",
    highlights: [
      "The last slow part of Home, My Events and Calendar. Any event you've registered for that doesn't have a published result yet had its details looked up one at a time, and re-looked-up every minute — several seconds of waiting on pages that were otherwise already quick.",
      "Those lookups now happen a few at a time rather than in a queue, and how long each event's details are kept depends on the event: one starting more than a day from now is held for hours, while one happening right now (or about to) is still re-checked constantly, because that's the one where the round and standings actually move.",
      "Net effect for Best Coast Pairings, whose data this all comes from: fewer requests, not more.",
    ],
  },
  {
    version: "0.19.3",
    date: "2026-09-20",
    title: "My Events, Player Stats and Home stop crawling",
    highlights: [
      "Home, My Events, Calendar and Player Stats were taking three to four and a half seconds to fill in — long enough to look broken rather than loading. They should now come back in well under a second on a warm connection.",
      "The cause was a caching bug on our side: the server had a shortcut for looking up all your events' details in one go, and it was quietly switching itself off about a minute after starting. Every page load after that went back to fetching them one at a time, dozens in a row.",
      "Two other things were made to happen at once instead of one after the other — the two Best Coast Pairings feeds behind My Events, and Home's own data, which was needlessly waiting for the sign-in check to finish before it started.",
    ],
  },
  {
    version: "0.19.2",
    date: "2026-09-20",
    title: "Housekeeping",
    highlights: [
      "Nothing to see — an internal cleanup with no change to how anything looks or works. Every page used to send a small background request recording what the app had just done, written to a log file for debugging. That file stopped being useful a while ago (and never worked at all on the live site), so the whole path is gone: one fewer request on every page load, and the same information now goes straight to the browser's own console.",
    ],
  },
  {
    version: "0.19.1",
    date: "2026-09-20",
    title: "A faster first load",
    highlights: [
      "The app sends noticeably less over the wire on a cold load — roughly 20 fewer requests and about 12% less JavaScript before anything is interactive. Most of that is the nav drawer, the feedback form, and the ⌘K quick switcher no longer loading until you actually open them, plus a font that was being downloaded on every page and never used.",
      "The home page no longer sits blank while it works out whether you're signed in — it shows placeholder cards in the shape of what's about to arrive, and starts loading your friends and recently-viewed events at the same time as the sign-in check rather than after it.",
      "My Events and Player Stats come back faster on a first visit: the backend now keeps your Best Coast Pairings history between restarts instead of re-reading it from BCP page by page every time, which is both quicker for you and gentler on their API.",
      "Fixed: an accent theme saved to your account only took effect once you opened the nav menu, so a new device would show the default until you went looking for it. It now applies as the page loads.",
      "Fixed: signing out no longer reloads the entire page to notice you've gone, and linking a Best Coast Pairings profile now updates the nav drawer straight away instead of waiting for the next reload.",
    ],
  },
  {
    version: "0.19.0",
    date: "2026-09-18",
    title: "Player compare, a mobile tab bar, and a UI/UX modernization pass",
    highlights: [
      "Keyboard and screen-reader polish across the app: every button, link, and expandable row now shows a clear focus ring when tabbing through with a keyboard (there wasn't one before), the ⌘K quick switcher properly announces its highlighted result to screen readers, and action confirmations that used to happen silently (accepting a friend request, saving a share image) now show a toast.",
      "Placings can be sorted by clicking the Name or Record column header — click again to reverse, a third click goes back to Best Coast Pairings' own published order — and the player name now stays on screen while scrolling a long event's other columns sideways on a phone.",
      "New: compare two players side by side on a singles event's Roster tab (⇄ Compare two players), the same way team events could already compare two teams.",
      "New: a bottom tab bar (Home / My Events / Search) on phone-width screens — the app's actual most common use case, mid-event on a phone, without reaching up for the hamburger menu.",
      "Home's Friends/Your record/Jump back in cards can each be hidden with a small ×, with a \"Show all\" link to bring them back — a per-browser preference for trimming Home down to what you actually use.",
      "New: a \"Save image\" button on public dossier pages (alongside the existing text-copy Share button) generates a downloadable share-card image matching your chosen accent theme, and a new Reduce Motion toggle in the nav drawer's account section turns off this app's animations regardless of your system-wide setting.",
    ],
  },
  {
    version: "0.18.0",
    date: "2026-09-17",
    title: "A cross-event home page, public dossiers, and friending",
    highlights: [
      "The home page is now a dashboard instead of always opening straight into one event: your next (or currently in-progress) event, a friends summary, a quick look at your own record, and the events you've recently viewed. The old event view — Overview/Mine/Team/Roster/Pairings/Placings — didn't go anywhere, it just moved to its own page, reached from Home or My Events instead of being the first thing you see.",
      "New: public player dossiers. Every linked account gets a shareable dossier page (name, best placings, faction breakdown) at its own link, visible to anyone by default, with a toggle on the Player Stats page to turn it off. A dossier also has a one-click \"check head-to-head\" shortcut and a \"Share\" button that copies a plain-text summary plus the link.",
      "New: friending. Send a friend request from someone's dossier page; once accepted, see their upcoming events on the new Friends page (requests, your friends list, and each friend's own events on demand).",
      "Roster cards now show how many people are tracking a team or player, next to the Follow button.",
    ],
  },
  {
    version: "0.17.0",
    date: "2026-09-17",
    title: "A Team tab for singles events, and a home for feedback",
    highlights: [
      "New \"Team\" tab (singles events only, and only when it has something to show) lists yourself plus every other player sharing your BCP-registered club at this event, sorted by this event's published standing — each row shows a \"#N\" placing badge, the full round-by-round record, and the current round's opponent/table/disposition, expandable to every earlier round.",
      "The event page's Overview tab, which had grown crowded fitting \"Your round,\" the new Team content, and who you're following all in one place, split into three: Overview (event facts only), Mine (your round plus following, always shown), and Team.",
      "Bug reports and suggestions submitted through the feedback widget are now saved and browsable instead of email-alert-only — a new Feedback page (in the nav drawer's Admin group) lists them Open/Resolved/All and lets an admin resolve/reopen each one, with an open-count badge in the nav.",
      "Account approvals moved from Admin to their own Accounts page, and now filter/search/paginate server-side with an adjustable page size, instead of pulling every account into the browser at once.",
    ],
  },
  {
    version: "0.16.1",
    date: "2026-09-16",
    title: "Clearer win/loss/draw colors on Placings",
    highlights: [
      "Round-by-round scores wherever they're color-coded (Placings, My Pairings, Round Board, Head-to-Head, \"Your round\") now use a flat red/yellow/green scheme instead of the old 5-shade gradient, which made a draw and a close loss hard to tell apart at a glance.",
      "Fixed: on a longer event (5-6+ rounds), the Placings tab's round-by-round record could get pushed off the edge of the screen on mobile, forcing the whole table into horizontal scroll just to see it. It now wraps onto a second line instead.",
    ],
  },
  {
    version: "0.16.0",
    date: "2026-09-16",
    title: "Round-by-round scores on Placings",
    highlights: [
      "The Placings tab's record column now shows your round-by-round scores (e.g. \"62 / 91 / 74\"), color-coded win/loss, instead of just a bare win count — pulled from the same pairing data the Pairings tab already shows, just gathered across every round in one place.",
      "Only one lead \"Record\" column shows on a collapsed row now; the opponent win-rate tiebreaker and everything else BCP publishes for the event moved behind the row's expand toggle, redesigned as compact stat tiles instead of a second row of pill chips.",
      "\"Best in Faction\"/\"Best in Super Faction\" badges moved into their own column between Name and Record, instead of crowding inline next to the name.",
      "Fixed (backend): the durable BCP cache had no schema version, so an event durably cached before a new field was added to what gets stored (like the faction data those badges need) could stay stuck missing it forever. It's versioned now, so a future change like that busts stale rows automatically instead of needing manual cleanup.",
    ],
  },
  {
    version: "0.15.0",
    date: "2026-09-16",
    title: "Skill-at-a-glance player stats",
    highlights: [
      "Player stats now leads with a \"skill at a glance\" row: average percentile, recent form (your last 5 events), a top-quarter finish rate, and your ITC rank as a real stat tile — all percentile-based, so they're comparable across a mixed GT/RTT/Team history unlike raw placing.",
      "The event-history table is always visible now (no more click-to-expand), shows which faction you played each event, links out to the event itself, and lists newest-first. A new All/GT/RTT/Team filter narrows it (and the trend chart) down to one format.",
      "Checking another player's stats — the opponent quick-look on \"Your round,\" or their own page — now shows just the event-history table, without the trend chart (kept on your own stats page).",
      "The \"check head-to-head\" button on \"Your round\" is now a real button instead of easy-to-miss text.",
      "Removed the mission-matchup panel's hand-authored summary/tactics write-ups from \"Your round\" — mission names, full VP-scoring rules, and deployment maps stay.",
    ],
  },
  {
    version: "0.14.0",
    date: "2026-09-15",
    title: "Faction accent themes and dark mode",
    highlights: [
      "12 Warhammer-40k-faction-inspired accent themes to choose from (up from just Brass) — your pick now syncs across devices when signed in, and the picker collapses to a compact row so it doesn't crowd the nav drawer.",
      "The app is now dark-mode-only — the separate light/dark/system toggle is gone.",
      "The placings table now shows \"Best in Faction\" and \"Best in Super Faction\" badges, and \"Your round\" gains private per-round notes (signed-in only) plus an opt-in head-to-head history lookup against an opponent you've played before.",
      "A ⌘K/Ctrl+K quick switcher jumps straight to any page or a recent event, and /wiki's mission-matchup reference now has an interactive lookup instead of just static tables.",
      "Fixed: an event's Roster tab could wrongly show \"no players published\" for every registrant right up until the list-submission deadline; and an event that's actually over but never flagged \"Ended\" by its organizer now drops out of My Events' Ongoing tab within a day instead of three.",
    ],
  },
  {
    version: "0.13.0",
    date: "2026-09-14",
    title: "Warhammer 40k wiki",
    highlights: [
      "A new \"Wiki\" page (nav drawer, no account needed) covers the mission-matchup panel's reference data in one browsable place: the 5 Force Dispositions, the full disposition matchup matrix, every Primary Mission's complete VP scoring, and a glossary of special mission-card actions.",
      "The mission-matchup panel now explains the special mission-card actions it references (sensor sweep, committed sabotage, vanguard operation, and others) instead of just citing them — the rule text was missing until now because it only appears on the physical cards' reverse sides.",
      "Corrected several mission-matchup summaries and tactics that didn't match the actual scoring rules once double-checked — most notably, the Disruption-mirror write-up now reflects that controlling the enemy's home objective in Outmanoeuvre scores every turn you hold it, not just once.",
    ],
  },
  {
    version: "0.12.0",
    date: "2026-09-14",
    title: "Feedback widget",
    highlights: [
      "A new \"Feedback\" button, bottom-right on every page, opens a small form for reporting a bug or suggesting something — no page navigation, no account required. If you're signed in, it shows a plain \"Submitting as\" line and attaches your account for follow-up.",
    ],
  },
  {
    version: "0.11.0",
    date: "2026-09-13",
    title: "Player cards, mission matchups, and admin alerts",
    highlights: [
      "\"Your round\" (and its team-roster fallback) now shows each player's army, disposition, and ITC rating on a shared player card, reused across Roster, Pairings, and the Round board — a player's name now links to their published army list when one exists, falling back to their stats page otherwise.",
      "Disposition tags now abbreviate and color-code by tone instead of one flat pill, and ITC ranking badges got a full gradient redesign — including, when signed in, an option to color relative to your own ranking instead of only the absolute scale.",
      "For a singles 40k pairing where both players' Force Dispositions are known, \"Your round\" now shows each side's actual Primary Mission, a plain-language matchup summary, tactical suggestions, full VP-scoring rules, and the three official deployment-map layouts, in place of the opponent's BCP stats.",
      "Admins are now emailed the moment a new account signs up pending approval, instead of only finding out by checking the admin page.",
    ],
  },
  {
    version: "0.10.0",
    date: "2026-09-12",
    title: "Overview, Placings, and Admin polish",
    highlights: [
      "\"Your round\" now falls back to showing both teams' rosters for a team event when individual boards aren't published yet, matching Pairings' existing behavior.",
      "Event descriptions' markdown-style links (rules pack, player portal) now render as real clickable links instead of raw bracketed text, and My Events cards drop the extra click-to-expand step.",
      "Overview no longer shows a duplicate \"Following [your own team]\" card next to \"Your round\".",
      "A followed team's pairing and \"Your round\" (team events) now show both sides' already-published average ITC side by side — plain data, no ranking or \"favored\" framing.",
      "Placings: the win/loss record now leads the columns, a team row expands to show its roster, and a followed row is highlighted, matching Roster/Pairings.",
      "Pairing rows now surface faction, disposition, and a list link for a followed player, reflow cleanly on narrow screens, and the full Round pairings board got a \"Jump to mine\" button.",
      "Admin page gained search, status tabs, and a confirm step before rejecting an account.",
      "Fixed a duplicated zip code in event addresses, and My Events no longer lists the same event twice when BCP scores it under two leagues at once.",
      "Patched a live, reachable SQL-injection CVE in the backend's Postgres driver and reachable RCE/SSRF-class CVEs in Next.js, and added govulncheck/npm audit to CI so future ones surface automatically.",
    ],
  },
  {
    version: "0.9.0",
    date: "2026-09-11",
    title: "Placing trends on the stats page",
    highlights: [
      "Player Stats now shows a placing-over-time chart once you've got at least two concluded events — hover any point for that event's name, date, and points, or expand it into a plain table.",
      "Win-rate by opponent faction (the other half of this idea) stays off the table — reconstructing it needs a full round-by-round pairings fetch across every past event, hundreds of extra requests for one stat, the same cost this app already declined once before; see ROADMAP.md.",
    ],
  },
  {
    version: "0.8.0",
    date: "2026-09-11",
    title: "Resilience on bad venue wifi",
    highlights: [
      "Switching events, or reloading the page, no longer blanks the screen to an error when the connection drops — the last-known event data stays up with a small \"showing saved data\" notice instead, until a fresh load succeeds.",
      "If the app can't even confirm you're signed in (a fully unreachable server), it no longer bounces you to the sign-in page — it keeps showing whatever event data it already had, with a \"can't reach the server\" notice, rather than losing your place.",
      "A full offline app (service worker, works with zero connectivity from a cold load) is intentionally not part of this — that's earmarked for whenever a mobile app version of Brass Ledger happens; see ROADMAP.md.",
    ],
  },
  {
    version: "0.7.0",
    date: "2026-09-11",
    title: "Your round, at a glance",
    highlights: [
      "The Overview tab now shows a \"Your round\" card automatically for a signed-in account with a linked BCP profile on that event's roster — current round, table, and opponent, no need to follow yourself first.",
      "For a team event, it finds your own individual board once BCP publishes it, not just your team's overall matchup.",
      "Your opponent's faction (for this event) and full stats — ITC ranking, best placings, faction history — now show right on that same card.",
    ],
  },
  {
    version: "0.6.1",
    date: "2026-09-11",
    title: "Backend housekeeping",
    highlights: [
      "Bumped the backend's Go toolchain to 1.27 and cleaned up several code patterns the new version's tooling flagged — no user-visible change.",
    ],
  },
  {
    version: "0.6.0",
    date: "2026-09-10",
    title: "Player profiles and manual refresh",
    highlights: [
      "Every player's name — on Roster, in Pairings (including expanded team boards), and in Placings — now links to a dedicated stats page for that player, not just your own.",
      "The backend gained a per-player stats lookup by BCP account id, and started capturing that id on individual placings rows so linking works everywhere a name appears.",
      "Pairings and Placings can now be manually rechecked without reloading the page. BCP's own \"live updates\" turned out to just be 15-second polling in disguise, so this app added an explicit Refresh button instead — with a visible cooldown bar and backend cache invalidation behind it, never a timer.",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-09-10",
    title: "Stabilization and polish",
    highlights: [
      "Fixed ITC ratings not showing up at all (the league lookup wasn't anchored correctly), and a second case of ratings specifically going missing on team events.",
      "Team pairings now fall back to showing each side's roster when individual boards haven't been published yet, instead of an empty section.",
      "Fixed the team pairings row breaking on mobile, and moved in-progress search into the URL (debounced) instead of filtering live.",
      "Standardized page layout, finished moving every page onto the shared Card/Button components, and added the About page plus a version footer.",
      "Locked down robots.txt so search engines only see /about and /login.",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-09-09",
    title: "A real design system",
    highlights: [
      "Replaced ad hoc styling with a proper design token system and a light/dark/system theme toggle, synced to a signed-in account.",
      "Adopted Radix primitives (Dialog, DropdownMenu, Tabs) for real accessibility — focus trapping and keyboard navigation — in place of hand-rolled versions.",
      "Restyled every page onto the new tokens: the main event viewer, account pages, /login, and /welcome.",
      "Added an admin page for approving or rejecting accounts.",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-09-08",
    title: "Getting production-ready",
    highlights: [
      "Deployed for real: Cloudflare Workers for the frontend, a Cloudflare Container for the backend, with GitHub Actions CI/CD gating every deploy on tests and a post-deploy smoke test.",
      "The whole app now requires sign-in and account approval, not just individual features — including a dedicated /login page.",
      "Added head-to-head team comparison on the Roster tab and a Force Disposition badge for missions that use it.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-09-07",
    title: "Accounts, a real backend, and My Events",
    highlights: [
      "Rebuilt the backend in Go: BCP's own data is now fetched, cached, and rate-limited server-side and shared by every visitor, instead of each browser tab hitting BCP on its own.",
      "Renamed the project to Brass Ledger.",
      "Added Google sign-in and a personal \"My Events\" list (past/present/future), linked to a BCP profile.",
      "Added a first player-stats summary (best placing, faction breakdown) — later split out to its own page.",
      "Added a manual \"Check for updates\" control for My Events — the first appearance of this app's explicit-refresh-over-polling pattern.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-01-12",
    title: "First prototype",
    highlights: [
      "A hardcoded team roster display, then wired up to a real match/pairings matrix.",
      "First pass at pulling in external tournament data and color-coding pairings by outcome.",
      "A basic, working single-page viewer — the proof of concept this whole app grew from.",
    ],
  },
];
