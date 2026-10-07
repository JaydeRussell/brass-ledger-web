"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser, type CurrentUser } from "./auth";

/**
 * Sends a signed-out visitor to /login (preserving the current page as
 * return_to, so signing in brings them right back) once the sign-in
 * check has resolved. Used by every gated page.
 *
 * Takes `user`/`checked` from the page's own useCurrentUser() call so the
 * page's render logic and this redirect read the same values.
 *
 * Never redirects when the /api/me lookup itself failed (the backend is
 * unreachable) rather than returning 401: /login can't sign anyone in
 * then either. ServerUnreachableNotice explains the outage instead.
 *
 * `enabled` is false on a page that also serves signed-out visitors.
 */
export function useRedirectToLoginIfSignedOut(user: CurrentUser | null, checked: boolean, enabled = true) {
  const router = useRouter();
  const pathname = usePathname();
  const { authError } = useCurrentUser();

  useEffect(() => {
    if (enabled && checked && !user && !authError) {
      router.replace(`/login?return_to=${encodeURIComponent(pathname)}`);
    }
  }, [enabled, checked, user, authError, pathname, router]);
}
