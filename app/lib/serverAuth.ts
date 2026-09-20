import { cookies } from "next/headers";

import type { CurrentUser } from "./auth";

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/**
 * How long the server-side /api/me lookup may take before the render
 * gives up on it.
 *
 * This sits on the critical path of the HTML, which the client-side
 * lookup it replaces did not — so a slow or unreachable backend must
 * degrade to "we don't know, let the client ask" rather than hold the
 * page. Short on purpose: the call is Worker-to-container inside
 * Cloudflare's own network, and anything near this budget means
 * something is wrong rather than merely busy.
 */
const SERVER_AUTH_TIMEOUT_MS = 1500;

/**
 * Resolves the signed-in user during server render, so the page can be
 * built knowing who is looking at it.
 *
 * Returns `undefined` for "couldn't tell" and `null` for "definitely
 * signed out" — see CurrentUserProvider's initialUser prop, which
 * treats those very differently. Anything unexpected here resolves to
 * `undefined`, because the failure mode of guessing "signed out" is
 * bouncing a signed-in person to /login.
 *
 * This only works because the session cookie is scoped to the
 * registrable domain (SESSION_COOKIE_DOMAIN in the backend), so it
 * reaches this host as well as api.brass-ledger.app. A server-side
 * fetch sends no Origin header and the backend passes those straight
 * through CORS, so nothing about CORS changes.
 */
export async function resolveCurrentUserOnServer(): Promise<CurrentUser | null | undefined> {
  let session: string | undefined;
  try {
    session = (await cookies()).get("session")?.value;
  } catch {
    // No request context to read (a static render, a build-time pass).
    // Not an error, just nothing to say.
    return undefined;
  }

  // No cookie is a real answer, and a cheap one: don't spend a round
  // trip confirming that a signed-out visitor is signed out.
  if (!session) return null;

  try {
    const res = await fetch(`${BACKEND_API_BASE}/api/me`, {
      headers: { cookie: `session=${session}` },
      cache: "no-store",
      signal: AbortSignal.timeout(SERVER_AUTH_TIMEOUT_MS),
    });
    if (res.status === 401) return null;
    if (!res.ok) return undefined;
    return (await res.json()) as CurrentUser;
  } catch {
    // Timeout, network failure, malformed body. The client will ask
    // again; the page still renders.
    return undefined;
  }
}
