# Project rules

## Be respectful of third-party APIs

This app depends on Best Coast Pairings' (BCP) undocumented, unofficial
data API (see `app/lib/bcp.ts`) — there's no partnership or rate-limit
agreement with them, just an endpoint their own web app happens to expose.
Anything in this project that talks to a third-party API, BCP or
otherwise, follows these rules:

1. **No polling.** Never fetch on a timer/interval. Fetch on page load and
   on an explicit user action (e.g. a Refresh button) only.
2. **Cache, and enforce a minimum refetch interval.** Even a manual
   refresh is rate-limited client-side (default: no more than once every
   60 seconds) so mashing a button — or having several tabs open — can't
   hammer the endpoint.
3. **De-duplicate concurrent requests.** If a fetch for the same resource
   is already in flight, reuse that promise instead of firing a second
   request.
4. **Fail quietly; don't retry aggressively.** On error, surface it to the
   user and stop. No automatic retry loops or backoff storms baked into
   the UI — a person can always try again manually.
5. **Fetch only what's needed.** Don't pull extra pages/fields "just in
   case" a future feature might want them.
6. **Never try to route around access control.** If a request is refused
   (auth, rate limit, CAPTCHA), that's the API telling us to back off, not
   a bug to work around.
7. **Don't defensively over-engineer against API changes.** This API is
   unofficial and could change shape without notice, but that's a reason
   to fix things when they break, not to add speculative fallback logic
   or duplicate polling "just in case" ahead of time.

Before considering a feature that touches `app/lib/bcp.ts` (or any future
third-party integration) done, check it against this list.

## Releases

Brass Ledger is one product across two repos (this one and the sibling
`brass-ledger-api`), but only this repo carries a version — `package.json`'s
`version` field, read by `app/components/layout/footer.tsx` and cross-checked
against `app/lib/changelog.ts` by that file's own test. There's no separate
backend version; a release covers whatever changed in either or both repos
since the last one.

**When to cut a release**: when the user asks to (e.g. "ship this," "cut a
release," "update the changelog," "call the session" after a chunk of real
work) — not automatically after every commit. Like committing itself (see
the top-level git-safety rules), this is an explicit action, not a default.

**How**, when asked:

1. Decide the size of the bump — judge the release as one whole, against
   everything since the last tagged release (`git log <last tag>..HEAD`
   in both repos), not commit-by-commit:
   - **minor** (0.X.0, e.g. 0.6.0 → 0.7.0) if *anything* in the release
     gives the user something new to do, see, or notice — a new page,
     control, or data field, or a rework substantial enough to change
     how something looks or behaves. One minor-worthy change makes the
     whole release minor, even bundled with several unrelated fixes —
     don't average it down to a patch because "most of it was small."
   - **patch** (0.X.Y, e.g. 0.6.0 → 0.6.1) only if *everything* in the
     release is a fix, a polish pass, a perf/refactor with no visible
     behavior change, or docs/tests only — nothing a user would describe
     as "it can do something it couldn't before."
   - **major** (1.0.0+) isn't about how big the release is — it's a
     separate, deliberate "this is stable enough for real use" call the
     user makes explicitly. Don't infer it from change size, even a
     total rewrite; stay on 0.x until told otherwise.

   Worked examples from this project's own history (see
   `app/lib/changelog.ts`): v0.5.0 bundled several bug fixes *and* the
   new About page + version footer — that one new page was enough to
   make the whole release minor (v0.5.0), not a patch on v0.4 (v0.4.1).
   v0.6.0 added player-profile pages and a manual refresh control —
   clearly minor. A hypothetical release that was only "fixed lost ITC
   ratings on team events," with nothing else, would have been a patch.
2. Bump `package.json`'s `version`.
3. Add a new entry to the *top* of `CHANGELOG` in `app/lib/changelog.ts`
   (newest-first) — `version`, today's date, a short title, and a few
   plain-language highlights. Written for someone using the app, not a
   commit-log dump: group by what changed, not by commit boundaries.
4. Commit (only the work itself, or the version/changelog bump — whichever
   the user actually asked for) in whichever repo(s) have real changes.
5. Tag that commit `vX.Y.Z` (`git tag vX.Y.Z`) in every repo that has a
   commit for this release — a purely local tag at first.
6. Once the PR/MR carrying that commit is merged, push the tag (`git push
   <remote> vX.Y.Z`) in that repo — standing permission, no need to ask
   again each time. Still don't push a tag before its commit is merged,
   and still don't push tags on request alone outside this merged-PR
   trigger (e.g. someone asks to "tag it" without merging anything) —
   ask first in that case.

v0.1.0 through v0.5.0 were assigned retroactively (2026-09-10) by grouping
this project's existing commit history into the milestones the "Current
status" section below already narrates — see `app/lib/changelog.ts` for
the resulting entries and tags on the commits that closed out each one.
v0.6.0 on is meant to be kept current as work actually ships, not
re-derived from history again.

---

# Current status (as of 2026-09-14) — read this first in a new session

This section is a snapshot for picking the project back up, not a
permanent rule — feel free to rewrite/replace it entirely once it's
stale, rather than appending to it forever.

## What's built and working

Stable, not touched recently unless noted below:

- **BCP data display** (`app/lib/bcp.ts`, the tab components) — a thin
  client for the backend's `internal/bcp` proxy.
- **Google sign-in** (`app/lib/auth.ts`'s `useCurrentUser()`) —
  confirmed working end-to-end with a real account.
- **Navigation** — a left-hand hamburger drawer (`app/components/nav/`:
  `navContext.tsx`, `hamburgerButton.tsx`, `navDrawer.tsx`,
  `accountSection.tsx`), mounted once in `app/layout.tsx`. The
  signed-in account sits at the top of the drawer, above the nav links
  — a deliberate design call, closer to a mobile app's account card
  than a nav destination of its own.
- **My BCP events** (`/my-events`, Past/Ongoing/Future tabs,
  `app/lib/myEvents.ts`) — confirmed working end-to-end with a real
  account, including a real BCP API bug found and fixed along the way
  (an unencoded pagination cursor — see the backend repo's `CLAUDE.md`).
- **Cross-device sync for follows + recent events** (`app/lib/follows.ts`,
  `app/lib/recentEvents.ts`) — persists to a signed-in account via the
  backend's sync routes; a signed-out visitor still uses `localStorage`
  only, unchanged.
- **Client-side logging** (`app/lib/clientLog.ts`) — a consistent
  level/message/context wrapper over `console.log/warn/error`, plus
  `clientErrorLogger.tsx` routing uncaught errors and unhandled
  rejections through it. Read in the browser console (the Chrome
  devtools MCP tools can do this directly). It used to also POST every
  line to an `/api/log` route that appended to `logs/frontend.log`; that
  was for an older setup where reading a file beat reading a console,
  and it never worked in production anyway — a Cloudflare Worker's
  filesystem is read-only, so the append failed silently and the route
  returned 204 while writing nothing. Removed 2026-09-20.
- **Component test coverage** — every component has at least one
  `.test.ts`. This project has no network access to install
  jsdom/@testing-library/react, so it's a hand-rolled DOM-free setup
  instead: `scripts/tsx-test-loader.mjs` (a custom Node ESM loader that
  strips TS and compiles JSX) plus `app/lib/testUtils.ts`'s two
  techniques (`renderStatic` for any component's structural/content
  assertions; `walk`/`find`/`findAll` for a *hookless* component's real
  interaction coverage) — see that file's doc comment for the full
  picture. Neither can simulate a click that triggers a stateful
  transition (opening a dropdown/modal), so that's always verified live
  in a real browser instead and flagged inline in the relevant test file.
- **CI/CD** (`.github/workflows/`) — lint/test/build/npm-audit on every
  push/PR; auto-deploy to Cloudflare (with a smoke test) on every push
  to `main`, gated on `test` passing (a required branch-protection
  check). Dependabot keeps deps current weekly.

Recent (the last few sessions):

- **"Your round" mission-matchup panel (singles 40k events, v0.11.0)** —
  when both players' Force Dispositions are known in a singles event,
  `MyRoundCard` shows each side's actual Primary Mission, a
  plain-language matchup write-up, tactical suggestions, full
  VP-scoring rules, and the three official deployment-map layouts, in
  place of the opponent's BCP stats. All static/hand-authored — no
  runtime fetch: `app/lib/dispositions.ts`/`missions.ts`/
  `missionMatrix.ts` (the canonical 5 dispositions and the Event
  Companion's 25-entry disposition→mission matrix), `missionScoring.ts`
  (full round-by-round VP scoring for all 25 missions),
  `missionMatchups.ts` (15 hand-authored matchup write-ups),
  `missionSources.ts` (source-PDF version stamps — update alongside the
  data whenever GW revises the mission pack), `public/deployment-maps/`
  (45 WebP images, 15 `<disposition>-vs-<disposition>` directories ×
  layouts A/B/C). Gated in `myRoundCard.tsx` behind `isTeamEvent` plus
  both sides having a known disposition. **Confirmed working live**
  against a real singles pairing. The ~9 special-action terms cited in
  `missionScoring.ts` (sensor sweep, committed sabotage, etc.) — whose
  rule text lives on the physical mission-card backs, not in the
  front-faces-only PDF this project transcribes from — are now defined
  in `app/lib/missionActionGlossary.ts` (sourced from a fan
  transcription of the same mission deck on Wahapedia, cross-checked
  against this project's own front-card text; see `missionSources.ts`'s
  `wahapediaMissionDeck` entry) and shown in the mission-matchup panel's
  per-mission rules disclosure. The old `MISSING_GLOSSARY_TERMS` gap in
  `missionMatchups.ts` is resolved and that constant has been removed.
  Its 15 matchup write-ups (`missionMatchups.ts`'s summaries/tactics)
  were also re-examined against the full VP scoring and the new
  glossary — 9 of the 15 had real inaccuracies fixed (the most
  significant: the Disruption-mirror write-up treated Outmanoeuvre's
  10VP enemy-home-objective control as a one-time bonus, when it's
  actually checked every one of your turns you hold it).
- **`/wiki` page** — a new public, unguarded top-level page (nav
  drawer's "Wiki" link; same plain-server-component pattern as
  `/about`/`/changelog`, no auth guard) covering the mission/matchup
  glossary: the 5 Force Dispositions, the full disposition→mission
  matrix, every Primary Mission's complete VP scoring (one
  `<details>` per mission, grouped by disposition), and the special-
  action glossary above. Not a duplicate data source — it renders
  `missionMatrix.ts`/`missionScoring.ts`/`missionActionGlossary.ts`
  directly. The per-mission scoring breakdown itself was extracted out
  of `missionMatchupPanel.tsx` into a shared
  `app/components/shared/missionScoringDetails.tsx` so both the wiki
  and the mission-matchup panel render it from one place. Deliberately
  scoped to reference material only (no tournament-format content, no
  per-pairing tactics) — a plain content page today, but the eventual
  destination if this project ever needs a broader 40k rules reference
  (see the `warhammer-40k` Claude Code skill in `.claude/skills/`,
  which already has full Core Rules + Event Companion content
  transcribed and ready to draw from for that).
- **Floating feedback widget (v0.12.0)** — a "Feedback" pill, bottom-
  right on every page (`app/components/feedback/feedbackWidget.tsx`,
  mounted once in `app/layout.tsx`), opens a small in-place panel
  (Bug/Suggestion toggle, message, optional contact email) posting to
  the backend's new public `POST /api/feedback` (`app/lib/feedback.ts`).
  Deliberately not built on `ui/dialog.tsx`'s Radix `Dialog` — that
  portals to `document.body`, invisible to this project's SSR-based
  tests — so it's a plain conditionally-rendered backdrop+panel
  instead, trading Radix's focus-trap/Escape-to-close for a form that
  stays structurally testable. Shows a "Submitting as {name}" line when
  signed in; the backend attaches that account to the admin alert email
  for triage context, but it's never required — anyone, signed in or
  not, can submit. **Confirmed working live**: submitted a real report,
  got the success confirmation, and saw `POST /api/feedback` → 202 in
  the backend's own log (`docker compose logs backend`). **Not yet
  confirmed**: whether the admin alert
  email actually lands in a real inbox — Resend wasn't configured in
  the local dev stack this was tested against; it reuses the same
  `RESEND_API_KEY`/`EMAIL_FROM_ADDRESS`/`ADMIN_EMAILS` as the existing
  signup alert, so if that's live in production this should just work,
  but nobody's watched an inbox for it yet.

## What's NOT yet done / verified

- The feedback widget's admin alert email hasn't been confirmed to
  actually arrive in a real inbox yet (see above).

## Environment quirks that will trip up a new session

Work happens directly in a terminal on the user's own Mac, and this
frontend is treated as part of the same working session as the backend
repo (`brass-ledger-api`, sibling directory) rather than a separate
context to hand off to — see that repo's `CLAUDE.md` "Environment
quirks" section for the full explanation.

- `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`
  all work fine natively (Next.js 16 + Turbopack) and are what this
  project leans on for verification.
- **The browser-testable `localhost:3000` runs as a Docker container**
  (`brass-ledger-frontend`, started via `../brass-ledger-api/run.sh` →
  `docker compose up --build`), built from a snapshot of the source —
  only `logs/` is bind-mounted, not the app code. Editing files on disk
  does **not** get picked up until the image is rebuilt:
  `cd ../brass-ledger-api && ./run.sh -d --build` (~30s). Before
  concluding a live-test failure is a real bug, check `docker ps`/
  `docker inspect <container> --format '{{.Created}}'` against recent
  edit times and rebuild first — discovered 2026-09-12/13 chasing a
  phantom "still loading" bug on the mission-matchup panel that turned
  out to just be a stale image.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
