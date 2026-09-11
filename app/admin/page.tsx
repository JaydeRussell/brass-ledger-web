"use client";
import React from "react";
import { useRouter } from "next/navigation";

import AccessStatusMessage from "../components/shared/accessStatusMessage";
import Spinner from "../components/shared/spinner";
import Badge from "../components/ui/badge";
import Button from "../components/ui/button";
import Card from "../components/ui/card";
import ErrorAlert from "../components/ui/errorAlert";
import PageHeader from "../components/layout/pageHeader";
import PageMain from "../components/layout/pageMain";
import { useCurrentUser } from "../lib/auth";
import { useRedirectToLoginIfSignedOut } from "../lib/useRedirectToLoginIfSignedOut";
import { fetchAdminUsers, approveUser, rejectUser, setUserRole, type AdminUser } from "../lib/adminUsers";

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

type RowState = { saving: boolean; error: string | null };

/**
 * The one admin-only surface in this app: list every account and
 * approve/reject/re-role them (see internal/api/admin.go — the backend
 * for this has existed since the roles/access-control work, with no
 * frontend until now). A single pending-first list, not per-status
 * tabs — the backend already sorts it that way, so this is one queue to
 * work through rather than several silos.
 *
 * Gating is layered, in order: signed-out -> /login (shared with every
 * other page). Signed-in but not an admin -> redirect to / rather than
 * showing this page's own AccessStatusMessage, which would misleadingly
 * imply a plain approved user is "pending" or "rejected" when they're
 * simply not an admin. Only once role === "admin" does the normal
 * status !== "approved" check apply (AccessStatusMessage) — covers the
 * edge case of an admin account that's somehow not approved.
 */
export default function AdminPage() {
  const { user, checked } = useCurrentUser();
  useRedirectToLoginIfSignedOut(user, checked);
  const router = useRouter();

  const isAdmin = checked && user ? user.role === "admin" : null;

  React.useEffect(() => {
    if (checked && user && !isAdmin) {
      router.replace("/");
    }
  }, [checked, user, isAdmin, router]);

  const [users, setUsers] = React.useState<AdminUser[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [rowStates, setRowStates] = React.useState<Record<number, RowState>>({});

  const load = React.useCallback(() => {
    setLoadError(null);
    fetchAdminUsers()
      .then(setUsers)
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : String(err)));
  }, []);

  React.useEffect(() => {
    if (checked && user && isAdmin && user.status === "approved") load();
  }, [checked, user, isAdmin, load]);

  function setRowState(id: number, state: RowState) {
    setRowStates((prev) => ({ ...prev, [id]: state }));
  }

  // Optimistic: patch `users` immediately for instant feedback, await the
  // real request, and on failure revert to the snapshot taken before the
  // patch — so one failed action doesn't disrupt the rest of the list or
  // require a full re-fetch to recover.
  async function mutateRow(id: number, patch: Partial<AdminUser>, request: () => Promise<void>) {
    const previous = users;
    setUsers((prev) => (prev ? prev.map((u) => (u.id === id ? { ...u, ...patch } : u)) : prev));
    setRowState(id, { saving: true, error: null });
    try {
      await request();
      setRowState(id, { saving: false, error: null });
    } catch (err) {
      setUsers(previous);
      setRowState(id, { saving: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  if (!checked || !user || !isAdmin) {
    // Either still checking, about to be redirected (signed-out or
    // non-admin), or the redirect effect above hasn't fired yet on this
    // render — render nothing rather than a flash of admin content.
    return (
      <div className="flex-1 bg-surface-0">
        <PageHeader title="Admin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-surface-0">
      <PageHeader title="Admin" />

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
        ) : users === null ? (
          <div role="status" aria-live="polite" className="flex items-center gap-2 p-4 text-sm text-text-secondary">
            <Spinner size="sm" />
            <span>Loading accounts…</span>
          </div>
        ) : users.length === 0 ? (
          <p className="p-4 text-sm text-text-secondary">No accounts found.</p>
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
                  {users.map((row) => (
                    <AdminRow
                      key={row.id}
                      row={row}
                      isSelf={row.id === user.id}
                      rowState={rowStates[row.id]}
                      onApprove={() => mutateRow(row.id, { status: "approved" }, () => approveUser(row.id))}
                      onReject={() => mutateRow(row.id, { status: "rejected" }, () => rejectUser(row.id))}
                      onSetRole={(role) => mutateRow(row.id, { role }, () => setUserRole(row.id, role))}
                      layout="table"
                    />
                  ))}
                </tbody>
              </table>
            </Card>

            <div className="flex flex-col gap-2 sm:hidden">
              {users.map((row) => (
                <AdminRow
                  key={row.id}
                  row={row}
                  isSelf={row.id === user.id}
                  rowState={rowStates[row.id]}
                  onApprove={() => mutateRow(row.id, { status: "approved" }, () => approveUser(row.id))}
                  onReject={() => mutateRow(row.id, { status: "rejected" }, () => rejectUser(row.id))}
                  onSetRole={(role) => mutateRow(row.id, { role }, () => setUserRole(row.id, role))}
                  layout="card"
                />
              ))}
            </div>
          </>
        )}
      </PageMain>
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
        <p role="alert" className="w-full text-xs text-danger-600 dark:text-danger-400">
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
