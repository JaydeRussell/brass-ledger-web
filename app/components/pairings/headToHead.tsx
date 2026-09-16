"use client";
import React from "react";
import { fetchHeadToHead, type HeadToHeadResult } from "../../lib/headToHead";
import { classifyScore, SCORE_OUTCOME_CLASSES } from "../../lib/scoreColor";
import { logClientEvent } from "../../lib/clientLog";
import Button from "../ui/button";
import Spinner from "../shared/spinner";

type HeadToHeadProps = {
  myBcpUserId?: string;
  opponentBcpUserId?: string;
  opponentName: string;
};

type Status = "idle" | "loading" | "error";

/** "Round 3 · Autumn GT" — the event name is truncated in place, never
 * the round, since the round number is the shorter and more load-bearing
 * of the two in a tight row. */
function EncounterRow({ encounter }: { encounter: HeadToHeadResult["encounters"][number] }) {
  const outcome =
    encounter.myScore !== undefined && encounter.opponentScore !== undefined
      ? classifyScore(encounter.myScore, encounter.opponentScore)
      : undefined;
  return (
    <li className="flex items-center justify-between gap-2 py-1 text-sm">
      <span className="min-w-0 truncate text-text-secondary">
        Round {encounter.round} · {encounter.eventName}
      </span>
      {outcome && encounter.myScore !== undefined && encounter.opponentScore !== undefined ? (
        <span className={`shrink-0 text-xs font-medium ${SCORE_OUTCOME_CLASSES[outcome]}`}>
          {encounter.myScore}–{encounter.opponentScore}
        </span>
      ) : encounter.outcome ? (
        <span className="shrink-0 text-xs text-text-tertiary">{encounter.outcome}</span>
      ) : null}
    </li>
  );
}

/**
 * A manual "have we played before" check against the current opponent —
 * see lib/headToHead.ts for the approach (intersect both players'
 * already-published event histories, then check only the overlap) and
 * why this is deliberately opt-in rather than automatic: it's real BCP
 * traffic per shared event, capped and durably-cached-after-first-check,
 * but still not something to fire on every page load.
 *
 * The trigger is a real bordered Button, not a plain text link — it
 * used to read as inert secondary text easy to miss on an already-dense
 * "Your round" card, and since this is opt-in (nothing loads until it's
 * clicked), it needs to visibly invite the click rather than blend in.
 */
export default function HeadToHead({ myBcpUserId, opponentBcpUserId, opponentName }: HeadToHeadProps) {
  const [status, setStatus] = React.useState<Status>("idle");
  const [result, setResult] = React.useState<HeadToHeadResult | null>(null);

  if (!myBcpUserId || !opponentBcpUserId) return null;

  const handleCheck = () => {
    setStatus("loading");
    fetchHeadToHead(myBcpUserId, opponentBcpUserId)
      .then((r) => {
        setResult(r);
        setStatus("idle");
      })
      .catch((err: unknown) => {
        setStatus("error");
        logClientEvent("warn", "head-to-head: check failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
  };

  return (
    <div className="mt-2 border-t border-surface-border pt-2">
      {!result && status !== "loading" && (
        <Button variant="secondary" size="sm" onClick={handleCheck}>
          Check head-to-head vs {opponentName}
        </Button>
      )}

      {status === "loading" && (
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Spinner size="sm" />
          <span>Checking your shared event history…</span>
        </div>
      )}

      {status === "error" && (
        <p className="text-xs text-danger-500">Couldn&apos;t check head-to-head history — try again.</p>
      )}

      {result && (
        <div>
          {result.encounters.length === 0 ? (
            <p className="text-xs text-text-tertiary">
              {result.sharedEventsChecked === 0
                ? `No shared events found with ${opponentName}.`
                : `No previous meetings found (checked your ${result.sharedEventsChecked} most recent shared event${result.sharedEventsChecked === 1 ? "" : "s"}).`}
            </p>
          ) : (
            <>
              <p className="text-xs text-text-tertiary">
                {result.encounters.length} previous meeting{result.encounters.length === 1 ? "" : "s"}:
              </p>
              <ul className="mt-0.5 flex flex-col divide-y divide-surface-border">
                {result.encounters.map((encounter) => (
                  <EncounterRow key={`${encounter.eventId}:${encounter.round}`} encounter={encounter} />
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
