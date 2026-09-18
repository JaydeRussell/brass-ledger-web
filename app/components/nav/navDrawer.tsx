"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNav } from "./navContext";
import AccountSection from "./accountSection";
import { Dialog, DialogClose } from "../ui/dialog";
import Badge from "../ui/badge";
import { useCurrentUser } from "../../lib/auth";
import { useOpenFeedbackCount } from "../../lib/adminFeedback";
import { NAV_LINKS as BASE_LINKS } from "../../lib/navLinks";
import { useCommandPalette } from "../shared/commandPaletteContext";

// The two admin-only pages (app/admin/accounts/page.tsx,
// app/admin/feedback/page.tsx) — shown as an expandable group under one
// "Admin" toggle rather than two flat top-level links, since neither is
// something a non-admin ever sees and grouping keeps the drawer's main
// list from growing by two entries for the (usually one) admin account.
const ADMIN_LINKS: readonly { href: string; label: string }[] = [
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/feedback", label: "Feedback" },
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
 * peer link listed alongside "Home"/"My Events".
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
  const isAdmin = user?.role === "admin";
  // Fetched once when this drawer mounts (see useOpenFeedbackCount's doc
  // comment) — the "take note of what's pending" signal for a session,
  // not a live/polled count.
  const openFeedbackCount = useOpenFeedbackCount(isAdmin);
  const { open: openCommandPalette } = useCommandPalette();

  // Manually expanded, or already on one of the two admin pages — either
  // way the group should show its children rather than making an admin
  // re-expand it just to see which admin page they're currently on.
  const [adminExpanded, setAdminExpanded] = useState(false);
  const onAdminPage = pathname.startsWith("/admin");
  const adminOpen = adminExpanded || onAdminPage;

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

      {/* flex-1 + overflow-y-auto so a tall account section (now including
          the accent-theme swatch grid) plus every nav link can't overflow
          past the Dialog panel's fixed inset-y-0 height on a short
          viewport — the header row above stays put while this scrolls. */}
      <div className="flex-1 overflow-y-auto">
        <AccountSection />

        <nav className="flex flex-col gap-1 p-2">
          <button
            type="button"
            onClick={() => {
              close();
              openCommandPalette();
            }}
            className="flex items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary"
          >
            Quick search
            <span className="text-xs text-text-tertiary">⌘K</span>
          </button>
          {BASE_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-brass-500/15 text-brass-400"
                    : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {isAdmin && (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setAdminExpanded((expanded) => !expanded)}
                aria-expanded={adminOpen}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium ${
                  onAdminPage
                    ? "bg-brass-500/15 text-brass-400"
                    : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                }`}
              >
                Admin
                <span className="flex items-center gap-1.5">
                  {!adminOpen && openFeedbackCount ? <Badge tone="danger">{openFeedbackCount}</Badge> : null}
                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    fill="none"
                    className={`h-4 w-4 shrink-0 transition-transform ${adminOpen ? "rotate-180" : ""}`}
                  >
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </button>

              {adminOpen && (
                <div className="ml-3 flex flex-col gap-1 border-l border-surface-border pl-3">
                  {ADMIN_LINKS.map((link) => {
                    const active = pathname === link.href;
                    const badgeCount = link.href === "/admin/feedback" ? openFeedbackCount : null;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={close}
                        className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                          active
                            ? "bg-brass-500/15 text-brass-400"
                            : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                        }`}
                      >
                        {link.label}
                        {badgeCount ? <Badge tone="danger">{badgeCount}</Badge> : null}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </Dialog>
  );
}
