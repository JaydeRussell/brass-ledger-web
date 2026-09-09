# Brass Ledger

[![CI/CD](https://github.com/JaydeRussell/brass-ledger-web/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/JaydeRussell/brass-ledger-web/actions/workflows/ci.yml)

**Tournament Companion** for Warhammer 40k — a read-only tournament aid,
pulling data straight from Best Coast Pairings (BCP). Switch it to any BCP
event from the gear icon in the header — it's not hardcoded to one
tournament.

The page is split into tabs mirroring BCP's own event page:
- **Overview**: event name, format, and round status, plus the event
  facts BCP's own Overview tab shows (dates, venue, organizer, circuits,
  registration counts, and the event description), and a quick glance at
  whoever you're following (see below).
- **Roster**: every team's roster (player names, factions, army list
  links) in a team event, or every player in a singles/individual event —
  always all of them, no picking who to see. Whoever you're following (see
  below) sorts to the front and gets a highlighted card, and shows their
  already-published BCP ITC ranking (e.g. "ITC #15 · 1465 pts", linking to
  their full history on BCP) once it's loaded. Only followed
  players/teams get this — it's a live per-player lookup against BCP, so
  showing it for an entire large roster would mean a burst of requests;
  see "ITC ranking" below.
- **Pairings**: browse the full pairings board for any round (every
  matchup, not just one you're following), plus a round-by-round summary
  if you are following someone. Completed matchups show their final score,
  exactly as BCP published it. For a followed individual player, each
  round's opponent also shows their ITC ranking, same as above. In a team
  event, click any team-vs-team row — on the full board, or on a followed
  team's own round-by-round summary — to expand it into its individual
  boards (each player on one team against their counterpart on the other),
  each with the same ITC score/rank a singles pairing shows — fetched only
  once you actually expand that pairing, never for the whole round up
  front.
- **Placings**: the event's standings, exactly as BCP has already
  computed and published them (rank plus whatever metrics that event
  scores by — Wins, Battle Points, SoS, etc.).

**Search**: a search box narrows down Roster, Pairings, and Placings by
name (Roster also matches faction) — one shared search box, so it stays
applied as you switch between those three tabs. It's a plain client-side
filter over whatever's already loaded; it never fetches anything on its
own.

**Following**: hit "Follow" on any number of team or player cards in the
Roster tab — click it again to unfollow. A pill per followed team/player
shows in the header on every tab, each with its own round-by-round
pairings summary on the Pairings tab, and each followed team/player sorts
to the front of the Roster tab and is highlighted on the Pairings board
and the Placings table. This only ever displays pairing/placing data BCP
has already published; it never computes or predicts anything.

**Color coding**: a finished game's score is colored on a five-step
red-to-green scale (loss, close loss, draw, close win, win — "close" means
the two scores are within about 10% of each other) so a result reads at a
glance. An ITC badge's background runs white → yellow → orange → red in
light mode (a separate, darker zinc → yellow → orange → red gradient is
used in dark mode, so it doesn't look glaring against a black card) — low
score/weak ranking at one end, high score/strong ranking at the other.
Both are
purely a coloring of numbers BCP already published; nothing here is
computed or ranked by this app.

**Sign in**: the "Sign in with Google" button in the header (via this
app's own backend — see `app/lib/auth.ts` and the backend repo's
"Google sign-in setup" section) doesn't unlock anything yet. Every
feature above works the same whether you're signed in or not — an
account is groundwork for upcoming features that need to follow you
across devices (see "User support" in the TODO below), not a gate on
today's read-only BCP data.

**This app deliberately does not score, rank, or suggest pairings.**
Challengers Cup's event pack bans "AI programs, algorithms, or
methodology... for the pairings process" — note that's broader than just
AI — so this stays a plain data display. See the scope note at the top of
`app/page.tsx`, `app/lib/bcp.ts`, and `types/player.d.ts` before adding
anything that would compute or recommend a matchup.

`app/lib/bcp.ts` no longer talks to BCP directly — that moved to this
app's own backend (the sibling `brass-ledger-api` repo's
`internal/bcp` package), which calls BCP's undocumented
(`newprod-api.bestcoastpairings.com`) endpoints, caches the results, and
enforces a minimum refetch interval per key, shared across every browser
of this app instead of each tab enforcing its own. This frontend is now a
thin client for that backend — set `NEXT_PUBLIC_BACKEND_URL` (see
`.env.example`) to wherever it runs; it defaults to
`http://localhost:8080`.

If BCP data stops showing up correctly, the fix usually lives in the
backend repo, not here — see its `internal/bcp` package for the same
"re-check by inspecting BCP's own network calls" guidance and the
`playerId`/`teamPlayerId`-filter caveat that lives there now.

See the backend repo's `CLAUDE.md`/README for its rules on being
respectful of this (and any other) third-party API — caching, rate
limiting, etc.

# Getting Started

This app now calls its own backend for all BCP data (see above) — start
that first (`go run ./cmd/server` in `brass-ledger-api`, or `./run.sh`
there for the whole stack), then:

```bash
cp .env.example .env.local   # NEXT_PUBLIC_BACKEND_URL, defaults to localhost:8080
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Switch events from the gear icon in the header — paste a BCP event URL or
just the event ID (the segment after `/event/` in its bestcoastpairings.com
URL), or pick one from the recent-events dropdown under that same box
(narrowed by whatever you've typed). The choice is remembered locally per
browser.

# Logging

Client-side events worth debugging later — the header's sign-in status
check on load, sign-out attempts, and any uncaught exception or
unhandled promise rejection anywhere on the page — are sent to this
app's own `/api/log` route (`app/api/log/route.ts`) via
`app/lib/clientLog.ts`, which appends them to a log file on the Next.js
server (not just the browser's console, which nobody's watching after
the fact). Controlled by `LOG_FILE` (default `logs/frontend.log`; set it
to an empty string to skip the file and keep only the console mirror).

```bash
cat logs/frontend.log    # what's accumulated so far
tail -f logs/frontend.log  # follow it live
```

Running via the backend repo's Docker Compose stack (`./run.sh`)? The
frontend container writes to `/app/logs/frontend.log` inside itself,
bind-mounted to this repo's own `logs/` directory — so the commands
above work the same way whether you're running `npm run dev` directly or
the whole stack in Docker.

Debugging a sign-in that isn't working from the browser's side? Look
here for what `/api/me` actually returned (a network error usually means
a wrong `NEXT_PUBLIC_BACKEND_URL` or a CORS mismatch — see that repo's
`FRONTEND_BASE_URL`) alongside the backend's own log file
(`brass-ledger-api`'s README — its "Logging" section), which has
the *why* for anything that failed server-side.

# Testing

Unit tests cover the pure logic in `app/lib/` (the backend API client,
score/ranking color coding, and the recent-events list) using Node's
built-in test runner — no extra dependency to install.

```bash
npm test
```

# linting

```bash
npm run lint
```

# Running the whole stack with Docker

This repo has its own `Dockerfile` (multi-stage, using Next's
`output: "standalone"` build for a small runtime image), but the actual
"start everything" command lives in the backend repo
(`brass-ledger-api`), since that's what also owns Postgres and the
API — see its README's "Running the whole stack with Docker" section.
Short version, from that repo:

```bash
./run.sh
```

which builds and starts this frontend, the backend, and Postgres
together. This repo's own Dockerfile only matters on its own if you're
building/running just the frontend container by hand.

# Deploying to Cloudflare

This app deploys to Cloudflare Workers via [vinext](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
(`vinext init` already ran — see `wrangler.jsonc`, `vite.config.ts`, and
the `*:vinext` scripts in `package.json`). The backend
(`brass-ledger-api`) deploys separately as a Cloudflare Container — see
its README's "Deploying to Cloudflare" section; both need to be deployed
for the site to actually work, since this app is a pure client that
calls that backend directly from the browser (see `.env.example`'s
`NEXT_PUBLIC_BACKEND_URL`).

`.env.production` (not committed — see `.gitignore`'s `.env*` rule) sets
`NEXT_PUBLIC_BACKEND_URL` to the real backend's public URL, since
Next.js inlines `NEXT_PUBLIC_*` vars into the browser bundle at build
time. Update it there if the backend's domain ever changes.

```bash
npm install                # installs vinext/vite/wrangler
npx wrangler login          # authenticate the CLI once, one time only

npm run build:vinext        # builds against .env.production
npm run deploy:vinext       # deploys to Cloudflare Workers
```

`wrangler.jsonc`'s `routes` entry provisions DNS + TLS for
`brass-ledger.app` automatically on first deploy, since the zone is
already on Cloudflare — no manual DNS record needed.

# TODO
[x] Mobile Support — responsive pass done (scrollable tab bar instead of
    squishing on narrow screens, a viewport-safe settings dropdown, bigger
    touch targets, a tighter header on small screens). The tab and search
    filter are also in the URL (`?tab=...&q=...`), so a link survives a
    refresh and can be shared straight to a tab/filter.
[x] Containerization — Dockerfile here (Next standalone build); the
    backend repo's docker-compose.yml/run.sh brings this container up
    together with the backend and Postgres. See "Running the whole stack
    with Docker" above.
[x] Unit tests — table-driven tests for `app/lib/` (the backend API
    client, score/ranking color coding, recent-events list) using Node's
    built-in test runner. See "Testing" above.
[x] Logging — client-side events (auth status checks, sign-out attempts,
    uncaught errors) are sent to a server-side log file via
    `app/lib/clientLog.ts`/`app/api/log/route.ts`, not just the browser
    console. See "Logging" above.
[x] Deployment — live at brass-ledger.app (Cloudflare Pages/Workers via
    vinext) and api.brass-ledger.app (the backend, as a Cloudflare
    Container), both behind a login gate. See brass-ledger-api's
    README's "Deploying to Cloudflare" section.
[x] CI/CD — GitHub Actions on both repos: tests gate a deploy on every
    push to main, and main itself is protected (PR + passing checks
    required, enforced even for admins). See .github/workflows/ci.yml.
[x] User support (sign-in) — Google sign-in via the backend
    (`app/lib/auth.ts`), with server-side sessions instead of anything
    stored per-browser. The account itself (avatar/name/email, sign
    in/out) now lives in the left-hand nav drawer's account section
    (`app/components/nav/accountSection.tsx`), not a header dropdown —
    see "Navigation" below.
[x] Navigation — a left-hand hamburger menu (`app/components/nav/`:
    `navContext.tsx` for the open/closed state shared across pages,
    `hamburgerButton.tsx`, `navDrawer.tsx`), mounted once in
    `app/layout.tsx` so every page can open the same drawer. The
    signed-in account sits at the top of the drawer, above the two nav
    links ("Event" → `/`, "My Events" → `/my-events`) — placed there
    rather than as a third peer link, since it reads as this app's
    identity strip rather than a page you navigate to.
[x] My BCP events (past/present/future) — its own dedicated page at
    `/my-events` (`app/my-events/page.tsx`) rather than a dropdown
    panel, with Past/Ongoing/Future tabs (URL-query-string-based, same
    pattern as the main page's `?tab=...`; "Ongoing" here is this
    page's label for what the backend's API calls `present`). A
    signed-in account can link a Best Coast Pairings profile (there's
    no way to do this automatically — BCP's own API has no email
    field) — see `app/lib/myEvents.ts` and
    `app/components/myEvents/bcpProfileLinker.tsx`. The default linking
    flow is picking yourself out of an event roster you already know
    you played in (reuses `fetchBcpPlayers`/the roster data this app
    already fetches, which carries each player's BCP account id even
    though the UI doesn't otherwise surface it) — pasting a raw
    profile URL/id is kept as a manual fallback. See the backend repo's
    `internal/api/me.go` and `internal/bcp/client.go`'s "Per-user event
    history" section for how the classification actually works.
[ ] Sync following/recent-events/notes to the signed-in account (currently
    still per-browser `localStorage`) so they survive clearing site data
    and follow you across devices.
[x] Backend integration — all BCP fetching/caching/rate-limiting has moved
    to the `brass-ledger-api` repo; this frontend now calls it via
    `NEXT_PUBLIC_BACKEND_URL` instead of BCP directly. See its README for
    the new `internal/bcp`/`internal/api` layout.
[x] Database — Postgres (via Neon/Supabase/Railway, or the local
    container in the backend's docker-compose stack) now holds user
    accounts and sessions (`users`/`sessions` tables, migrated
    automatically — see the backend repo's `internal/db/migrate.go`).
    Follows/notes tables will land the same way once those features move
    off localStorage. No DB is needed for anything BCP-sourced, since
    that's cached in-memory on the backend rather than persisted.
