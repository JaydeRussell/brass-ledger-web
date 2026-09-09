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
 */
export function useRedirectToLoginIfSignedOut(user: CurrentUser | null, checked: boolean) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (checked && !user) {
      router.replace(`/login?return_to=${encodeURIComponent(pathname)}`);
    }
  }, [checked, user, pathname, router]);
}
