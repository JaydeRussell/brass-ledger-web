"use client";
import { useState } from "react";
import Link from "next/link";
import { setDossierVisibility } from "../../lib/dossier";
import { logClientEvent } from "../../lib/clientLog";

type DossierVisibilityToggleProps = {
  bcpUserId: string;
  dossierPublic: boolean;
  // Called with the new value once the backend confirms it — the caller
  // (StatsPage) folds this back into its own `user` state, same pattern
  // as BcpProfileLinker's onLinked.
  onChange: (dossierPublic: boolean) => void;
};

/**
 * Turns the signed-in account's public dossier (see app/lib/dossier.ts,
 * app/dossier/[bcpUserId]/page.tsx) on or off. Lives on the Stats page
 * rather than the nav drawer's compact account card — this page already
 * shows exactly what a dossier would display, which is the right place
 * to also decide whether anyone else can see it.
 *
 * Deliberately awaits the backend confirmation before flipping the
 * switch's own displayed state (rather than optimistic-update-then-
 * reconcile, the pattern follows.ts's sync uses) — this is a privacy
 * setting, not a "did my click register" convenience, so a failure
 * should leave the visible state exactly as it was rather than briefly
 * showing "public" when the save didn't actually take.
 */
export default function DossierVisibilityToggle({
  bcpUserId,
  dossierPublic,
  onChange,
}: DossierVisibilityToggleProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    if (saving) return;
    const next = !dossierPublic;
    setSaving(true);
    setError(null);
    try {
      await setDossierVisibility(next);
      logClientEvent("info", "stats: dossier visibility changed", { public: next });
      onChange(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      logClientEvent("error", "stats: setting dossier visibility failed", { error: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">Public dossier</p>
        <p className="mt-0.5 text-xs text-text-secondary">
          {dossierPublic ? (
            <>
              Anyone with the link can see this.{" "}
              <Link href={`/dossier/${encodeURIComponent(bcpUserId)}`} className="text-brass-400 hover:underline">
                View it
              </Link>
              .
            </>
          ) : (
            "Hidden — only you can see this."
          )}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-xs text-danger-400">
            {error}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={dossierPublic}
        aria-label="Public dossier"
        onClick={toggle}
        disabled={saving}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-50 ${
          dossierPublic ? "border-brass-500 bg-brass-500" : "border-surface-border bg-surface-2"
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface-0 transition-transform ${
            dossierPublic ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
