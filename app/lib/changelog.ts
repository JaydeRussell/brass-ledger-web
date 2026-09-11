// The content behind /changelog (and the footer's version link) —
// deliberately a typed data module, not a literal .md/.txt file read at
// request time: this app deploys live to Cloudflare Workers via vinext
// (see README's "Deploying to Cloudflare"), which has no filesystem to
// read from at runtime, and the project also builds under plain
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
