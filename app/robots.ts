import type { MetadataRoute } from "next";

/**
 * Nearly every route here requires sign-in (see
 * useRedirectToLoginIfSignedOut) and just bounces a crawler back to
 * /login anyway, and this app fronts BCP's rate-limited, unofficial API
 * (see this repo's CLAUDE.md) — no reason to invite search crawlers to
 * hit any of that. /about and /login are the only two pages meant to be
 * publicly reachable, so they're the only two left open.
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
