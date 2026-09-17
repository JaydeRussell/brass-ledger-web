"use client";
import { useState } from "react";
import { ordinal } from "./playerStatsPanel";
import type { Dossier } from "../../lib/dossier";
import { logClientEvent } from "../../lib/clientLog";

/**
 * Builds the plain-text summary copied to the clipboard — a pure
 * function of already-fetched dossier data plus the page's own URL, so
 * it's testable without touching navigator.clipboard or window.location
 * at all (see this file's own test). Leads with the best overall
 * placing when there is one (more "worth sharing" than a bare event
 * count), falling back to just the event count for a dossier that has
 * events but never a published placing.
 */
export function buildShareText(dossier: Dossier, url: string): string {
  const eventCount = `${dossier.totalEvents} event${dossier.totalEvents === 1 ? "" : "s"}`;
  const topFaction = dossier.factions[0]?.faction;
  const factionPart = topFaction ? ` playing ${topFaction}` : "";
  const headline = dossier.bestPlacing
    ? `${ordinal(dossier.bestPlacing.placing)}-place best finish across ${eventCount}`
    : `${eventCount} played`;
  return `${dossier.name} — ${headline}${factionPart}. ${url}`;
}

/**
 * Copies a plain-text summary of this dossier (see buildShareText) plus
 * its own shareable URL to the clipboard — the "shareable result" this
 * app can offer without becoming its own OG-image-generation service.
 * next/og's ImageResponse was considered for a branded card image
 * instead (see the earlier concept mockup), but generating one means
 * this app's Next.js server calling brass-ledger-api itself for the
 * first time — every other request today goes straight from the
 * browser (see app/api/log/route.ts's own doc comment) — which in this
 * Docker Compose stack means a different, container-network hostname
 * than the browser-facing NEXT_PUBLIC_BACKEND_URL this app's clients
 * already use (see app/lib/*.ts). That's a deploy-config decision
 * (whether/how a server-reachable backend URL is wired up in
 * production), not something to introduce silently as part of this
 * feature — left as a clearly-scoped follow-up instead.
 */
export default function ShareDossierButton({ dossier, bcpUserId }: { dossier: Dossier; bcpUserId: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/dossier/${encodeURIComponent(bcpUserId)}`
        : `/dossier/${encodeURIComponent(bcpUserId)}`;
    try {
      await navigator.clipboard.writeText(buildShareText(dossier, url));
      setCopied(true);
      setError(null);
      logClientEvent("info", "dossier: share summary copied", { bcpUserId });
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      logClientEvent("warn", "dossier: copying share summary failed", { error: message });
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleShare}
        className="rounded-md border border-surface-border px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2"
      >
        {copied ? "Copied!" : "Share"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger-400">
          Couldn&apos;t copy — you can still copy this page&apos;s URL directly.
        </p>
      )}
    </div>
  );
}
