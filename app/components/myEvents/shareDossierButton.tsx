"use client";
import { useState } from "react";
import { ordinal } from "../../lib/formatStats";
import type { Dossier } from "../../lib/dossier";
import { logClientEvent } from "../../lib/clientLog";
import { downloadShareCardImage } from "../../lib/shareCard";
import { useToast } from "../shared/toastContext";

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
 * The "Save image" button renders the same summary as a downloadable
 * PNG client-side (lib/shareCard.ts, native Canvas API) from data already
 * fetched for this page. Image generation stays in the browser because
 * every request goes straight from the browser to brass-ledger-api; a
 * server-rendered image would need the Next.js server to reach the API
 * on its own, a separate deploy-config decision.
 */
export default function ShareDossierButton({ dossier, bcpUserId }: { dossier: Dossier; bcpUserId: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

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

  const handleSaveImage = async () => {
    try {
      const result = await downloadShareCardImage(
        dossier,
        `${dossier.name.replace(/\s+/g, "-").toLowerCase()}-brass-ledger.png`
      );
      if (result === "cancelled") return;
      logClientEvent("info", `dossier: share image ${result}`, { bcpUserId });
      if (result === "downloaded") showToast("Share image downloaded.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logClientEvent("warn", "dossier: generating share image failed", { error: message });
      showToast("Couldn't generate the share image — try again.", "error");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        className="rounded-md border border-surface-border px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2"
      >
        {copied ? "Copied!" : "Share"}
      </button>
      <button
        type="button"
        onClick={handleSaveImage}
        title="Download a shareable image of this dossier"
        className="rounded-md border border-surface-border px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2"
      >
        Save image
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger-400">
          Couldn&apos;t copy — you can still copy this page&apos;s URL directly.
        </p>
      )}
    </div>
  );
}
