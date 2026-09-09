"use client";
import React from "react";
import { useRouter } from "next/navigation";

import HamburgerButton from "../components/nav/hamburgerButton";
import BcpProfileLinker from "../components/myEvents/bcpProfileLinker";
import { useCurrentUser } from "../lib/auth";
import { useRedirectToLoginIfSignedOut } from "../lib/useRedirectToLoginIfSignedOut";

/**
 * The one dedicated landing page for a brand-new sign-in (or an
 * existing account that's never linked a BCP profile) — see
 * internal/api/auth.go's callback, which redirects here instead of the
 * plain homepage specifically for that case, regardless of what page
 * sign-in was started from. The point: connecting a BCP profile is the
 * very next thing that happens after signing up, not something you have
 * to go find on your own, and once it's done this app already knows
 * what to show you — see the onLinked handler below, which sends you
 * straight to /my-events (which loads your event history the moment it
 * has a bcpUserId to ask for).
 *
 * A returning, already-linked account should never actually see this
 * page in practice (the backend only ever redirects here for an
 * unlinked one), but it's guarded anyway for a stale bookmark or the
 * back button: redirects straight to /my-events rather than re-running
 * onboarding pointlessly.
 */
export default function WelcomePage() {
  const { user, checked, setUser } = useCurrentUser();
  useRedirectToLoginIfSignedOut(user, checked);
  const router = useRouter();
  const bcpUserId = user?.bcpUserId ?? "";

  React.useEffect(() => {
    if (checked && user && bcpUserId) {
      router.replace("/my-events");
    }
  }, [checked, user, bcpUserId, router]);

  return (
    <div className="min-h-screen bg-surface-0">
      <header className="mx-auto flex max-w-5xl items-center gap-3 px-4 pt-4 pb-2 sm:pt-8">
        <HamburgerButton />
        <h1 className="font-display text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
          Welcome to Brass Ledger
        </h1>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        {!checked || !user || bcpUserId ? null : (
          <div className="rounded-lg border border-surface-border bg-surface-1 p-4">
            <p className="mb-4 text-sm text-text-secondary">
              You&apos;re signed in — one more step. Connect your Best Coast Pairings profile and
              we&apos;ll pull in your full event history and player stats right away.
            </p>
            <BcpProfileLinker
              onLinked={(id) => {
                setUser((prev) => (prev ? { ...prev, bcpUserId: id } : prev));
                router.push("/my-events");
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
