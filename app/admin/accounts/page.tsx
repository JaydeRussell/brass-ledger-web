"use client";
import React from "react";

import AccessStatusMessage from "../../components/shared/accessStatusMessage";
import Spinner from "../../components/shared/spinner";
import Badge from "../../components/ui/badge";
import Button from "../../components/ui/button";
import Card from "../../components/ui/card";
import ConfirmDialog from "../../components/ui/confirmDialog";
import ErrorAlert from "../../components/ui/errorAlert";
import { Tabs, type TabItem } from "../../components/ui/tabs";
import PageHeader from "../../components/layout/pageHeader";
import PageMain from "../../components/layout/pageMain";
import { useRequireAdmin } from "../../lib/useRequireAdmin";
import {
  fetchAdminUsers,
  approveUser,
  rejectUser,
  setUserRole,
  type AdminUser,
  type AdminUserStatusFilter,
  type AdminUsersPage,
} from "../../lib/adminUsers";

const STATUS_TABS: AdminUserStatusFilter[] = ["all", "pending", "approved", "rejected"];
const STATUS_TAB_LABELS: Record<AdminUserStatusFilter, string> = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

const STATUS_TONE: Record<AdminUser["status"], "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

// Options for the page-size picker below — 5 is the default (also
// Store.ListUsers' own server-side default), adjustable up to a screen's
// worth or two for anyone who'd rather scroll less and page less often.
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 5;

// How long to wait after the last keystroke before actually re-fetching
// on a search change — this is our own backend, not a rate-limited
// third-party one, but there's still no reason to fire a request per
// keystroke.
const SEARCH_DEBOUNCE_MS = 300;

type RowState = { saving: boolean; error: string | null };

/**
 * Account approvals — one of two admin-only pages (see
 * app/admin/feedback/page.tsx for the other, bug reports/suggestions).
 * List every account and approve/reject/re-role them (see
 * internal/api/admin.go — the backend for this since the roles/access-
 * control work). Filtering (status tab, name/email search) and
 * pagination both happen server-side (internal/user.Store.ListUsers) —
 * this page just holds the current status/search/page/pageSize as state
 * and re-fetches whenever any of them change, so a batch of new sign-ups
 * after an event is easy to work through without pulling every account
 * into the browser at once.
 *
 * Reject has an explicit confirm step (ConfirmDialog) since it's a
 * one-way action a new user can't self-recover from — Approve and the
 * role toggle stay a single click, matching how the rest of this app
 * only asks twice for something hard to undo. A mutation re-fetches the
 * current page afterward (rather than patching state locally) since an
 * approve/reject can move a row out of the currently-selected status
 * tab entirely — simplest way to keep the list, its counts, and its
 * page count all correct.
 *
 * Gating is useRequireAdmin's three-way check (signed-out -> /login,
 * signed-in non-admin -> /, admin-but-unapproved -> this page's own
 * AccessStatusMessage) — see that hook's doc comment.
 */
export default function AdminAccountsPage() {
  const { user, checked, isAdmin } = useRequireAdmin();

  const [data, setData] = React.useState<AdminUsersPage | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [rowStates, setRowStates] = React.useState<Record<number, RowState>>({});
  const [statusTab, setStatusTab] = React.useState<AdminUserStatusFilter>("all");
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(DEFAULT_PAGE_SIZE);
  // The row a Reject click is waiting on confirmation for — null means no
  // dialog open. Holding the whole row (not just an id) lets the dialog
  // show the account's name without a second lookup.
  const [confirmReject, setConfirmReject] = React.useState<AdminUser | null>(null);

  // Debounces searchInput (what the text box shows) into search (what
  // actually gets sent to the server) — see SEARCH_DEBOUNCE_MS.
  React.useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Back to page 1 whenever the tab, search, or page size narrows/
  // widens the list — otherwise switching from a long "All" list to
  // "Rejected" (or a bigger page size) could leave you stranded on a
  // page number that filter/size doesn't have.
  React.useEffect(() => {
    setPage(1);
  }, [statusTab, search, pageSize]);

  const load = React.useCallback(() => {
    setLoadError(null);
    fetchAdminUsers({ status: statusTab, search, page, pageSize })
      .then(setData)
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : String(err)));
  }, [statusTab, search, page, pageSize]);

  React.useEffect(() => {
    if (checked && user && isAdmin && user.status === "approved") load();
  }, [checked, user, isAdmin, load]);

  function setRowState(id: number, state: RowState) {
    setRowStates((prev) => ({ ...prev, [id]: state }));
  }

  // Re-fetches the current page on success rather than patching state
  // locally — an approve/reject can move a row out of the currently-
  // selected status tab, so a local patch would leave a stale row
  // sitting under the wrong tab until the next reload anyway.
  async function mutateRow(id: number, request: () => Promise<void>) {
    setRowState(id, { saving: true, error: null });
    try {
      await request();
      setRowState(id, { saving: false, error: null });
      load();
    } catch (err) {
      setRowState(id, { saving: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  if (!checked || !user || !isAdmin) {
    // Either still checking, about to be redirected (signed-out or
    // non-admin), or the redirect effect above hasn't fired yet on this
    // render — render nothing rather than a flash of admin content.
    return (
      <div className="flex-1 bg-surface-0">
        <PageHeader title="Accounts" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-surface-0">
      <PageHeader title="Accounts" subtitle="Accounts awaiting approval, plus every account's role and status." />

      <PageMain>
        {user.status !== "approved" ? (
          <AccessStatusMessage status={user.status} />
        ) : loadError ? (
          <ErrorAlert>
            Couldn&apos;t load accounts: {loadError}{" "}
            <button type="button" onClick={load} className="underline">
              Retry
            </button>
          </ErrorAlert>
        ) : data === null ? (
          <div role="status" aria-live="polite" className="flex items-center gap-2 p-4 text-sm text-text-secondary">
            <Spinner size="sm" />
            <span>Loading accounts…</span>
          </div>
        ) : data.counts.all === 0 ? (
          <p className="p-4 text-sm text-text-secondary">No accounts found.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border">
              <Tabs
                value={statusTab}
                onValueChange={setStatusTab}
                label="Account status"
                tabs={STATUS_TABS.map(
                  (tab): TabItem<AdminUserStatusFilter> => ({
                    value: tab,
                    label: `${STATUS_TAB_LABELS[tab]} (${data.counts[tab]})`,
                  })
                )}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email…"
                className="min-w-0 flex-1 rounded-md border border-surface-border bg-surface-0 px-3 py-2 text-sm text-text-primary outline-none focus:border-brass-500"
              />
              <label className="flex shrink-0 items-center gap-2 text-sm text-text-secondary">
                Show
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-md border border-surface-border bg-surface-0 px-2 py-1.5 text-sm text-text-primary outline-none focus:border-brass-500"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {data.items.length === 0 ? (
              <p className="p-4 text-sm text-text-secondary">No accounts match.</p>
            ) : (
              <>
                {/* Table layout at sm+; a stacked card list below that, same
                    "two renders, CSS picks which shows" approach as elsewhere
                    in this app for a data-dense view that doesn't survive a
                    phone-width table well (unlike PlacingsTable's few, purely
                    numeric columns, this row has real interactive controls
                    that need room, not just a horizontal scroll). */}
                <Card className="hidden overflow-hidden shadow-sm sm:block">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-surface-border bg-surface-2 text-left text-xs text-text-secondary">
                        <th className="px-3 py-2 font-medium">Account</th>
                        <th className="px-3 py-2 font-medium">BCP</th>
                        <th className="px-3 py-2 font-medium">Role</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((row) => (
                        <AdminRow
                          key={row.id}
                          row={row}
                          isSelf={row.id === user.id}
                          rowState={rowStates[row.id]}
                          onApprove={() => mutateRow(row.id, () => approveUser(row.id))}
                          onReject={() => setConfirmReject(row)}
                          onSetRole={(role) => mutateRow(row.id, () => setUserRole(row.id, role))}
                          layout="table"
                        />
                      ))}
                    </tbody>
                  </table>
                </Card>

                <div className="flex flex-col gap-2 sm:hidden">
                  {data.items.map((row) => (
                    <AdminRow
                      key={row.id}
                      row={row}
                      isSelf={row.id === user.id}
                      rowState={rowStates[row.id]}
                      onApprove={() => mutateRow(row.id, () => approveUser(row.id))}
                      onReject={() => setConfirmReject(row)}
                      onSetRole={(role) => mutateRow(row.id, () => setUserRole(row.id, role))}
                      layout="card"
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between gap-3 text-sm text-text-secondary">
                    <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      Previous
                    </Button>
                    <span>
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </PageMain>

      <ConfirmDialog
        open={confirmReject !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmReject(null);
        }}
        title="Reject this account?"
        description={
          confirmReject
            ? `${confirmReject.name} (${confirmReject.email}) won't be able to sign back in unless approved again later.`
            : undefined
        }
        confirmLabel="Reject"
        confirmVariant="danger"
        onConfirm={() => {
          if (!confirmReject) return;
          mutateRow(confirmReject.id, () => rejectUser(confirmReject.id));
        }}
      />
    </div>
  );
}

type AdminRowProps = {
  row: AdminUser;
  isSelf: boolean;
  rowState?: RowState;
  onApprove: () => void;
  onReject: () => void;
  onSetRole: (role: "user" | "admin") => void;
  layout: "table" | "card";
};

function AdminRow({ row, isSelf, rowState, onApprove, onReject, onSetRole, layout }: AdminRowProps) {
  const saving = rowState?.saving ?? false;
  // Self-demotion primary defense: disable "Make user" on the signed-in
  // admin's own admin-role row (the backend's own 400 is still handled
  // as defense-in-depth via rowState.error, since onSetRole's caller —
  // mutateRow — surfaces whatever the request throws).
  const demoteDisabled = isSelf && row.role === "admin";

  const identity = (
    <div className="flex min-w-0 items-center gap-2">
      {row.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full" referrerPolicy="no-referrer" />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-text-secondary">
          {initials(row.name)}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">
          {row.name}
          {isSelf && <span className="ml-1.5 font-normal text-text-tertiary">(you)</span>}
        </p>
        <p className="truncate text-xs text-text-secondary">{row.email}</p>
      </div>
    </div>
  );

  const bcpLinked = (
    <Badge tone={row.bcpUserId ? "brass" : "neutral"}>{row.bcpUserId ? "Linked" : "Not linked"}</Badge>
  );
  const roleBadge = <Badge tone={row.role === "admin" ? "brass" : "neutral"}>{row.role}</Badge>;
  const statusBadge = <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>;

  const actions = (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button size="sm" variant="secondary" disabled={saving} onClick={onApprove}>
        Approve
      </Button>
      <Button size="sm" variant="danger" disabled={saving} onClick={onReject}>
        Reject
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={saving || (row.role === "admin" ? demoteDisabled : false)}
        title={demoteDisabled ? "You can't demote your own account" : undefined}
        onClick={() => onSetRole(row.role === "admin" ? "user" : "admin")}
      >
        {row.role === "admin" ? "Make user" : "Make admin"}
      </Button>
      {rowState?.error && (
        <p role="alert" className="w-full text-xs text-danger-400">
          {rowState.error}
        </p>
      )}
    </div>
  );

  if (layout === "table") {
    return (
      <tr className="border-t border-surface-border align-top">
        <td className="px-3 py-2.5">{identity}</td>
        <td className="px-3 py-2.5">{bcpLinked}</td>
        <td className="px-3 py-2.5">{roleBadge}</td>
        <td className="px-3 py-2.5">{statusBadge}</td>
        <td className="px-3 py-2.5">{actions}</td>
      </tr>
    );
  }

  return (
    <Card className="flex flex-col gap-2 p-3 shadow-sm">
      {identity}
      <div className="flex flex-wrap gap-1.5">
        {bcpLinked}
        {roleBadge}
        {statusBadge}
      </div>
      {actions}
    </Card>
  );
}
