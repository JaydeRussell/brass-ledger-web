"use client";
import React, { useEffect, useState } from "react";
import { useNav } from "./navContext";
import { useLazyComponent } from "../../lib/useLazyComponent";

// navDrawerBody.tsx is loaded with a plain dynamic import() rather than a
// static one: it pulls in ui/dialog.tsx's Radix Dialog, which measured
// ~37 KB across three chunks on *every* route's critical path (including
// /login) purely because this component is mounted in app/layout.tsx.
//
// Deliberately NOT next/dynamic. Under vinext — the Vite/Cloudflare build
// this project actually deploys, see package.json's build:vinext —
// `dynamic(() => import(…), { ssr: false })` fetches and resolves its
// module but doesn't schedule a re-render when it does, so it goes on
// rendering nothing until some unrelated state change re-renders the
// parent. In a real browser that looked exactly like "the drawer never
// mounts on its own, but clicking the hamburger works." Holding the
// resolved component in state makes the update that loads it the same
// update that renders it.
// Memoized so the hover preload, the idle load and an open all share one
// promise rather than racing on separate ones.
let bodyModule: Promise<typeof import("./navDrawerBody")> | null = null;
const loadNavDrawerBody = () => (bodyModule ??= import("./navDrawerBody"));

/** Starts fetching the drawer chunk without mounting it. */
export function preloadNavDrawerBody(): void {
  void loadNavDrawerBody();
}

/**
 * The always-mounted shell for the left-hand nav drawer. Mounted once in
 * app/layout.tsx; holds no markup of its own, just the policy for *when*
 * the real drawer (navDrawerBody.tsx) gets loaded and mounted.
 *
 * Note that "mounted" here never means "visible": ui/dialog.tsx passes
 * `forceMount` to Radix's Overlay and Content but not to its Portal, so
 * a closed Dialog renders nothing into the DOM at all. Mounting the body
 * early therefore costs a React element and the Dialog's context, not
 * markup — and it isn't what makes the open animation work (the panel
 * enters the DOM on open either way, exactly as it did when this module
 * was statically imported). What early loading actually buys is that
 * clicking the hamburger never waits on a network fetch.
 *
 * Two triggers:
 *
 * 1. **Browser idle, or a 3s backstop timer** — the common case: fetch
 *    the chunk and mount once the page is done with the work that
 *    matters. Both schedulers are used because requestIdleCallback is
 *    the one we want, but Chrome doesn't fire it at all in a hidden tab
 *    even with a `timeout`, so a page opened in a background tab would
 *    sit unloaded until the visitor switched to it and clicked. Safari
 *    before 17 has no requestIdleCallback at all, and there the timer is
 *    the whole story.
 *
 * 2. **The drawer being opened** — the safety net, for someone who hits
 *    the hamburger before either scheduler fires.
 *
 * hamburgerButton.tsx also calls preloadNavDrawerBody() on hover/focus,
 * which usually wins the race on a pointer device.
 */
export default function NavDrawer() {
  const { isOpen } = useNav();
  const [idleReady, setIdleReady] = useState(false);
  const Body = useLazyComponent(loadNavDrawerBody, idleReady || isOpen);

  useEffect(() => {
    const ready = () => setIdleReady(true);
    const idleHandle =
      typeof requestIdleCallback === "function" ? requestIdleCallback(ready, { timeout: 4000 }) : null;
    const timerHandle = setTimeout(ready, 3000);
    return () => {
      if (idleHandle !== null) cancelIdleCallback(idleHandle);
      clearTimeout(timerHandle);
    };
  }, []);

  if (!Body) return null;
  // React.createElement rather than <Body />: see useLazyComponent.
  return React.createElement(Body);
}
