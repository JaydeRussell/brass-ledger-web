"use client";
import { useEffect, useRef } from "react";
import { useCurrentUser } from "../../lib/auth";
import {
  applyAccentTheme,
  readStoredAccentTheme,
  reconcileAccountAccentTheme,
  setAccountAccentTheme,
} from "../../lib/theme";
import { logClientEvent } from "../../lib/clientLog";

/**
 * Reconciles a signed-in account's saved accent theme against whatever
 * this device already had in localStorage, once per sign-in. Renders
 * nothing; mounted once in app/layout.tsx.
 *
 * Deliberately its own always-mounted component rather than part of
 * AccentThemePicker (where this logic used to live, inside
 * lib/theme.ts's useAccentTheme). The picker only exists inside the nav
 * drawer, so the reconcile only ran when the drawer's subtree rendered.
 *
 * That was never as reliable as it looked, even before the drawer became
 * lazily loaded: ui/dialog.tsx passes `forceMount` to Radix's Overlay
 * and Content, but not to its Portal, and the Portal gates its children
 * on `open` — so a *closed* drawer renders nothing at all, and this
 * reconcile in practice only ran once someone actually opened the menu.
 * Hoisting it here is what finally makes a signed-in visitor's account
 * accent apply on a new device without them opening the menu first.
 *
 * The layout's inline ACCENT_INIT_SCRIPT already applies the *local*
 * choice before first paint; this only matters when the account's stored
 * choice differs from (or should be seeded from) the local one.
 *
 * "server wins once signed in" is the same rule this app uses for
 * follows/recent-events, with one deliberate addition: if the account
 * has never actually set a preference (still at the backend's own
 * "brass" default) but this device already has a real, different local
 * choice, that local choice is pushed up instead of being silently
 * discarded.
 */
export default function AccentThemeSync() {
  const { user, checked } = useCurrentUser();
  // Runs once per sign-in, not on every render — a later manual pick in
  // AccentThemePicker must never be clobbered by this re-firing.
  const syncedForUserRef = useRef<number | null>(null);

  useEffect(() => {
    if (!checked || !user) return;
    if (syncedForUserRef.current === user.id) return;
    syncedForUserRef.current = user.id;

    const { resolved, pushLocalUp } = reconcileAccountAccentTheme(
      user.accentTheme,
      readStoredAccentTheme()
    );
    applyAccentTheme(resolved);
    if (pushLocalUp) {
      setAccountAccentTheme(resolved).catch((err: unknown) => {
        logClientEvent("warn", "pushing local accent theme choice to account failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }
  }, [checked, user]);

  return null;
}
