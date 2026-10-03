"use client";
import { useEffect, useState, type ComponentType } from "react";
import { logClientEvent } from "./clientLog";

/**
 * Loads a component's module on demand and returns the component once
 * it's there (null until then).
 *
 * Not next/dynamic, because the caller decides *when* to fetch:
 * nothing loads until `shouldLoad` turns true, whereas a dynamic()
 * component starts fetching as soon as it renders. The resolved
 * component is held in state, so the load itself triggers the render.
 *
 * `loader` must be a stable, module-level function (it's in the effect's
 * dependency list). Memoize the import inside it if two call sites share
 * one chunk — see navDrawer.tsx.
 *
 * Used for UI that's mounted on every page but only ever seen after a
 * deliberate action: the nav drawer, the feedback panel, the command
 * palette. Keeping those out of the initial bundle is worth more than
 * the one tick of latency the first time someone opens them.
 */
export function useLazyComponent<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  shouldLoad: boolean
): ComponentType<P> | null {
  const [Loaded, setLoaded] = useState<ComponentType<P> | null>(null);

  useEffect(() => {
    if (!shouldLoad || Loaded) return;
    // The extra arrow is React's "store a function value" form — without
    // it setState would treat the component as an updater.
    loader().then(
      (m) => setLoaded(() => m.default),
      // Usually a chunk a deploy has replaced; ClientErrorLogger reloads
      // the page for that. Logged rather than left as an unhandled
      // rejection.
      (err: unknown) =>
        logClientEvent("warn", "lazy component failed to load", {
          error: err instanceof Error ? err.message : String(err),
        })
    );
  }, [shouldLoad, Loaded, loader]);

  return Loaded;
}
