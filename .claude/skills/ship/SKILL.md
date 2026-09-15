---
name: ship
description: Commit the current working-tree changes, push a feature branch, open a PR following this project's conventions, wait for CI, and squash-merge it — the branch-to-merge choreography used throughout this project. Optionally cut a release afterward per CLAUDE.md's "Releases" section. Use when the user says "ship this," "let's push them up," "get it merged," "open a PR," or otherwise asks to land the current changes.
---

# Shipping a change in this project

This project always lands work on `main` the same way: feature branch →
commit → push → PR → wait for CI → squash-merge with `--delete-branch`.
Never push directly to `main`. This is an explicit action, not a
default — only run this when the user actually asks for it (same rule
as committing at all; see the top-level git-safety instructions).

## Before starting

- Run this repo's verification commands first — `npm test`, `npm run
  lint`, `npx tsc --noEmit`, `npm run build` — and don't open a PR on
  code that hasn't passed all of them.
- `git status`/`git diff` to see exactly what's changing. Stage only the
  files that belong to this change — never a blanket `git add -A`
  without reviewing what it actually picked up (check for anything that
  looks like it could hold a secret before pushing).
- If the change touches both this repo and the sibling
  `brass-ledger-api`, ship each repo as its own PR — this project has
  never used a single cross-repo PR, and each repo's CI/branch
  protection is independent.

## The sequence

1. `git checkout -b <descriptive-branch-name>` — a short kebab-case name
   describing the change (e.g. `feat/mission-matchup-panel`,
   `release-vX.Y.Z-YYYY-MM-DD`), not a generic `work` or `fix`.
2. Stage the specific files and commit. Message describes *why*, not a
   diff narration, and ends with:
   ```
   Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
   Claude-Session: <this session's URL>
   ```
3. `git push -u origin <branch>`.
4. `gh pr create` — title under ~70 characters. Body has `## Summary`
   (why this change, referencing a companion PR in the other repo if
   there is one) and `## Test plan` (checked boxes for what was actually
   verified — including any live click-through, not just automated
   checks). Ends with the `🤖 Generated with [Claude Code]` footer and
   the session link, same as the commit.
5. Poll `gh pr checks <number>` until nothing is `pending` — a short
   sleep loop between checks is fine; don't guess at timing.
6. If every check passed: `gh pr merge <number> --squash
   --delete-branch`. If anything failed, stop and report it — never
   merge a red PR, and never use `--admin` to bypass a failing or
   still-pending required check.
7. Confirm the local `main` fast-forwarded cleanly (`git status`, `git
   log -1`) — `gh pr merge` updates the local branch automatically when
   you're on the branch that just got merged.

## Releasing afterward (only if asked)

Cutting a version alongside a shipped change is a separate, explicit
step. Read this repo's `CLAUDE.md` "Releases" section fresh each time —
it's the canonical policy (when to bump, how to size minor vs. patch,
the changelog entry format, and the tag-after-merge rule) — rather than
relying on this skill's memory of it, since the two can drift apart
over time.
