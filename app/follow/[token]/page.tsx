"use client";
import React, { Suspense } from "react";
import { useParams } from "next/navigation";

import EventView, { type FollowLinkView } from "../../event/eventView";
import Card from "../../components/ui/card";
import ErrorAlert from "../../components/ui/errorAlert";
import PageHeader from "../../components/layout/pageHeader";
import PageMain from "../../components/layout/pageMain";
import Spinner from "../../components/shared/spinner";
import { resolveFollowLink } from "../../lib/follow";
import { useDelayedFlag } from "../../lib/useDelayedFlag";

type LinkState = { status: "loading" } | { status: "dead" } | { status: "error"; message: string } | { status: "ok"; view: FollowLinkView };

/**
 * A follow link: the event as the player who shared it sees it. Works
 * signed out; a signed-in visitor also gets it saved to Spectating.
 */
function FollowPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ? decodeURIComponent(params.token) : "";
  const [state, setState] = React.useState<LinkState>({ status: "loading" });
  const slow = useDelayedFlag(state.status === "loading");

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    resolveFollowLink(token)
      .then((resolved) => {
        if (cancelled) return;
        setState(resolved ? { status: "ok", view: { token, ...resolved } } : { status: "dead" });
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ status: "error", message: err instanceof Error ? err.message : "an unknown error" });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.status === "ok") return <EventView key={state.view.token} follow={state.view} />;

  return (
    <div className="flex-1 bg-surface-0">
      <PageHeader title="Brass Ledger" />
      <PageMain>
        {state.status === "dead" || !token ? (
          <Card className="p-4 shadow-sm">
            <p className="font-semibold text-text-primary">This link has expired or been turned off</p>
            <p className="mt-1 text-sm text-text-secondary">
              Follow links stop working a week after their event, or when the player who shared one turns it off.
              Ask them for a new one.
            </p>
          </Card>
        ) : state.status === "error" ? (
          <ErrorAlert>Couldn&apos;t open this link: {state.message}</ErrorAlert>
        ) : (
          <div role="status" aria-live="polite" className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Spinner size="sm" />
              <span>Opening the link…</span>
            </div>
            {slow && <p className="text-xs text-text-tertiary">Taking longer than usual.</p>}
          </div>
        )}
      </PageMain>
    </div>
  );
}

export default function FollowRoute() {
  return (
    <Suspense fallback={null}>
      <FollowPage />
    </Suspense>
  );
}
