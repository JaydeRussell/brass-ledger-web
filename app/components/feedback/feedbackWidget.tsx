"use client";
import React, { useState } from "react";
import { useLazyComponent } from "../../lib/useLazyComponent";

// Memoized so repeated opens share one promise.
let panelModule: Promise<typeof import("./feedbackPanel")> | null = null;
const loadPanel = () => (panelModule ??= import("./feedbackPanel"));

/**
 * A floating "Feedback" pill (bottom-right, every page) that opens a
 * small bug-report/suggestion form — mounted once in app/layout.tsx,
 * same "mount once, appears everywhere" pattern as NavDrawer/Footer.
 * There's exactly one trigger (this button), so it owns its own
 * open/closed state and needs no shared context the way the nav drawer
 * does.
 *
 * The form itself lives in feedbackPanel.tsx and is loaded only once
 * someone actually opens it — most visits never do, and the pill is all
 * that has to be on every page's critical path.
 */
export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const Panel = useLazyComponent(loadPanel, isOpen);

  // Swaps the pill out for the panel, rather than rendering both with
  // the pill hidden: `hidden` would lose to the `flex` utility on the
  // button, since an author style outranks the UA sheet's
  // [hidden] { display: none }.
  if (isOpen && Panel) {
    // React.createElement rather than <Panel />: see useLazyComponent.
    return React.createElement(Panel, { onClose: () => setIsOpen(false) });
  }

  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      aria-label="Report a bug or suggest something"
      // bottom-20 (not bottom-4) below `sm:` — BottomTabBar
      // (bottomTabBar.tsx) is fixed to the bottom of the viewport at
      // that same breakpoint and would otherwise sit right under this.
      className="fixed bottom-20 right-4 z-40 flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-1 px-3.5 py-2.5 text-sm font-medium text-text-primary shadow-lg hover:bg-surface-2 sm:bottom-4 print:hidden"
    >
      <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
        <path
          d="M10 3.5c-3.6 0-6.5 2.4-6.5 5.4 0 1.7.9 3.2 2.4 4.2-.1.8-.4 1.6-1 2.3a.4.4 0 0 0 .4.6c1.2-.2 2.2-.6 3.1-1.2.5.1 1 .2 1.6.2 3.6 0 6.5-2.4 6.5-5.4S13.6 3.5 10 3.5Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
      Feedback
    </button>
  );
}
