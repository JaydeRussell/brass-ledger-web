// Client for this app's own backend's admin feedback routes (see
// internal/api/admin.go's ListFeedback/FeedbackOpenCount/ResolveFeedback/
// ReopenFeedback in the brass-ledger-api repo) — the admin-only
// counterpart to app/lib/feedback.ts's public submit. Every route here
// requires the signed-in account to be an approved admin, same gating
// as adminUsers.ts.

import { useEffect, useState } from "react";

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export type AdminFeedback = {
  id: number;
  kind: "bug" | "suggestion";
  message: string;
  page: string;
  contactEmail: string;
  // "Name <email>" if the submitter was signed in, "" for an anonymous
  // submission (see internal/api/admin.go's toAdminFeedbackResponse).
  submittedBy: string;
  status: "open" | "resolved";
  createdAt: string; // RFC 3339
};

// Same JSON-decoding/error-message shape as adminUsers.ts — duplicated
// rather than shared, matching how each app/lib/*.ts module keeps its
// own small copy of this pattern.
async function handleJSONResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let message = `Request failed: HTTP ${res.status}`;
    try {
      const body = JSON.parse(text) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // Body wasn't JSON — keep the generic message above.
    }
    throw new Error(message);
  }
  if (text.length === 0) return null as T;
  return JSON.parse(text) as T;
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_API_BASE}${path}`, { credentials: "include" });
  return handleJSONResponse<T>(res);
}

async function postJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_API_BASE}${path}`, { method: "POST", credentials: "include" });
  return handleJSONResponse<T>(res);
}

/** Every bug report/suggestion, open first — see GET /api/admin/feedback. */
export async function fetchAdminFeedback(): Promise<AdminFeedback[]> {
  return getJSON<AdminFeedback[]>("/api/admin/feedback");
}

export async function resolveFeedback(id: number): Promise<void> {
  await postJSON(`/api/admin/feedback/${id}/resolve`);
}

export async function reopenFeedback(id: number): Promise<void> {
  await postJSON(`/api/admin/feedback/${id}/reopen`);
}

/** How many reports are still open — see GET /api/admin/feedback/open-count. */
export async function fetchOpenFeedbackCount(): Promise<number> {
  const { count } = await getJSON<{ count: number }>("/api/admin/feedback/open-count");
  return count;
}

/**
 * Fetches the open-feedback count once, only when `isAdmin` is true —
 * the nav drawer's session-start "take note of what's pending" badge
 * (see navDrawer.tsx). No polling (this project's one rule for every
 * fetch, own backend or third-party alike): it loads once when the
 * drawer mounts and stays put until the next full page load, the same
 * way useCurrentUser() itself only checks once per session rather than
 * refreshing on a timer. `null` means "not fetched yet or not an admin"
 * — the caller renders no badge for that, same as a real 0.
 */
export function useOpenFeedbackCount(isAdmin: boolean): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    fetchOpenFeedbackCount()
      .then((n) => {
        if (!cancelled) setCount(n);
      })
      .catch(() => {
        // Best-effort: a failed count fetch just means no badge shows,
        // not an error surfaced anywhere — the Admin page's own Feedback
        // section is still the source of truth and has its own error
        // handling.
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  return count;
}
