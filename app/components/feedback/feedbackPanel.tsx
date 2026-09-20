"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "../../lib/auth";
import { submitFeedback, type FeedbackKind } from "../../lib/feedback";
import { logClientEvent } from "../../lib/clientLog";
import Button from "../ui/button";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * The feedback form itself — backdrop plus panel. Loaded lazily by
 * feedbackWidget.tsx (the pill that opens it, which is what
 * app/layout.tsx mounts), so none of this is in the initial bundle of
 * every page for a form most visits never open.
 *
 * Owns all of the form's own state; the widget above it owns only
 * open/closed. `onClose` both closes and resets, so a reopen always
 * starts fresh.
 *
 * A plain conditionally-rendered backdrop+panel, not ui/dialog.tsx's
 * Radix-backed Dialog — that component portals its content to
 * document.body, which is real DOM behavior a plain react-dom/server
 * static-SSR test pass can't see into at all. Keeping this modal
 * in-place trades away Radix's focus-trapping/Escape-to-close for real
 * structural test coverage of the form itself, which matters more for a
 * widget whose entire point is being trivially easy to fill in and
 * submit.
 */
export default function FeedbackPanel({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // No reset step: this panel unmounts when it closes (feedbackWidget.tsx
  // stops rendering it), so all of the form state above goes with it and
  // a reopen always starts fresh. The old in-place version had to wipe
  // the fields by hand.
  const close = onClose;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || status === "submitting") return;
    setStatus("submitting");
    setErrorMessage(null);
    try {
      await submitFeedback({ kind, message: message.trim(), page: pathname, contactEmail: contactEmail.trim() });
      setStatus("success");
      logClientEvent("info", "feedback: submitted", { kind });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus("error");
      setErrorMessage(msg);
      logClientEvent("error", "feedback: submit failed", { kind, error: msg });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 print:hidden" onClick={close} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-widget-title"
        className="fixed bottom-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-surface-border bg-surface-1 p-4 shadow-xl sm:bottom-4 print:hidden"
      >
        <div className="flex items-center justify-between">
          <h2 id="feedback-widget-title" className="text-sm font-semibold text-text-primary">
            Report a bug or suggestion
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="rounded-md p-1 text-text-tertiary hover:bg-surface-2 hover:text-text-secondary"
          >
            <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {status === "success" ? (
          <div className="mt-3 text-sm text-text-secondary">
            Thanks — got it! Feel free to close this.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
            <div className="flex gap-1">
              {(["bug", "suggestion"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  aria-pressed={kind === k}
                  className={
                    kind === k
                      ? "rounded-full bg-brass-500 px-3 py-1 text-xs font-medium text-[oklch(0.16_0.006_260)]"
                      : "rounded-full border border-surface-border px-3 py-1 text-xs text-text-secondary hover:bg-surface-2"
                  }
                >
                  {k === "bug" ? "Bug" : "Suggestion"}
                </button>
              ))}
            </div>

            <textarea
              autoFocus
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={kind === "bug" ? "What went wrong?" : "What would you like to see?"}
              rows={4}
              className="w-full resize-none rounded-md border border-surface-border bg-surface-0 px-2 py-1.5 text-sm text-text-primary outline-none focus:border-brass-500"
            />

            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Email (optional, if you want a reply)"
              className="w-full rounded-md border border-surface-border bg-surface-0 px-2 py-1.5 text-sm text-text-primary outline-none focus:border-brass-500"
            />

            {user && (
              <p className="text-[11px] text-text-tertiary">Submitting as {user.name} ({user.email})</p>
            )}

            {status === "error" && errorMessage && (
              <div role="alert" className="text-xs text-danger-400">
                {errorMessage}
              </div>
            )}

            <Button type="submit" disabled={!message.trim() || status === "submitting"}>
              {status === "submitting" ? "Sending…" : "Send"}
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
