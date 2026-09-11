import PageHeader from "../components/layout/pageHeader";
import PageMain from "../components/layout/pageMain";
import Card from "../components/ui/card";
import { CHANGELOG } from "../lib/changelog";

/**
 * A public, unguarded page (same as /about — no useRedirectToLoginIfSignedOut,
 * no hooks, no "use client") listing what's shipped, newest first. Content
 * lives in app/lib/changelog.ts rather than here — see that file's doc
 * comment for why it's a typed data module rather than a literal .md/.txt
 * file, and CLAUDE.md's "Releases" section for how a release gets added
 * to it going forward.
 */
export default function ChangelogPage() {
  return (
    <div className="flex-1 bg-surface-0">
      <PageHeader title="Changelog" subtitle="What's shipped, newest first." />
      <PageMain>
        {CHANGELOG.map((release) => (
          <Card key={release.version} className="p-4">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 className="text-sm font-semibold text-text-primary">
                v{release.version} — {release.title}
              </h2>
              <span className="text-xs text-text-tertiary">{release.date}</span>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
              {release.highlights.map((highlight, i) => (
                <li key={i}>{highlight}</li>
              ))}
            </ul>
          </Card>
        ))}
      </PageMain>
    </div>
  );
}
