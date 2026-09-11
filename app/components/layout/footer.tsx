import packageJson from "../../../package.json";

/**
 * A persistent, low-emphasis version/beta indicator — mounted once in
 * app/layout.tsx (same "mount once, appears on every page" pattern as
 * NavDrawer) rather than repeated per page. Reads the version straight
 * from package.json rather than hardcoding it a second time here, so a
 * version bump doesn't require remembering to update this too.
 */
export default function Footer() {
  return (
    <footer className="px-4 py-6 text-center text-xs text-text-tertiary">
      Brass Ledger v{packageJson.version} — Early beta
    </footer>
  );
}
