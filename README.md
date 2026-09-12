# Brass Ledger

[![CI/CD](https://github.com/JaydeRussell/brass-ledger-web/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/JaydeRussell/brass-ledger-web/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/JaydeRussell/brass-ledger-web)](LICENSE)

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
  their full history on BCP) once it's loaded.
- **Pairings**: browse the full pairings board for any round (every
  matchup, not just one you're following), plus a round-by-round summary
  if you are following someone. Completed matchups show their final score,
  exactly as BCP published it. In a team event, click any team-vs-team row
  to expand it into its individual boards (each player on one team against
  their counterpart on the other), fetched only once you actually expand
  that pairing, never for the whole round up front.
- **Placings**: the event's standings, exactly as BCP has already
  computed and published them (rank plus whatever metrics that event
  scores by — Wins, Battle Points, SoS, etc.).

**Search**: a search box narrows down Roster, Pairings, and Placings by
name (Roster also matches faction) — a plain client-side filter over
whatever's already loaded; it never fetches anything on its own.

**Following**: hit "Follow" on any number of team or player cards in the
Roster tab. A pill per followed team/player shows in the header on every
tab, each with its own round-by-round pairings summary on the Pairings
tab. This only ever displays pairing/placing data BCP has already
published; it never computes or predicts anything.

**Sign in**: the "Sign in with Google" button in the header (via this
app's own backend) unlocks account-backed features — following and
recent events sync across devices, and a player-stats page with a
placing-over-time trend. Every read-only feature above works the same
whether you're signed in or not.

**This app deliberately does not score, rank, or suggest pairings.**
Challengers Cup's event pack bans "AI programs, algorithms, or
methodology... for the pairings process" — note that's broader than just
AI — so this stays a plain data display. See the scope note at the top of
`app/page.tsx`, `app/lib/bcp.ts`, and `types/player.d.ts` before adding
anything that would compute or recommend a matchup.

This app calls its own backend (the sibling [brass-ledger-api](../brass-ledger-api)
repo) for all BCP data — see `NEXT_PUBLIC_BACKEND_URL` below. See that
repo's README/CLAUDE.md for its rules on being respectful of BCP's
undocumented API (caching, rate limiting, etc.).

## Requirements

- Node 22+

## Running locally

Start the backend first (`go run ./cmd/server` in `brass-ledger-api`, or
`./run.sh` there for the whole stack), then:

```bash
cp .env.example .env.local   # NEXT_PUBLIC_BACKEND_URL, defaults to localhost:8080
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Switch events from the gear icon in the header — paste a BCP event URL or
just the event ID (the segment after `/event/` in its bestcoastpairings.com
URL), or pick one from the recent-events dropdown under that same box.
The choice is remembered locally per browser.

## Running the whole stack with Docker

This repo has its own `Dockerfile`, but the "start everything" command
lives in the backend repo (`brass-ledger-api`), since that's what also
owns Postgres and the API:

```bash
./run.sh   # from brass-ledger-api — builds and starts frontend, backend, and Postgres together
```
