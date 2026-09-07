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

---

# Current status (as of 2026-09-07) — read this first in a new session

This section is a snapshot for picking the project back up, not a
permanent rule — feel free to rewrite/replace it entirely once it's
stale, rather than appending to it forever.

## What's built and working

- **BCP data display** (`app/lib/bcp.ts`, the tab components) — done,
  tested, stable. Now a thin client for the backend's `internal/bcp`
  proxy rather than talking to BCP directly. Not touched recently.
- **Google sign-in (frontend half)** — `app/lib/auth.ts` (a
  `credentials: "include"` fetch client for the backend's
  `/auth/google/login`, `/api/me`, `/auth/logout`) and
  `app/components/auth/authStatus.tsx` (the header's "Sign in with
  Google" button / signed-in avatar+dropdown), wired into `app/page.tsx`.
  Both have passing unit tests. Sign-in doesn't unlock any feature yet —
  it's groundwork for cross-device follows/notes.
- **Client-side logging** — `app/lib/clientLog.ts` posts structured
  events (auth status checks, sign-out attempts, uncaught
  errors/unhandled rejections via `app/components/shared/clientErrorLogger.tsx`,
  mounted in `app/layout.tsx`) to `app/api/log/route.ts`, which appends
  them to `logs/frontend.log` (see the README's "Logging" section).
  Backend has the equivalent (`logs/backend.log`) — the two are meant to
  be read together when debugging a failed sign-in.
- **Navigation** — a left-hand hamburger menu replaced the old
  header-right `AuthStatus` dropdown (`app/components/nav/`:
  `navContext.tsx`'s `NavProvider`/`useNav` for the shared open/closed
  state, `hamburgerButton.tsx`, `navDrawer.tsx`, `accountSection.tsx`),
  mounted once in `app/layout.tsx` around `{children}` so every page
  (`/` and `/my-events`) shares one drawer instance. Design call made
  here (the user explicitly deferred on this — "not sure which is more
  idiomatic"): the signed-in account sits at the *top* of the drawer,
  above the "Event"/"My Events" nav links, rather than as a third link
  itself or a page of its own — it's the one thing true regardless of
  which page you're on, closer to a mobile app's account card above its
  menu items than a nav destination. `accountSection.tsx` is
  `AuthStatus`'s old avatar/name/sign-out guts minus the popover (the
  drawer itself is already the "opened" state, so there's no need for a
  second nested dropdown), built on a new shared `useCurrentUser()` hook
  in `app/lib/auth.ts` (guards stale responses with a request-id ref
  rather than a plain boolean `cancelled` flag, since both the mount
  effect and a later manual `refresh()` call share the same function).
- **My BCP events (past/present/future)** — **confirmed working
  end-to-end with a real account** (linked a real profile, saw real
  Present/Future/Past results — see "What's NOT yet done" below), and
  since moved from `AuthStatus`'s account dropdown to its own dedicated
  route, `app/my-events/page.tsx`, with Past/Ongoing/Future tabs
  (URL-query-string-based, `?tab=...`, same pattern as the main page —
  "Ongoing" is this page's label for the backend's `present` bucket).
  `app/lib/myEvents.ts` (`parseBcpUserId`, `linkBcpProfile`,
  `fetchMyEvents` — all `credentials: "include"` clients for the
  backend's `/api/me/bcp-profile`/`/api/me/events`) is unchanged by the
  move; the old `app/components/auth/myEventsPanel.tsx` was deleted and
  its linking flow extracted into
  `app/components/myEvents/bcpProfileLinker.tsx` (used directly by the
  new page instead of nested inside a dropdown panel), with the event
  list rendering split out into `app/components/myEvents/eventList.tsx`.
  - **Linking flow**: the default is `RosterPicker` (inside
    `bcpProfileLinker.tsx`) — open an event you played in (a
    recent-events chip or a pasted URL/id) and click your own name; this
    reuses `fetchBcpPlayers`'s already-fetched roster data, which
    carries each player's BCP account id even though the UI doesn't
    otherwise surface it (see `types/player.d.ts`'s `Player.bcpUserId`).
    Pasting a raw profile URL/id (or the `.../v1/users/{id}` API request
    URL you'd find in DevTools' Network tab) is kept as a manual
    fallback, toggled via "Paste a link/id instead" — that used to be
    the *only* option and was rough going, since BCP's own account page
    doesn't link out to a public profile anywhere.
  - `myEvents.ts` has full unit test coverage (including
    `parseBcpUserId` handling both the public `/user/...` URL shape and
    the API's `/v1/users/...` shape). The components don't (this project
    has no React component test setup at all — every existing component
    is untested the same way, so this isn't a gap specific to this
    feature). `npm test`, `npm run lint`, and `npx tsc --noEmit` all
    pass after the nav/My-Events-page restructuring — the restructuring
    itself hasn't been clicked through live yet (see below).
  - **Real bug found and fixed on the backend** during the first live
    run: BCP's `/v1/eventplacings` pagination cursor (`nextKey`)
    sometimes comes back as a raw, unencoded JSON object instead of the
    base64-encoded string every other page uses. See the backend repo's
    `CLAUDE.md`/`internal/bcp/client.go`'s `decodeNextKey` for the fix —
    worth knowing about if pagination on either history endpoint ever
    errors again with a JSON-decode message.
- **Component test coverage** — every component now has at least one
  `.test.ts` file (there were previously zero; only pure-logic
  `app/lib/*.test.ts` files existed). This project has no network access
  to install jsdom/@testing-library/react/tsx (confirmed via 403s from
  the npm registry both in Claude's cloud sandbox and on-device), so this
  is a hand-rolled setup instead:
  - `scripts/tsx-test-loader.mjs` — a custom Node ESM loader (registered
    via `node --experimental-loader` in `package.json`'s `test` script)
    that strips TypeScript and compiles JSX to `React.createElement`
    calls using only the `@babel/parser`/`traverse`/`generator`/`types`
    packages already present as transitive deps (no preset/plugin
    packages needed). Also patches around two resolution gaps: bare
    extensionless relative imports, and a `next/navigation` package-
    exports bug under plain Node ESM.
  - `app/lib/testUtils.ts` — two DOM-free testing techniques, picked per
    component depending on whether it uses hooks: `renderStatic` (wraps
    `react-dom/server`'s `renderToStaticMarkup`) for structural/content
    assertions on any component; `walk`/`find`/`findAll` for calling a
    *hookless* component directly as a plain function and invoking its
    real `onClick`/`onChange` props for genuine interaction coverage.
    Neither can simulate a click that triggers a *stateful* transition
    (e.g. opening a dropdown) — flagged inline wherever a test's coverage
    stops short for that reason.
  - Every `*.test.ts` alongside its component (not `.tsx` — the loader's
    JSX transform is only exercised for the actual component files it
    imports, tests themselves are written in plain `React.createElement`
    calls or JSX depending on what's more readable, since the loader
    handles both). 105 tests total as of the restructuring above (see
    "Real bug found" note); `npm test`/`npm run lint`/`npx tsc --noEmit`
    all pass.
- **Cross-device sync for follows + recent events** — the two pieces of
  state that used to live only in per-browser `localStorage` (see "What's
  NOT yet done" below, now resolved) now persist to a signed-in account
  via the backend's new sync routes (see the backend repo's `CLAUDE.md`
  for the full route list):
  - `app/lib/follows.ts` (new) — the `Followed`/`followedKey`
    definitions moved here from `app/page.tsx`, plus `fetchFollows`/
    `addFollow`/`removeFollow`, `credentials: "include"` clients for
    `/api/me/events/:eventId/follows`.
  - `app/lib/recentEvents.ts` (extended, not replaced) — the original
    `loadRecentEvents`/`recordRecentEvent` localStorage functions are
    unchanged and still used for a signed-out/guest visitor; new
    `fetchRecentEventsFromServer`/`recordRecentEventOnServer` functions
    are the `credentials: "include"` clients for `/api/me/recent-events`,
    used only when signed in.
  - `app/page.tsx` — reads `useCurrentUser()`'s `{ user, checked }` and
    branches on it: the mount-hydration effect fetches from the server
    instead of localStorage once `checked` is true and `user` is
    non-null; `stopFollowing`/`startFollowing` call
    `removeFollow`/`addFollow` (fire-and-forget, logged on failure via
    `clientLog.ts`, matching this project's "fail quietly" rule for
    third-party APIs even though this is our own backend) instead of
    `writeLocalStorage` when signed in; `handleChangeEvent` re-fetches
    follows for the new event from the server instead of reading
    localStorage. A signed-out visitor's behavior is unchanged from
    before this work. Deliberately per-action (add one follow / remove
    one follow) rather than "replace the whole list on every change" —
    see the backend's `RegisterSyncRoutes` doc comment for why.
  - Full unit test coverage for the new/changed `app/lib` functions
    (`follows.test.ts`, extended `recentEvents.test.ts`) using the same
    fake-fetch-by-URL pattern as `myEvents.test.ts`. `app/page.tsx`
    itself has no test file — consistent with this project's existing
    convention that page-level orchestration components aren't unit
    tested, only the `app/lib` functions they call.
  - **Not yet verified**: no real Postgres, no live click-through of an
    actual follow/unfollow or event-revisit syncing across two browser
    sessions — only `go test` (backend, in-memory fake store) and
    `npm test`/`npm run lint`/`npx tsc --noEmit` (frontend) so far. Worth
    a real pass before trusting it the way "My BCP events" now is.
- **My Events cards now link to the event page** — the backend half
  (stale-event reclassification) is in the backend repo's `CLAUDE.md`.
  On the frontend:
  - `app/components/myEvents/eventList.tsx`'s `EventCard` is now
    click-to-expand (a plain `useState`, toggled by wrapping the existing
    one-line summary in a `<button aria-expanded=...>`) — collapsed by
    default, same summary as before; the first click expands it in place
    to repeat that summary as a small `<dl>` overview plus a
    "View event page →" `next/link` to `` `/?event=${eventId}` ``.
    Clicking again collapses it.
  - `app/page.tsx` — the mount-hydration effect now reads `?event=` off
    the URL (see its comment starting "A `?event=<id>` in the URL")
    before falling back to the locally-stored event id: if present, it
    wins, gets written to `localStorage` as the new current event (same
    as switching via the settings gear), and is then stripped back out
    of the URL in that same effect once hydration's done with it — a
    one-shot "open this event" link, not persistent URL state.
    `updateQuery` also unconditionally strips `event` from every future
    query update, belt-and-suspenders, so it can never resurface.
  - No test file changes needed for `app/page.tsx` (not unit tested, per
    the existing convention noted above); `eventList.test.ts` got one new
    case asserting a card starts collapsed (`aria-expanded="false"`, no
    "View event page" text) — the actual click-to-expand interaction
    can't be simulated without jsdom, same documented limitation as
    `eventSettings.test.ts`'s dropdown-open case.
  - **Not yet clicked through live** — same caveat as the sync work
    above.

## What's NOT yet done / verified

- ~~Nobody has actually clicked through a real Google sign-in yet~~ —
  **confirmed working 2026-09-07** via `./run.sh`. See the backend
  repo's `CLAUDE.md` "Current status" section for the log evidence —
  both this app's `logs/frontend.log` and the backend's
  `logs/backend.log` corroborated the same successful sign-in.
- ~~My BCP events hasn't been clicked through with a real account yet~~
  — **confirmed working**, including finding and fixing a real BCP API
  quirk along the way (see "What's built and working" above). That was
  before the nav/My-Events-page restructuring, though — the hamburger
  menu, the account section's new home in the drawer, and the dedicated
  `/my-events` route with its Past/Ongoing/Future tabs are all verified
  only via `npx tsc --noEmit`/`npm run lint`/`npm test` so far, not a
  live click-through (`next dev`/`next build` can't run via
  `device_bash` on this arm64 VM — see "Environment quirks" below).
  Worth a real pass before trusting it the way the underlying
  linking/classification logic has been.
- ~~Following/recent-events/notes still live in per-browser
  `localStorage`, not synced to the signed-in account~~ — following and
  recent events are now synced for a signed-in account (see "What's
  built and working" above); a signed-out visitor still uses
  `localStorage` only, unchanged. "Notes" was never actually specced
  beyond the old TODO-list mention — nothing planned there unless raised
  again.
- No CI yet.

## Environment quirks that will trip up a new session

Same bridge-to-the-user's-Mac setup as the backend repo — see its
`CLAUDE.md` for the full explanation of the two available shells (a cloud
sandbox with no access to the user's files, vs. a `device_bash` VM that
mounts the real project folders but has no Go/Docker) and the
edit-in-sandbox-then-`SendUserFile`+`device_commit_files` workflow used
to get changes onto the user's machine. Frontend-specific notes:

- `npm test`, `npm run lint`, and `npx tsc --noEmit` all work fine via
  `device_bash` and are what this project leans on for verification.
- `npm run build` fails via `device_bash` with a "Failed to load SWC
  binary for linux/arm64" error — a missing optional native binary in
  that sandboxed local VM, not a real bug. The actual production build
  only needs to work inside the Docker image (fresh `npm ci` on
  `node:20-alpine`) or on the user's own terminal — don't chase this
  error as if it were a code problem.
