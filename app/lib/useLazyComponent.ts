"use client";
import { useEffect, useState, type ComponentType } from "react";

/**
 * Loads a component's module on demand and returns the component once
 * it's there (null until then).
 *
 * Deliberately not next/dynamic. Under vinext — the Vite/Cloudflare
 * build this project actually deploys, see package.json's build:vinext —
 * `dynamic(() => import(…), { ssr: false })` fetches and resolves its
 * module but doesn't schedule a re-render when it does, so it goes on
 * rendering nothing until some unrelated state change re-renders the
 * parent. Holding the resolved component in state makes the update that
 * loads it the same update that renders it.
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
    void loader().then((m) => setLoaded(() => m.default));
  }, [shouldLoad, Loaded, loader]);

  return Loaded;
}
