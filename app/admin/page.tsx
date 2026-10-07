import type { Metadata } from "next";

import ClientRedirect from "../components/shared/clientRedirect";

export const metadata: Metadata = { title: "Admin" };

// Bare /admin has no content of its own — it's just the two real pages'
// shared "Admin" grouping in the nav drawer (see navDrawer.tsx's
// expandable Admin group). Anyone who lands here directly (an old
// bookmark, a typed-in URL) goes straight to Accounts, the first of the
// two; gating (signed-out/non-admin/unapproved) happens there, not here.
export default function AdminIndexPage() {
  return <ClientRedirect to="/admin/accounts" />;
}
