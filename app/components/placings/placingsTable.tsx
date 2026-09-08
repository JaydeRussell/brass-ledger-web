"use client";
import type { PlacingEntry } from "../../lib/bcp";
import Spinner from "../shared/spinner";
import { useDelayedFlag } from "../../lib/useDelayedFlag";

type PlacingsTableProps = {
  entries: PlacingEntry[];
  loading: boolean;
  error: string | null;
  followedIds?: Set<string>;
  // Overrides the "nothing published yet" message below — used when
  // `entries` came back empty because a search filter matched nothing,
  // rather than because BCP has no placings published yet.
  emptyMessage?: string;
};

/**
 * Standings as BCP has already computed and published them. The metric
 * columns are whatever BCP reports for this event (e.g. Wins, Battle
 * Points, Wins SoS) rather than hardcoded — this only displays published
 * numbers, it doesn't calculate them.
 */
export default function PlacingsTable({
  entries,
  loading,
  error,
  followedIds,
  emptyMessage,
}: PlacingsTableProps) {
  const metricNames = entries[0]?.metrics.map((m) => m.name) ?? [];
  const slowLoad = useDelayedFlag(loading);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">Placings</p>
      </div>

      <div className="p-3">
        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            Couldn&apos;t load placings: {error}
          </p>
        )}

        {!error && loading && (
          <div className="p-2">
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Spinner size="sm" />
              <span>Loading placings…</span>
            </div>
            {slowLoad && (
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Taking longer than usual — first look at this event.
              </p>
            )}
          </div>
        )}

        {!error && !loading && entries.length === 0 && (
          <p className="p-2 text-sm text-zinc-500 dark:text-zinc-400">
            {emptyMessage ??
              "No placings published yet — this usually appears once a round or two has finished."}
          </p>
        )}

        {!error && !loading && entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400">
                  <th className="px-2 py-1.5 font-medium">#</th>
                  <th className="px-2 py-1.5 font-medium">Name</th>
                  {metricNames.map((name) => (
                    <th key={name} className="px-2 py-1.5 text-right font-medium">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`border-t border-zinc-100 dark:border-zinc-800 ${
                      followedIds?.has(entry.id)
                        ? "bg-indigo-50 dark:bg-indigo-950/30"
                        : ""
                    }`}
                  >
                    <td className="px-2 py-1.5 text-zinc-500 dark:text-zinc-400">
                      {entry.placing ?? "—"}
                    </td>
                    <td className="truncate px-2 py-1.5 font-medium text-zinc-800 dark:text-zinc-100">
                      {entry.name}
                    </td>
                    {metricNames.map((name) => (
                      <td
                        key={name}
                        className="px-2 py-1.5 text-right text-zinc-600 dark:text-zinc-300"
                      >
                        {entry.metrics.find((m) => m.name === name)?.value ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
