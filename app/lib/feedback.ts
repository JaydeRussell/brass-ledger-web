// Client for this app's own backend's POST /api/feedback (see
// internal/api/feedback.go in the brass-ledger-api repo) — a bug report
// or suggestion submitted through the floating feedback widget
// (app/components/feedback/feedbackWidget.tsx).
//
// Unlike auth.ts/follows.ts/myEvents.ts, this route needs no session —
// anyone can submit, signed in or not. `credentials: "include"` is still
// sent, though: if the browser happens to have a session cookie, the
// backend attaches that account's name/email to the admin alert for
// triage context. Its absence never blocks the submission.

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export type FeedbackKind = "bug" | "suggestion";

export type FeedbackSubmission = {
  kind: FeedbackKind;
  message: string;
  // The frontend path the submitter was on when they opened the widget.
  page: string;
  // "" (the default) if they left it blank.
  contactEmail?: string;
};

/** Submits a bug report or suggestion. Throws using the backend's own
 * `{error}` message on a non-ok response, same handling as this
 * project's other backend clients (see e.g. follows.ts). */
export async function submitFeedback(submission: FeedbackSubmission): Promise<void> {
  const res = await fetch(`${BACKEND_API_BASE}/api/feedback`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: submission.kind,
      message: submission.message,
      page: submission.page,
      contactEmail: submission.contactEmail ?? "",
    }),
  });
  if (res.ok) return;

  const text = await res.text();
  let message = `Request failed: HTTP ${res.status}`;
  try {
    const body = JSON.parse(text) as { error?: string };
    if (body?.error) message = body.error;
  } catch {
    // Body wasn't JSON — keep the generic message above.
  }
  throw new Error(message);
}
