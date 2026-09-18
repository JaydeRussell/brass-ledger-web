"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCommandPalette } from "../shared/commandPaletteContext";

type Tab = {
  label: string;
  icon: React.ReactNode;
} & ({ href: string; isActive: (pathname: string) => boolean } | { onClick: () => void });

const ICON_CLASS = "h-5 w-5";

const HOME_ICON = (
  <svg aria-hidden viewBox="0 0 20 20" fill="none" className={ICON_CLASS}>
    <path
      d="M3 9.5 10 3l7 6.5M4.5 8.5V17h11V8.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const EVENTS_ICON = (
  <svg aria-hidden viewBox="0 0 20 20" fill="none" className={ICON_CLASS}>
    <rect x="3" y="4.5" width="14" height="12.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 8.5h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SEARCH_ICON = (
  <svg aria-hidden viewBox="0 0 20 20" fill="none" className={ICON_CLASS}>
    <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M17 17l-3.8-3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * A thumb-reach bottom tab bar, phone-width only (`sm:hidden` — matches
 * this project's own "narrow screen" breakpoint, see pageHeader.tsx) —
 * an alternative to reaching up for the hamburger drawer for the three
 * places this app is actually opened for mid-event: Home, My Events, and
 * a quick jump-to-something via the command palette. Deliberately not a
 * fourth "Menu" tab pointing at the nav drawer — PageHeader's
 * HamburgerButton already sits top-left on every page, so that entry
 * point isn't missing, just not duplicated down here.
 *
 * Mounted once in app/layout.tsx, same as NavDrawer/CommandPalette/
 * FeedbackWidget/ToastViewport — see PageMain's own bottom padding
 * (reserved below `sm:` so this bar never sits over a page's last row
 * of content).
 */
export default function BottomTabBar() {
  const pathname = usePathname();
  const { open: openPalette } = useCommandPalette();

  const tabs: Tab[] = [
    { label: "Home", icon: HOME_ICON, href: "/", isActive: (p) => p === "/" },
    {
      label: "My Events",
      icon: EVENTS_ICON,
      href: "/my-events",
      isActive: (p) => p.startsWith("/my-events"),
    },
    { label: "Search", icon: SEARCH_ICON, onClick: openPalette },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-surface-border bg-surface-1/95 backdrop-blur sm:hidden print:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map((tab) => {
        const active = "href" in tab && tab.isActive(pathname);
        const classes = `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
          active ? "text-brass-400" : "text-text-tertiary"
        }`;
        if ("href" in tab) {
          return (
            <Link key={tab.label} href={tab.href} aria-current={active ? "page" : undefined} className={classes}>
              {tab.icon}
              {tab.label}
            </Link>
          );
        }
        return (
          <button key={tab.label} type="button" onClick={tab.onClick} className={classes}>
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
