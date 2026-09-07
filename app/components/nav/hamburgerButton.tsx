"use client";
import { useNav } from "./navContext";

/**
 * Opens the left-hand nav drawer (navDrawer.tsx). Lives in each page's
 * own header rather than the drawer itself, same as any hamburger-menu
 * pattern — the drawer is mounted once in app/layout.tsx, but the
 * button that opens it needs to sit inline with each page's title.
 */
export default function HamburgerButton() {
  const { open } = useNav();

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open menu"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-5 w-5">
        <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}
