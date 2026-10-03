import Link from "next/link";
import packageJson from "../../../package.json" with { type: "json" };

/**
 * A persistent, low-emphasis version/beta indicator — mounted once in
 * app/layout.tsx (same "mount once, appears on every page" pattern as
 * NavDrawer) rather than repeated per page. Reads the version straight
 * from package.json rather than hardcoding it a second time here, so a
 * version bump doesn't require remembering to update this too. The
 * version itself links to /changelog — see app/lib/changelog.ts.
 */
export default function Footer() {
  return (
    // Below `sm:` the bottom padding clears BottomTabBar and the Feedback
    // pill floating above it, so the version line is never hidden.
    <footer className="px-4 pt-6 pb-[calc(8.5rem+env(safe-area-inset-bottom))] text-center text-xs text-text-tertiary sm:pb-6 print:hidden">
      Brass Ledger{" "}
      <Link href="/changelog" className="hover:underline">
        v{packageJson.version}
      </Link>{" "}
      — Early beta
    </footer>
  );
}
