"use client";
import React from "react";
import { useCurrentUser } from "../../lib/auth";
import { fetchRoundNote, saveRoundNote } from "../../lib/roundNotes";
import { logClientEvent } from "../../lib/clientLog";
import Button from "../ui/button";

type RoundNotesProps = {
  eventId: string;
  round: number;
};

type Status = "idle" | "loading" | "saving" | "saved" | "error";

/**
 * A private, per-round scratchpad (matchup prep, list reminders — "focus
 * fire the big monster," "remember to redeploy fliers") on MyRoundCard's
 * "Your round" card — the one place in this app that's already about
 * *your* specific round, not a general pairings/roster browse. Synced to
 * the signed-in account (internal/api/sync.go's round-note routes), same
 * cross-device pattern as follows/recent-events, but deliberately
 * signed-in-only: unlike follows/recentEvents (which migrated an
 * existing localStorage feature to also sync), there's no prior
 * guest-mode version of this to keep parity with, and adding one now
 * would double the state-merging logic for a feature whose whole value
 * proposition (notes that follow you across devices) a signed-out guest
 * can't use anyway. Renders nothing for a signed-out or not-yet-approved
 * visitor.
 *
 * Collapsed by default (a `useState` toggle, not a hookless `<details>`
 * — this component already needs hooks for the fetch/save, so there's no
 * testability reason to prefer `<details>` here the way
 * missionMatchupPanel.tsx's hookless MissionRules does).
 */
export default function RoundNotes({ eventId, round }: RoundNotesProps) {
  const { user } = useCurrentUser();
  const [expanded, setExpanded] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [savedNote, setSavedNote] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");

  const signedInApproved = Boolean(user && user.status === "approved");

  React.useEffect(() => {
    if (!expanded || !signedInApproved) return;
    let cancelled = false;
    setStatus("loading");
    fetchRoundNote(eventId, round)
      .then((value) => {
        if (cancelled) return;
        setNote(value);
        setSavedNote(value);
        setStatus("idle");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        logClientEvent("warn", "round notes: failed to load", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    return () => {
      cancelled = true;
    };
    // Deliberately re-fetches if `round` changes while expanded (e.g. the
    // signed-in account's own round advances) — eventId is effectively
    // constant per page, included anyway for correctness.
  }, [expanded, signedInApproved, eventId, round]);

  if (!signedInApproved) return null;

  const dirty = note !== savedNote;

  const handleSave = async () => {
    setStatus("saving");
    try {
      await saveRoundNote(eventId, round, note);
      setSavedNote(note);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      logClientEvent("warn", "round notes: failed to save", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <div className="mt-2 border-t border-surface-border pt-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="text-xs font-medium text-text-secondary hover:text-text-primary"
      >
        {expanded ? "Hide notes" : savedNote ? "Show notes" : "Add notes"} for this round
      </button>

      {expanded && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (status === "saved" || status === "error") setStatus("idle");
            }}
            placeholder="Private — only visible to you (e.g. matchup prep, list reminders)."
            rows={3}
            disabled={status === "loading"}
            className="w-full rounded-md border border-surface-border bg-surface-1 px-2 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-500/20 disabled:opacity-50"
          />
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!dirty || status === "saving"}>
              {status === "saving" ? "Saving…" : "Save"}
            </Button>
            {status === "saved" && !dirty && <span className="text-xs text-success-500">Saved</span>}
            {status === "error" && (
              <span className="text-xs text-danger-500">Something went wrong — try again.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
