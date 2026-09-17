"use client";
import React from "react";

import AccessStatusMessage from "../../components/shared/accessStatusMessage";
import Spinner from "../../components/shared/spinner";
import Badge from "../../components/ui/badge";
import Button from "../../components/ui/button";
import Card from "../../components/ui/card";
import ErrorAlert from "../../components/ui/errorAlert";
import { Tabs, type TabItem } from "../../components/ui/tabs";
import PageHeader from "../../components/layout/pageHeader";
import PageMain from "../../components/layout/pageMain";
import { useRequireAdmin } from "../../lib/useRequireAdmin";
import { fetchAdminFeedback, resolveFeedback, reopenFeedback, type AdminFeedback } from "../../lib/adminFeedback";

type StatusTabKey = "open" | "resolved" | "all";
const STATUS_TABS: StatusTabKey[] = ["open", "resolved", "all"];
const STATUS_TAB_LABELS: Record<StatusTabKey, string> = { open: "Open", resolved: "Resolved", all: "All" };
const STATUS_TONE: Record<AdminFeedback["status"], "warning" | "success"> = { open: "warning", resolved: "success" };
const KIND_TONE: Record<AdminFeedback["kind"], "danger" | "brass"> = { bug: "danger", suggestion: "brass" };
const KIND_LABEL: Record<AdminFeedback["kind"], string> = { bug: "Bug", suggestion: "Suggestion" };

function formatFeedbackDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

type RowState = { saving: boolean; error: string | null };

/**
 * Feedback triage — the other of two admin-only pages (see
 * app/admin/accounts/page.tsx for the other, account approvals). Every bug
 * report/suggestion submitted through the floating feedback widget
 * (see internal/feedback + internal/api/admin.go's feedback routes),
 * previously only ever reachable as a section at the bottom of the
 * Accounts page below however many dozen accounts happened to be
 * listed — split out to its own page (with its own nav-drawer link,
 * see navDrawer.tsx's expandable Admin group) once that made it
 * effectively unreachable without a very long scroll.
 *
 * Fetches the full list in one call (small, seed-data-sized) and
 * filters/tabs it client-side by Open/Resolved/All, so a backlog of
 * open reports is easy to work through without the ones already
 * resolved in the way. Resolve/reopen is freely reversible either
 * direction, so neither needs a confirm step (unlike Accounts' Reject).
 *
 * Gating is useRequireAdmin's three-way check (signed-out -> /login,
 * signed-in non-admin -> /, admin-but-unapproved -> this page's own
 * AccessStatusMessage) — see that hook's doc comment.
 */
export default function AdminFeedbackPage() {
  const { user, checked, isAdmin } = useRequireAdmin();

  const [feedback, setFeedback] = React.useState<AdminFeedback[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [rowStates, setRowStates] = React.useState<Record<number, RowState>>({});
  const [statusTab, setStatusTab] = React.useState<StatusTabKey>("open");

  const load = React.useCallback(() => {
    setLoadError(null);
    fetchAdminFeedback()
      .then(setFeedback)
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : String(err)));
  }, []);

  React.useEffect(() => {
    if (checked && user && isAdmin && user.status === "approved") load();
  }, [checked, user, isAdmin, load]);

  function setRowState(id: number, state: RowState) {
    setRowStates((prev) => ({ ...prev, [id]: state }));
  }

  // Same optimistic-patch-then-revert-on-failure shape as adminUsers'
  // mutateRow.
  async function mutateRow(id: number, patch: Partial<AdminFeedback>, request: () => Promise<void>) {
    const previous = feedback;
    setFeedback((prev) => (prev ? prev.map((f) => (f.id === id ? { ...f, ...patch } : f)) : prev));
    setRowState(id, { saving: true, error: null });
    try {
      await request();
      setRowState(id, { saving: false, error: null });
    } catch (err) {
      setFeedback(previous);
      setRowState(id, { saving: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  // No client sort needed (unlike Accounts' "All" tab) — the backend
  // already returns open-first, and Open/Resolved is the whole set of
  // statuses, so there's nothing left to group within "All".
  const filteredFeedback = (feedback ?? []).filter((f) => statusTab === "all" || f.status === statusTab);

  if (!checked || !user || !isAdmin) {
    return (
      <div className="flex-1 bg-surface-0">
        <PageHeader title="Feedback" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-surface-0">
      <PageHeader title="Feedback" subtitle="Bug reports and suggestions submitted through the feedback widget." />

      <PageMain>
        {user.status !== "approved" ? (
          <AccessStatusMessage status={user.status} />
        ) : loadError ? (
          <ErrorAlert>
            Couldn&apos;t load feedback: {loadError}{" "}
            <button type="button" onClick={load} className="underline">
              Retry
            </button>
          </ErrorAlert>
        ) : feedback === null ? (
          <div role="status" aria-live="polite" className="flex items-center gap-2 p-4 text-sm text-text-secondary">
            <Spinner size="sm" />
            <span>Loading feedback…</span>
          </div>
        ) : feedback.length === 0 ? (
          <p className="p-4 text-sm text-text-secondary">No feedback submitted yet.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border">
              <Tabs
                value={statusTab}
                onValueChange={setStatusTab}
                label="Feedback status"
                tabs={STATUS_TABS.map(
                  (tab): TabItem<StatusTabKey> => ({
                    value: tab,
                    label: `${STATUS_TAB_LABELS[tab]} (${
                      feedback.filter((f) => tab === "all" || f.status === tab).length
                    })`,
                  })
                )}
              />
            </div>

            {filteredFeedback.length === 0 ? (
              <p className="p-4 text-sm text-text-secondary">No feedback matches.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredFeedback.map((row) => (
                  <FeedbackRow
                    key={row.id}
                    row={row}
                    rowState={rowStates[row.id]}
                    onResolve={() => mutateRow(row.id, { status: "resolved" }, () => resolveFeedback(row.id))}
                    onReopen={() => mutateRow(row.id, { status: "open" }, () => reopenFeedback(row.id))}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </PageMain>
    </div>
  );
}

type FeedbackRowProps = {
  row: AdminFeedback;
  rowState?: RowState;
  onResolve: () => void;
  onReopen: () => void;
};

// One report as a card, not a table row — `message` is free-form and
// often multi-line, which doesn't survive being squeezed into a table
// cell at any width.
function FeedbackRow({ row, rowState, onResolve, onReopen }: FeedbackRowProps) {
  const saving = rowState?.saving ?? false;

  return (
    <Card className="flex flex-col gap-2 p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={KIND_TONE[row.kind]}>{KIND_LABEL[row.kind]}</Badge>
        <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>
        <span className="text-xs text-text-tertiary">{formatFeedbackDate(row.createdAt)}</span>
      </div>

      <p className="whitespace-pre-wrap text-sm text-text-primary">{row.message}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
        {row.page && <span>Page: {row.page}</span>}
        {row.submittedBy && <span>From: {row.submittedBy}</span>}
        {row.contactEmail && <span>Contact: {row.contactEmail}</span>}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {row.status === "open" ? (
          <Button size="sm" variant="secondary" disabled={saving} onClick={onResolve}>
            Mark resolved
          </Button>
        ) : (
          <Button size="sm" variant="ghost" disabled={saving} onClick={onReopen}>
            Reopen
          </Button>
        )}
        {rowState?.error && (
          <p role="alert" className="w-full text-xs text-danger-400">
            {rowState.error}
          </p>
        )}
      </div>
    </Card>
  );
}
