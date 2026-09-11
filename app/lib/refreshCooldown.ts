// The floor between accepted "check for updates" clicks — kept loose
// (not the normal 60s cache TTL) since a manual refresh is a deliberate
// one-off action, not the routine/automatic traffic CLAUDE.md's
// no-polling rule is really guarding against.
//
// Mirrors the backend's own manual-invalidate floor exactly
// (internal/bcp/cache.go's minManualInvalidateInterval, brass-ledger-api
// repo) — the two are kept in sync by hand since they're separate repos.
// They protect different things, though: the backend's floor stops a
// rapid refresh loop from hitting BCP for real more than once every
// 2s; this one stops a rapidly mashed button from even firing a burst
// of requests at this app's own backend in the first place. Used by
// RefreshButton (app/components/shared/refreshButton.tsx) both to gate
// clicks and to time its draining cooldown bar.
export const REFRESH_COOLDOWN_MS = 2000;

/**
 * Whether enough time has passed since the last accepted click to accept
 * another one. Pulled out as a pure function (rather than folded
 * straight into RefreshButton) so it's unit-testable directly (see
 * refreshCooldown.test.ts) without needing a React render.
 */
export function canRefreshNow(lastAcceptedAt: number, now: number, cooldownMs: number): boolean {
  return now - lastAcceptedAt >= cooldownMs;
}
