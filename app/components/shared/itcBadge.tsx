"use client";
import React from "react";
import { buildBcpItcProfileUrl, type ItcRanking } from "../../lib/bcp";
import { itcGradientStyle } from "../../lib/scoreColor";

type ItcBadgeProps = {
  ranking: ItcRanking | null | undefined;
  bcpUserId?: string;
  leagueId?: string | null;
  title: string;
  // A touch smaller/tighter for spots where several of these sit on one
  // crowded line (individual board rows, opponent slots in a round list).
  size?: "sm" | "xs";
};

/**
 * The viewer's actual color scheme (not a Tailwind `dark:` class, which
 * can't reach an inline style computed in JS). Starts at `false` so the
 * very first client render matches the server's — it can't know the
 * viewer's OS setting during SSR — then updates right after mount and
 * whenever the viewer's OS-level light/dark setting changes.
 */
function usePrefersDarkMode(): boolean {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mql.addEventListener("change", handleChange);
    // Wrapped in a resolved-promise callback, like every effect in this
    // app that sets state from something read synchronously — an effect
    // only ever calls setState from a callback, never in its body itself.
    Promise.resolve().then(() => setIsDark(mql.matches));
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return isDark;
}

/**
 * A player's already-published ITC score/rank, shown as a small pill whose
 * background runs white (a low score / weak ranking) to red (a high score
 * / strong ranking) — see itcGradientStyle in lib/scoreColor.ts. Renders
 * nothing until a ranking is actually known (undefined while still
 * loading, null once resolved as "no ranking in this league").
 */
export default function ItcBadge({ ranking, bcpUserId, leagueId, title, size = "sm" }: ItcBadgeProps) {
  const isDark = usePrefersDarkMode();
  if (!ranking) return null;

  const label = `#${ranking.placing ?? "?"} · ${Math.round(ranking.points)} pts`;
  const { backgroundColor, color } = itcGradientStyle(ranking.points, isDark);
  const sizeClasses = size === "xs" ? "px-1.5 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-xs";
  const sharedClasses = `shrink-0 whitespace-nowrap rounded-full border border-black/10 font-medium dark:border-white/10 ${sizeClasses}`;

  if (!bcpUserId) {
    return (
      <span style={{ backgroundColor, color }} className={sharedClasses}>
        {label}
      </span>
    );
  }

  return (
    <a
      href={buildBcpItcProfileUrl(bcpUserId, leagueId ?? undefined)}
      target="_blank"
      rel="noreferrer"
      title={title}
      style={{ backgroundColor, color }}
      className={`${sharedClasses} hover:opacity-80`}
    >
      {label}
    </a>
  );
}
