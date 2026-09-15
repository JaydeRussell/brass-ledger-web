"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "../../lib/auth";
import { submitFeedback, type FeedbackKind } from "../../lib/feedback";
import { logClientEvent } from "../../lib/clientLog";
import Button from "../ui/button";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * A floating "Feedback" pill (bottom-right, every page) that opens a
 * small bug-report/suggestion form in place — mounted once in
 * app/layout.tsx, same "mount once, appears everywhere" pattern as
 * NavDrawer/Footer. Deliberately self-contained (unlike NavDrawer,
 * which splits its trigger button and panel across two components
 * sharing navContext.tsx): there's exactly one trigger, this button
 * itself, so one component owning its own open/closed state needs no
 * shared context.
 *
 * A plain conditionally-rendered backdrop+panel, not ui/dialog.tsx's
 * Radix-backed Dialog — that component portals its content to
 * document.body, which is real DOM behavior a plain react-dom/server
 * static-SSR test pass can't see into at all (see navDrawer.test.ts's
 * comment on the same tradeoff). Keeping this modal in-place trades
 * away Radix's focus-trapping/Escape-to-close for real structural test
 * coverage of the form itself, which matters more for a widget whose
 * entire point is being trivially easy to fill in and submit.
 */
export default function FeedbackWidget() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = () => {
    setKind("bug");
    setMessage("");
    setContactEmail("");
    setStatus("idle");
    setErrorMessage(null);
  };

  const close = () => {
    setIsOpen(false);
    // Delayed rather than immediate: an in-progress submission or a
    // just-shown success message shouldn't visibly reset mid-close-
    // animation-less-disappear — since there's no animation here at all,
    // this is really just "don't wipe the form the instant the panel is
    // gone", so a reopen within the same session doesn't need it, but a
    // closed-then-reopened widget always starts fresh.
    reset();
  };

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

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Report a bug or suggest something"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-1 px-3.5 py-2.5 text-sm font-medium text-text-primary shadow-lg hover:bg-surface-2 print:hidden"
      >
        <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
          <path
            d="M10 3.5c-3.6 0-6.5 2.4-6.5 5.4 0 1.7.9 3.2 2.4 4.2-.1.8-.4 1.6-1 2.3a.4.4 0 0 0 .4.6c1.2-.2 2.2-.6 3.1-1.2.5.1 1 .2 1.6.2 3.6 0 6.5-2.4 6.5-5.4S13.6 3.5 10 3.5Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
        Feedback
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 print:hidden" onClick={close} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-widget-title"
        className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-surface-border bg-surface-1 p-4 shadow-xl print:hidden"
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
              <div role="alert" className="text-xs text-danger-600 dark:text-danger-400">
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
