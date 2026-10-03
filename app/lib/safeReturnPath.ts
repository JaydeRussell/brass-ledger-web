/**
 * A ?return_to the login page may navigate to: a same-origin path, or
 * nothing. Browsers read "\" as "/" and drop tabs and newlines, so
 * "/\evil.com" and "/<tab>/evil.com" would both become "//evil.com", a
 * link to another host. The backend's isSafeReturnPath guards its own
 * redirect the same way.
 */
export function safeReturnPath(path: string | null, origin = "https://brass-ledger.app"): string | undefined {
  if (!path || path[0] !== "/" || path.startsWith("//") || path.includes("://")) return undefined;
  if (/[\\\u0000-\u001f\u007f]/.test(path)) return undefined;
  try {
    if (new URL(path, origin).origin !== origin) return undefined;
  } catch {
    return undefined;
  }
  return path;
}
