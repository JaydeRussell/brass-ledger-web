"use client";
import React from "react";
import Button from "../ui/button";
import { canRefreshNow, REFRESH_COOLDOWN_MS } from "../../lib/refreshCooldown";

type RefreshButtonProps = {
  onRefresh: () => void;
  // Disables the button independently of the cooldown below — e.g.
  // while the resulting fetch is actually in flight.
  loading: boolean;
  // What this button checks for updates to, e.g. "pairings" or
  // "placings" — used only in the aria-label/title text.
  label: string;
  cooldownMs?: number;
};

/**
 * A "check for updates" (↻) button with a built-in cooldown: an accepted
 * click starts a short, visible drain bar underneath it and disables the
 * button until it empties, so a rapidly mashed click can't fire a burst
 * of requests at this app's own backend — see refreshCooldown.ts's doc
 * comment for how this relates to (and is kept in sync with) the
 * backend's own manual-invalidate floor. The click itself is also
 * gated by a timestamp check (canRefreshNow), not just the `disabled`
 * attribute, since a same-tick double-click can otherwise slip through
 * before React re-renders the disabled state.
 */
export default function RefreshButton({
  onRefresh,
  loading,
  label,
  cooldownMs = REFRESH_COOLDOWN_MS,
}: RefreshButtonProps) {
  const [cooling, setCooling] = React.useState(false);
  // "full" (just clicked, bar at 100% with no transition yet) vs.
  // "draining" (bar animating down to 0% over cooldownMs) — split into
  // two phases so the "start full" state actually paints before the CSS
  // transition to empty begins; collapsing both into one state update
  // would let React/the browser skip straight to the end state with no
  // visible animation at all.
  const [barPhase, setBarPhase] = React.useState<"full" | "draining">("draining");
  const lastAcceptedRef = React.useRef(0);
  const cooldownTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
    };
  }, []);

  const handleClick = () => {
    const now = Date.now();
    if (!canRefreshNow(lastAcceptedRef.current, now, cooldownMs)) return;
    lastAcceptedRef.current = now;
    onRefresh();

    setCooling(true);
    setBarPhase("full");
    // Double rAF: the first callback runs before the next paint (so
    // "full, no transition" is guaranteed to have actually painted
    // once), the second flips to "draining, transition" for that paint
    // and every one after — the standard trick for restarting a CSS
    // transition from a fixed starting point.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setBarPhase("draining"));
    });

    if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
    cooldownTimeoutRef.current = setTimeout(() => setCooling(false), cooldownMs);
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleClick}
        disabled={loading || cooling}
        aria-label={`Check for updated ${label}`}
        title={`Check for updated ${label}`}
      >
        ↻
      </Button>
      {cooling && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-1 bottom-0.5 h-0.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
        >
          <div
            className="h-full bg-brass-500"
            style={{
              width: barPhase === "full" ? "100%" : "0%",
              transition: barPhase === "draining" ? `width ${cooldownMs}ms linear` : "none",
            }}
          />
        </div>
      )}
    </div>
  );
}
