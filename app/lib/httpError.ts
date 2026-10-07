/**
 * The message for a failed request whose body didn't carry its own
 * `{error}`. A 429 comes from the backend's rate limiter, whose reply has
 * no `error` field, so it gets words a person can act on.
 */
export function httpErrorMessage(status: number): string {
  if (status === 429) return "You're going a bit fast. Wait a few seconds and try again.";
  return `Request failed: HTTP ${status}`;
}
