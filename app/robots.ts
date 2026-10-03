import type { MetadataRoute } from "next";

/**
 * Nearly every route here requires sign-in (see
 * useRedirectToLoginIfSignedOut) and just bounces a crawler back to
 * /login anyway, and this app fronts BCP's rate-limited, unofficial API
 * (see this repo's CLAUDE.md) — no reason to invite search crawlers to
 * hit any of that. Only /about and /login are left open to crawlers.
 * Public dossiers, the wiki and the changelog are reachable by link but
 * stay uncrawled: a dossier is shared on purpose, not published.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/about", "/login"],
      disallow: "/",
    },
  };
}
