"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNav } from "./navContext";
import AccountSection from "./accountSection";

const LINKS = [
  { href: "/", label: "Event" },
  { href: "/my-events", label: "My Events" },
  { href: "/calendar", label: "Calendar" },
  { href: "/stats", label: "Player Stats" },
];

/**
 * The left-hand hamburger menu itself: a backdrop + slide-in panel,
 * mounted once in app/layout.tsx so it's available from every page.
 * Holds the account section (sign-in/out — see accountSection.tsx) near
 * the top, above the nav links, per the explicit design call made when
 * this was built: the account is the one thing that's true regardless of
 * which page you're on, so it reads more like an app-level identity
 * strip than a nav destination of its own — closer to how a mobile app's
 * drawer usually puts the account card above its menu items than to a
 * peer link listed alongside "Event"/"My Events".
 */
export default function NavDrawer() {
  const { isOpen, close } = useNav();
  const pathname = usePathname();

  return (
    <>
      <div
        aria-hidden
        onClick={close}
        className={`fixed inset-0 z-30 bg-black/30 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col border-r border-zinc-200 bg-white shadow-xl transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-900 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Brass Ledger</span>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-5 w-5">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <AccountSection />

        <nav className="flex flex-col gap-1 p-2">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
