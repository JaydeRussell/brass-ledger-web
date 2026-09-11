"use client";
import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Card from "../components/ui/card";
import PageHeader from "../components/layout/pageHeader";
import PageMain from "../components/layout/pageMain";
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
    <div className="flex-1 bg-surface-0">
      <PageHeader
        title="Brass Ledger"
        subtitle="Rosters, published pairings, and placings pulled straight from Best Coast Pairings — it doesn't score or suggest pairings."
      />

      <PageMain>
        {!checked || user ? null : (
          <Card className="p-6 text-center shadow-sm">
            <p className="mb-4 text-sm text-text-secondary">
              Sign in with Google to continue. New here? You&apos;ll be walked through
              connecting your Best Coast Pairings profile right after — same button either
              way.
            </p>
            <a
              href={googleSignInUrl(returnTo)}
              className="inline-flex items-center gap-2 rounded-md border border-surface-border bg-surface-2 px-4 py-2 text-sm font-medium text-text-primary shadow-sm hover:bg-surface-1"
            >
              Continue with Google
            </a>
          </Card>
        )}
      </PageMain>
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
