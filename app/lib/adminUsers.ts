// Client for this app's own backend's admin routes (see
// internal/api/admin.go in the brass-ledger-api repo): listing every
// account and approving/rejecting/re-roling them. Every route here
// requires the signed-in account to be an approved admin — a non-admin
// or unapproved caller gets a 401/403 the accounts page's own client-side
// gating should make unreachable in normal use (see
// app/admin/accounts/page.tsx).
//
// Same credentials/error-decoding shape as myEvents.ts and auth.ts —
// duplicated here rather than shared, matching how each app/lib/*.ts
// module keeps its own small copy of this pattern.

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export type AdminUser = {
  id: number;
  email: string;
  name: string;
  avatarUrl: string;
  // "" if this account hasn't linked a Best Coast Pairings profile yet —
  // never null (see internal/api/admin.go's adminUserResponse).
  bcpUserId: string;
  role: "user" | "admin";
  status: "pending" | "approved" | "rejected";
};

export type AdminUserStatusFilter = "all" | AdminUser["status"];

// Every account status's total, independent of whatever status/search
// filter a given fetchAdminUsers call used — what the accounts page's
// tab labels ("Pending (56)") need regardless of what's currently paged
// or searched (see internal/user.UserStatusCounts).
export type AdminUserCounts = Record<AdminUserStatusFilter, number>;

export type AdminUsersPage = {
  items: AdminUser[];
  // Total accounts matching this call's status/search filter (for
  // computing page count) — not the same as counts.all, which ignores
  // both filters.
  total: number;
  counts: AdminUserCounts;
};

/**
 * Decodes a fetch Response as JSON, throwing using the backend's own
 * `{error}` message on a non-ok response (falling back to a generic
 * message if the body isn't parseable JSON). A 204 (every mutation
 * route here) has no body to parse, so `text` is empty and this
 * resolves to `null` — callers that only care about success/failure
 * (approveUser/rejectUser/setUserRole below) just await the Promise and
 * ignore the resolved value.
 */
async function handleJSONResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let message = `Request failed: HTTP ${res.status}`;
    try {
      const body = JSON.parse(text) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // Body wasn't JSON — keep the generic message above.
    }
    throw new Error(message);
  }
  if (text.length === 0) return null as T;
  return JSON.parse(text) as T;
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_API_BASE}${path}`, { credentials: "include" });
  return handleJSONResponse<T>(res);
}

async function postJSON<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BACKEND_API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return handleJSONResponse<T>(res);
}

/**
 * One page of accounts, filtered/paginated server-side — see GET
 * /api/admin/users?status=&q=&page=&pageSize=. `status` omitted or
 * "all" means no status filter; `page` is 1-based; `pageSize` is
 * clamped server-side (see internal/user.Store.ListUsers). Every
 * argument is optional so a bare `fetchAdminUsers()` still works (the
 * server's own defaults apply), but the accounts page always passes all
 * four explicitly since it needs to control paging itself.
 */
export async function fetchAdminUsers(opts: {
  status?: AdminUserStatusFilter;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<AdminUsersPage> {
  const params = new URLSearchParams();
  if (opts.status && opts.status !== "all") params.set("status", opts.status);
  if (opts.search) params.set("q", opts.search);
  if (opts.page) params.set("page", String(opts.page));
  if (opts.pageSize) params.set("pageSize", String(opts.pageSize));
  const query = params.toString();
  return getJSON<AdminUsersPage>(`/api/admin/users${query ? `?${query}` : ""}`);
}

export async function approveUser(id: number): Promise<void> {
  await postJSON(`/api/admin/users/${id}/approve`);
}

export async function rejectUser(id: number): Promise<void> {
  await postJSON(`/api/admin/users/${id}/reject`);
}

/**
 * Throws with the exact message `"can't demote your own account"` (see
 * internal/api/admin.go's SetRole) if `id` is the caller's own account
 * and `role` is "user" — the admin page disables that control
 * proactively, but still needs to handle this as defense-in-depth.
 */
export async function setUserRole(id: number, role: "user" | "admin"): Promise<void> {
  await postJSON(`/api/admin/users/${id}/role`, { role });
}
