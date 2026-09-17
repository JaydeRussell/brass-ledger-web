"use client";
import React from "react";
import { useParams } from "next/navigation";

import { fetchDossier, type Dossier } from "../../lib/dossier";
import { fieldDetail, ordinal } from "../../components/myEvents/playerStatsPanel";
import Card from "../../components/ui/card";
import Skeleton from "../../components/shared/skeleton";
import ErrorAlert from "../../components/ui/errorAlert";
import PageHeader from "../../components/layout/pageHeader";
import PageMain from "../../components/layout/pageMain";
import { useDelayedFlag } from "../../lib/useDelayedFlag";
import { logClientEvent } from "../../lib/clientLog";

function StatTile({ label, value, detail }: { label: string; value: React.ReactNode; detail?: string }) {
  return (
    <div className="flex min-w-[6rem] flex-1 flex-col items-center rounded-lg bg-surface-2 px-3 py-2 text-center">
      <span className="text-lg font-semibold text-text-primary">{value}</span>
      <span className="text-xs text-text-secondary">{label}</span>
      {detail && <span className="text-[10px] text-text-tertiary">{detail}</span>}
    </div>
  );
}

/** "Nov 2025" from a BCP date string, or undefined if it can't be parsed. */
function formatMonthYear(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

/**
 * A public, unguarded player dossier — no sign-in required, unlike every
 * other route in this app except /about/​/wiki/​/changelog. Deliberately a
 * separate route from the existing (signed-in-only) /players/[bcpUserId]
 * page: that one calls GET /api/players/:bcpUserId/stats — a richer view
 * (ITC rank, percentile summaries, the placing trend chart) available to
 * any *approved* account for any other player, with no visibility
 * opt-out — while this one calls the new public
 * GET /api/players/:bcpUserId/dossier, which does respect the linked
 * account's own dossier_public setting (see app/lib/dossier.ts,
 * components/myEvents/dossierVisibilityToggle.tsx). Those are two
 * different trust boundaries (vetted signed-in accounts vs. anyone with
 * a link), so this deliberately doesn't reuse PlayerStatsPanel outright
 * — it shares that component's two pure formatting helpers (ordinal,
 * fieldDetail) and leaves out anything that would need an authenticated
 * BCP call (the ITC badge, which api.RequireApproved gates) or reads as
 * more "personal analytics" than "shareable identity card" (the trend
 * chart — that stays on the account owner's own /stats page).
 *
 * No colocated page.test.ts — confirmed this project's Node
 * test-runner setup never discovers a *.test.ts file inside a `[param]`
 * dynamic-route directory (its file-discovery glob treats the brackets
 * as a character class, so the file silently matches nothing; `npm
 * test`'s reported total is unchanged whether or not such a file
 * exists). The sibling /players/[bcpUserId]/page.tsx has the same gap
 * for the same reason. DossierVisibilityToggle and the two formatting
 * helpers this page reuses (ordinal, fieldDetail) are still covered by
 * their own tests; this page's own rendering is verified live instead.
 */
function DossierContent() {
  const params = useParams<{ bcpUserId: string }>();
  const bcpUserId = params.bcpUserId;

  const [dossier, setDossier] = React.useState<Dossier | null | undefined>(undefined);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetchDossier(bcpUserId)
      .then((data) => {
        if (!cancelled) setDossier(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        logClientEvent("error", "dossier: failed to load", { bcpUserId, error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [bcpUserId]);

  // dossier stays `undefined` only until the first fetchDossier
  // resolution — after that it's either a real Dossier or `null` (not
  // found/opted out/unapproved, all indistinguishable by design — see
  // fetchDossier's doc comment).
  const loading = dossier === undefined && !error;
  const slowLoad = useDelayedFlag(loading);

  return (
    <div className="flex-1 bg-surface-0">
      <PageHeader title={dossier ? dossier.name : "Player Dossier"} />

      <PageMain>
        {error ? (
          <ErrorAlert>Couldn&apos;t load this dossier: {error}</ErrorAlert>
        ) : loading ? (
          <Card role="status" aria-live="polite" className="p-4 shadow-sm">
            <span className="sr-only">Loading dossier…</span>
            <Skeleton className="h-4 w-28" />
            <div className="mt-3 flex flex-wrap gap-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 min-w-[6rem] flex-1" />
              ))}
            </div>
            {slowLoad && (
              <p className="mt-2 text-xs text-text-tertiary">
                Taking longer than usual — this app hasn&apos;t seen some of this player&apos;s
                events before, so it&apos;s asking Best Coast Pairings for them the first time.
              </p>
            )}
          </Card>
        ) : !dossier ? (
          <Card className="p-4 shadow-sm">
            <p className="text-sm text-text-secondary">
              This dossier isn&apos;t available — the link may be wrong, or the player has kept
              their dossier private.
            </p>
          </Card>
        ) : !dossier.linked || dossier.totalEvents === 0 ? (
          <Card className="p-4 shadow-sm">
            <p className="text-sm text-text-secondary">
              No concluded events published for {dossier.name} yet — a dossier fills in once Best
              Coast Pairings has a final placing for at least one event.
            </p>
          </Card>
        ) : (
          <Card className="p-4 shadow-sm">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-text-primary">{dossier.name}</h2>
              {formatMonthYear(dossier.competingSince) && (
                <p className="text-xs text-text-tertiary">
                  Competing since {formatMonthYear(dossier.competingSince)}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <StatTile label="Events played" value={String(dossier.totalEvents)} />
              <StatTile
                label="Best placing"
                value={dossier.bestPlacing !== undefined ? ordinal(dossier.bestPlacing.placing) : "—"}
                detail={fieldDetail(dossier.bestPlacing)}
              />
              <StatTile
                label="Best GT placing"
                value={dossier.bestPlacingGt !== undefined ? ordinal(dossier.bestPlacingGt.placing) : "—"}
                detail={fieldDetail(dossier.bestPlacingGt)}
              />
              <StatTile
                label="Best Teams placing"
                value={dossier.bestPlacingTeams !== undefined ? ordinal(dossier.bestPlacingTeams.placing) : "—"}
                detail={fieldDetail(dossier.bestPlacingTeams)}
              />
              <StatTile
                label="Best RTT placing"
                value={dossier.bestPlacingRtt !== undefined ? ordinal(dossier.bestPlacingRtt.placing) : "—"}
                detail={fieldDetail(dossier.bestPlacingRtt)}
              />
            </div>

            {dossier.factions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-surface-border pt-3">
                {dossier.factions.map((f) => (
                  <span
                    key={f.faction}
                    className="rounded-full border border-surface-border bg-surface-2 px-2.5 py-1 text-xs text-text-secondary"
                  >
                    {f.faction} · {f.eventCount} event{f.eventCount === 1 ? "" : "s"}
                    {f.bestPlacing !== undefined && ` · best ${ordinal(f.bestPlacing)}`}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-3 border-t border-surface-border pt-3 text-[11px] text-text-tertiary">
              Pulled from Best Coast Pairings&apos; own published results — Brass Ledger doesn&apos;t
              score or rank players itself.
            </p>
          </Card>
        )}
      </PageMain>
    </div>
  );
}

export default function DossierPage() {
  return <DossierContent />;
}
