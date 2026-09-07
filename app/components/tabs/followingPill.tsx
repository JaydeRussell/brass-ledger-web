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
    <div className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 py-1 pl-3 pr-1.5 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
      <span className="truncate">Following {label}</span>
      <button
        type="button"
        onClick={onStop}
        aria-label={`Stop following ${label}`}
        title="Stop following"
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-indigo-500 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900"
      >
        ×
      </button>
    </div>
  );
}
