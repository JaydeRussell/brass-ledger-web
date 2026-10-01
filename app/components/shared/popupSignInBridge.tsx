"use client";
import { useEffect } from "react";
import {
  OPENER_KEY,
  SIGN_IN_CHANNEL,
  consumePendingSignIn,
  type SignInCompleteMessage,
} from "../../lib/popupSignIn";
import { logClientEvent } from "../../lib/clientLog";

/**
 * Both ends of the installed-iPhone popup sign-in (see
 * lib/popupSignIn.ts). Renders nothing; mounted once in app/layout.tsx.
 *
 * In the popup, arriving back on this app after the backend's callback:
 * reports the page sign-in landed on (where a returning user was headed,
 * or /welcome for a new one) and closes itself.
 *
 * In the window that opened it: listens for that report and loads the
 * same page, now with the session cookie, so the server render picks up
 * the signed-in account.
 */
export default function PopupSignInBridge() {
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(SIGN_IN_CHANNEL);

    let path: string | null = null;
    try {
      path = consumePendingSignIn(
        window.localStorage,
        window.sessionStorage,
        Date.now(),
        window.location.pathname + window.location.search,
      );
    } catch {
      // storage unavailable — nothing was started from this device
    }

    if (path) {
      const message: SignInCompleteMessage = { type: "signed-in", path };
      logClientEvent("info", "popup sign-in: finished, handing back to app", { path });
      channel.postMessage(message);
      // Allowed because a script opened this window. If iOS keeps it
      // open anyway, the person is left on the same signed-in page and
      // can dismiss it.
      window.close();
      return () => channel.close();
    }

    channel.onmessage = (event: MessageEvent<SignInCompleteMessage>) => {
      if (event.data?.type !== "signed-in") return;
      const { path: target } = event.data;
      if (!target.startsWith("/") || target.startsWith("//")) return;
      try {
        if (!window.sessionStorage.getItem(OPENER_KEY)) return;
        window.sessionStorage.removeItem(OPENER_KEY);
      } catch {
        return;
      }
      window.location.assign(target);
    };
    return () => channel.close();
  }, []);

  return null;
}
