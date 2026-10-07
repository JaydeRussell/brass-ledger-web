"use client";
import { useEffect, useState } from "react";

import Button from "../ui/button";
import Card from "../ui/card";
import ConfirmDialog from "../ui/confirmDialog";
import { useToast } from "../shared/toastContext";
import { logClientEvent } from "../../lib/clientLog";
import { createFollowLink, deleteFollowLink, fetchMyFollowLink, followLinkUrl, type FollowLink } from "../../lib/follow";

/**
 * Lets a player share a link that shows this event from their side, to
 * anyone, signed in or not. The link stops working a week after the event.
 * Once the event has ended only an existing link is offered, since a new
 * one could already be past that week.
 */
export default function ShareFollowLink({ eventId, canCreate }: { eventId: string; canCreate: boolean }) {
  const [link, setLink] = useState<FollowLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    fetchMyFollowLink(eventId)
      .then((existing) => {
        if (!cancelled) setLink(existing);
      })
      .catch((err: unknown) => {
        logClientEvent("warn", "follow link: lookup failed", { error: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const share = async () => {
    setBusy(true);
    try {
      const created = !link;
      const current = link ?? (await createFollowLink(eventId));
      setLink(current);
      const url = followLinkUrl(current.token);
      // Safari only allows sharing and copying straight from a tap, and the
      // request to create the link uses that up on the first share.
      const ready = () => showToast("Follow link ready. Tap Share follow link to send it.", "success");
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({ title: "Follow my event on Brass Ledger", url });
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          if (created && err instanceof DOMException && err.name === "NotAllowedError") return ready();
        }
      }
      try {
        await navigator.clipboard.writeText(url);
      } catch (err) {
        if (created) return ready();
        throw err;
      }
      showToast("Follow link copied.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't create the link.", "error");
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      await deleteFollowLink(eventId);
      setLink(null);
      showToast("Follow link turned off.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't turn the link off.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!link && !canCreate) return null;

  return (
    <Card className="p-4 shadow-sm">
      <p className="font-semibold text-text-primary">Let someone follow along</p>
      <p className="mt-1 text-sm text-text-secondary">
        Share a link that shows this event from your side: your round, your team, and your rows on Pairings and
        Placings. Anyone with the link can open it, no account needed. It stops working a week after the event.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="primary" size="sm" onClick={share} disabled={busy}>
          {link ? "Share follow link" : "Create follow link"}
        </Button>
        {link && (
          <Button variant="ghost" size="sm" onClick={() => setConfirmOff(true)} disabled={busy}>
            Turn off link
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmOff}
        onOpenChange={setConfirmOff}
        title="Turn off this follow link?"
        description="Anyone you've shared it with will lose access, and it leaves their Spectating list. You can create a new link afterwards."
        confirmLabel="Turn off"
        confirmVariant="danger"
        onConfirm={turnOff}
      />
    </Card>
  );
}
