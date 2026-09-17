"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, type CurrentUser } from "./auth";
import { useRedirectToLoginIfSignedOut } from "./useRedirectToLoginIfSignedOut";

/**
 * The layered gating every admin-only page needs, in order: signed-out
 * -> /login (useRedirectToLoginIfSignedOut, shared with every other
 * gated page). Signed-in but not an admin -> redirect to / rather than
 * showing that page's own AccessStatusMessage, which would misleadingly
 * imply a plain approved user is "pending" or "rejected" when they're
 * simply not an admin. Only once role === "admin" is it left to the
 * caller to apply the normal status !== "approved" check
 * (AccessStatusMessage) — covers the edge case of an admin account
 * that's somehow not approved.
 *
 * Extracted once two separate pages (app/admin/accounts/page.tsx's account
 * approvals, app/admin/feedback/page.tsx's feedback triage) needed the
 * exact same three-way gate — same reasoning
 * useRedirectToLoginIfSignedOut's own doc comment gives for factoring
 * this kind of thing out instead of each page re-deriving it.
 */
export function useRequireAdmin(): { user: CurrentUser | null; checked: boolean; isAdmin: boolean | null } {
  const { user, checked } = useCurrentUser();
  useRedirectToLoginIfSignedOut(user, checked);
  const router = useRouter();

  const isAdmin = checked && user ? user.role === "admin" : null;

  useEffect(() => {
    if (checked && user && !isAdmin) {
      router.replace("/");
    }
  }, [checked, user, isAdmin, router]);

  return { user, checked, isAdmin };
}
