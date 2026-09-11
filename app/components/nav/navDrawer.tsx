"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNav } from "./navContext";
import AccountSection from "./accountSection";
import { Dialog, DialogClose } from "../ui/dialog";
import { useCurrentUser } from "../../lib/auth";

const BASE_LINKS = [
  { href: "/", label: "Event" },
  { href: "/my-events", label: "My Events" },
  { href: "/calendar", label: "Calendar" },
  { href: "/stats", label: "Player Stats" },
  { href: "/about", label: "About" },
  { href: "/changelog", label: "Changelog" },
];

/**
 * The left-hand hamburger menu itself, mounted once in app/layout.tsx so
 * it's available from every page. Built on ui/dialog.tsx's Radix-backed
 * Dialog — gains real focus-trapping and Escape-to-close for free, which
 * the hand-rolled backdrop+panel pair this replaced never had (its
 * role="dialog"/aria-modal were already correct, but nothing enforced
 * keyboard focus actually staying inside the drawer while open).
 *
 * `hideTitle` is set because this drawer already shows its own visible
 * "Brass Ledger" heading in the header row below — Dialog's own
 * accessible Title still gets rendered (visually hidden) so screen
 * readers get the same aria-labelledby wiring Radix requires, without a
 * second, visually-duplicate heading.
 *
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
  // A second, independent useCurrentUser() instance — see auth.ts's doc
  // comment: this hook is deliberately not shared state, so every
  // consumer (this drawer, AccountSection below, any gated page) fetches
  // /api/me on its own rather than one instance being threaded through
  // props. Only used here to role-gate the Admin link.
  const { user } = useCurrentUser();
  const links = user?.role === "admin" ? [...BASE_LINKS, { href: "/admin", label: "Admin" }] : BASE_LINKS;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Opening happens externally (HamburgerButton calling useNav()'s
        // open() directly, outside this Dialog's own tree) — this only
        // ever needs to handle Radix-initiated close requests: Escape,
        // an outside/backdrop click, or DialogClose below.
        if (!open) close();
      }}
      title="Brass Ledger"
      hideTitle
    >
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <span className="text-sm font-semibold text-text-primary">Brass Ledger</span>
        <DialogClose asChild>
          <button
            type="button"
            aria-label="Close menu"
            className="rounded-md p-1.5 text-text-secondary hover:bg-surface-2 hover:text-text-primary"
          >
            <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-5 w-5">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </DialogClose>
      </div>

      <AccountSection />

      <nav className="flex flex-col gap-1 p-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-brass-500/15 text-brass-600 dark:text-brass-400"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </Dialog>
  );
}
