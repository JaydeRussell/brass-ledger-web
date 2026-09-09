import type { CurrentUser } from "../../lib/auth";

type AccessStatusMessageProps = {
  // Only ever "pending" or "rejected" in practice — a caller checks
  // `user.status !== "approved"` before rendering this at all, and
  // "approved" means show the real page instead. Typed as the full
  // union anyway so this stays a compile error to forget a case if
  // Status ever grows a fourth value.
  status: CurrentUser["status"];
};

/**
 * What a signed-in account sees on every gated page (the root event
 * viewer, /calendar, /my-events, /stats) while it isn't "approved" yet
 * — see internal/user's migration 0007 and api.RequireApproved on the
 * backend, which is the actual enforcement this is just explaining.
 * Deliberately not shown on /welcome: a pending account can (and
 * should) still link its BCP profile while waiting — see
 * BCPHandler.Register's doc comment on brass-ledger-api for why that
 * one specific backend route stays reachable pre-approval.
 */
export default function AccessStatusMessage({ status }: AccessStatusMessageProps) {
  if (status === "rejected") {
    return (
      <div
        role="status"
        className="rounded-lg border border-dashed border-danger-500/40 p-6 text-center text-sm text-danger-600 dark:text-danger-400"
      >
        <p>Your access request wasn&apos;t approved.</p>
      </div>
    );
  }
  return (
    <div role="status" className="rounded-lg border border-dashed border-surface-border p-6 text-center text-sm text-text-secondary">
      <p>Your account is pending approval — check back soon.</p>
    </div>
  );
}
