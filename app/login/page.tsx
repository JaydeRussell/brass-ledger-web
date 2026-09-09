"use client";
import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import HamburgerButton from "../components/nav/hamburgerButton";
import { googleSignInUrl, useCurrentUser } from "../lib/auth";

// Mirrors the backend's isSafeReturnPath (brass-ledger-api's
// internal/api/auth.go) — same purpose (don't redirect somewhere
// unexpected), just applied to this page's own client-side
// router.replace rather than the backend's server-side one. A
// ?return_to that fails this check is dropped rather than rejected
// outright — worst case, an already-signed-in visitor lands on the
// homepage instead of back where they started.
function safeReturnPath(path: string | null): string | undefined {
  if (!path || path[0] !== "/" || path.startsWith("//") || path.includes("://")) {
    return undefined;
  }
  return path;
}

/**
 * The default landing page for a signed-out visitor — every gated page
 * (/, /calendar, /my-events, /stats, /welcome) redirects here via
 * useRedirectToLoginIfSignedOut instead of each rendering its own
 * inline "sign in to..." prompt (see the now-removed SignInPrompt).
 *
 * Deliberately one button, not separate "sign in"/"sign up" ones:
 * Google sign-in doesn't distinguish the two (UpsertUserFromGoogle
 * creates the account transparently on first login), so two buttons
 * that both do exactly the same thing would just be confusing — the
 * copy below explains what happens next for each case instead. What
 * actually differs is server-side: the backend's callback sends a
 * brand-new or not-yet-linked account to /welcome to connect a BCP
 * profile, and a returning, already-linked one back to return_to.
 */
function LoginContent() {
  const { user, checked } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get("return_to"));

  // Already signed in — a stale bookmark, or the back button after
  // signing in from somewhere else. Nothing to do here; send them on to
  // wherever they were headed (or the homepage).
  React.useEffect(() => {
    if (checked && user) {
      router.replace(returnTo ?? "/");
    }
  }, [checked, user, returnTo, router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="mx-auto flex max-w-5xl items-center gap-3 px-4 pt-4 pb-2 sm:pt-8">
        <HamburgerButton />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            Brass Ledger
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Rosters, published pairings, and placings pulled straight from Best Coast
            Pairings — it doesn&apos;t score or suggest pairings.
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        {!checked || user ? null : (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              Sign in with Google to continue. New here? You&apos;ll be walked through
              connecting your Best Coast Pairings profile right after — same button either
              way.
            </p>
            <a
              href={googleSignInUrl(returnTo)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Continue with Google
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

// useSearchParams needs a Suspense boundary above it per Next's app
// router rules — same pattern as app/page.tsx and app/my-events/page.tsx.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
