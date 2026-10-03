"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { useCurrentUser } from "../../lib/auth";
import Button from "../ui/button";
import ErrorAlert from "../ui/errorAlert";

/**
 * Shown when a visitor with a session cookie couldn't be checked because
 * the backend didn't answer. Gated pages stay blank rather than redirect
 * to /login in that case (see useRedirectToLoginIfSignedOut), so this is
 * what tells the visitor why. The event page shows its own banner, since
 * it can fall back to a cached snapshot.
 */
export default function ServerUnreachableNotice() {
  const { user, checked, authError, refresh } = useCurrentUser();
  const pathname = usePathname();
  const [retrying, setRetrying] = useState(false);

  if (!checked || user || !authError || pathname === "/event") return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-4">
      <ErrorAlert className="flex flex-wrap items-center justify-between gap-2">
        <span>Can&apos;t reach the Brass Ledger server right now.</span>
        <Button
          size="sm"
          disabled={retrying}
          onClick={() => {
            setRetrying(true);
            void refresh().finally(() => setRetrying(false));
          }}
        >
          {retrying ? "Trying…" : "Try again"}
        </Button>
      </ErrorAlert>
    </div>
  );
}
