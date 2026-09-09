"use client";

type FollowingPillProps = {
  label: string;
  onStop: () => void;
};

/** A small persistent indicator of who's being followed, shown in the
 * header regardless of which tab is active — following is a cross-tab
 * concept (it drives highlighting on Roster, Pairings, and Placings). */
export default function FollowingPill({ label, onStop }: FollowingPillProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-brass-500/30 bg-brass-500/15 py-1 pl-3 pr-1.5 text-xs font-medium text-brass-600 dark:text-brass-400">
      <span className="truncate">Following {label}</span>
      <button
        type="button"
        onClick={onStop}
        aria-label={`Stop following ${label}`}
        title="Stop following"
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-brass-600 hover:bg-brass-500/20 dark:text-brass-400"
      >
        ×
      </button>
    </div>
  );
}
