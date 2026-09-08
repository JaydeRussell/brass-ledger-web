"use client";
import { usePathname } from "next/navigation";
import { googleSignInUrl } from "../../lib/auth";

type SignInPromptProps = {
  // What this specific page needs sign-in for — e.g. "see your player
  // stats." Rendered as "Sign in to <message>"
  message: string;
};

/**
 * The "you need to sign in to see this" card — was duplicated
 * near-identically across /my-events and /stats (only the message
 * differed), which is exactly the kind of drift risk a "more central"
 * sign-in flow was meant to fix. Carries the current path as
 * googleSignInUrl's returnTo, so a returning, already-linked account
 * signing in from here lands back on this same page instead of always
 * the homepage — see that function's doc comment for why a brand-new
 * account doesn't follow this path at all (goes to /welcome instead,
 * regardless of where sign-in started).
 */
export default function SignInPrompt({ message }: SignInPromptProps) {
  const pathname = usePathname();
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
      <p className="mb-3">Sign in to {message}</p>
      <a
        href={googleSignInUrl(pathname)}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Sign in with Google
      </a>
    </div>
  );
}
