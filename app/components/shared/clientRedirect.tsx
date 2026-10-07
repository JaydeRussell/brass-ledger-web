"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Sends the visitor on to `to` once the page loads. Used instead of
 * next/navigation's server redirect(), which throws on the deployed
 * Workers runtime (Cloudflare error 1101) while working under `next start`.
 */
export default function ClientRedirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return null;
}
