"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { CurrentUser } from "./auth";

/**
 * Sends a signed-out visitor to /login (preserving the current page as
 * return_to, so signing in brings them right back) once the sign-in
 * check has actually resolved — used by every gated page (/, /calendar,
 * /my-events, /stats, /welcome) instead of each rendering its own
 * inline "sign in to..." prompt (see the now-deleted SignInPrompt).
 *
 * Takes `user`/`checked` directly (rather than calling useCurrentUser()
 * itself) so a page's own single useCurrentUser() call stays the one
 * source of truth for its render logic too — this hook only ever
 * triggers a redirect as a side effect, it never renders anything.
 *
 * `authError` (default false — every call site but the main event page
 * currently omits it, unchanged behavior there) skips the redirect when
 * true: `user` is null because the /api/me lookup itself failed (bad
 * connection), not because of a confirmed 401. Redirecting away in that
 * case would lose whatever's already on screen for no reason — a page
 * with its own last-known-good fallback (see app/page.tsx's
 * eventCache.ts) wants to keep showing it instead.
 */
export function useRedirectToLoginIfSignedOut(
  user: CurrentUser | null,
  checked: boolean,
  authError = false
) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (checked && !user && !authError) {
      router.replace(`/login?return_to=${encodeURIComponent(pathname)}`);
    }
  }, [checked, user, authError, pathname, router]);
}
