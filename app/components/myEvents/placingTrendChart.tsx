"use client";
import React from "react";
import type { PlacingHistoryPoint } from "../../lib/myStats";

type PlacingTrendChartProps = {
  // Chronological (oldest first) — see PlacingHistoryPoint's doc comment.
  points: PlacingHistoryPoint[];
};

const CHART_WIDTH = 480;
const CHART_HEIGHT = 160;
const PAD_LEFT = 28;
const PAD_RIGHT = 16;
const PAD_TOP = 20;
const PAD_BOTTOM = 12;

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * "My round"-style trend line: the signed-in (or viewed) player's placing
 * across every already-concluded event with a known date, oldest to
 * newest. Points is deliberately not a second series/axis — see
 * PlacingHistoryPoint's doc comment — it only ever shows up in the
 * tooltip and the table view below the chart.
 *
 * Plotted by event *index*, not by actual date spacing — an evenly-spaced
 * line reads more clearly than one dominated by whatever gap happens to
 * be largest, and the story here is "better or worse over your last N
 * events," not literal elapsed time.
 *
 * Y-axis is inverted (1st place plots at the top) and scaled to this
 * player's own best/worst rather than a fixed 1..N range, so the line
 * always uses the full vertical space regardless of how competitive
 * their results have been.
 */
export default function PlacingTrendChart({ points }: PlacingTrendChartProps) {
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
  const [tableExpanded, setTableExpanded] = React.useState(false);
  const svgRef = React.useRef<SVGSVGElement>(null);

  if (points.length < 2) return null;

  const placings = points.map((p) => p.placing);
  const minPlacing = Math.min(...placings);
  const maxPlacing = Math.max(...placings);
  // A little vertical breathing room so the best/worst points aren't
  // drawn flush against the chart edge; falls back to a fixed 1-placing
  // pad when every result is identical, so the scale never collapses to
  // zero height.
  const pad = Math.max(1, (maxPlacing - minPlacing) * 0.1);
  const domainMin = Math.max(1, minPlacing - pad);
  const domainMax = maxPlacing + pad;

  const plotWidth = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xAt = (i: number) =>
    points.length === 1 ? PAD_LEFT : PAD_LEFT + (i / (points.length - 1)) * plotWidth;
  // Inverted: a lower (better) placing maps to a smaller y (higher on screen).
  const yAt = (placing: number) =>
    PAD_TOP + ((placing - domainMin) / (domainMax - domainMin || 1)) * plotHeight;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(p.placing)}`).join(" ");

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * CHART_WIDTH;
    const fraction = (relX - PAD_LEFT) / plotWidth;
    const nearest = Math.round(fraction * (points.length - 1));
    setHoverIndex(Math.min(points.length - 1, Math.max(0, nearest)));
  };

  const latest = points[points.length - 1];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="mt-3 border-t border-surface-border pt-3">
      <h3 className="text-sm font-semibold text-text-primary">Placing over time</h3>

      <div className="relative mt-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={`Placing across ${points.length} events, from ${ordinal(points[0].placing)} at ${points[0].eventName} to ${ordinal(latest.placing)} at ${latest.eventName}`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          {/* Recessive gridlines at the domain's min/mid/max placing. */}
          {[domainMin, (domainMin + domainMax) / 2, domainMax].map((g, i) => (
            <line
              key={i}
              x1={PAD_LEFT}
              x2={CHART_WIDTH - PAD_RIGHT}
              y1={yAt(g)}
              y2={yAt(g)}
              className="stroke-surface-2"
              strokeWidth={1}
            />
          ))}

          <path d={linePath} fill="none" className="stroke-brass-500" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* Crosshair — snaps to the nearest event on hover. */}
          {hoverIndex !== null && (
            <line
              x1={xAt(hoverIndex)}
              x2={xAt(hoverIndex)}
              y1={PAD_TOP}
              y2={CHART_HEIGHT - PAD_BOTTOM}
              className="stroke-text-tertiary"
              strokeWidth={1}
            />
          )}

          {points.map((p, i) => {
            const isEndpoint = i === points.length - 1;
            const isHovered = i === hoverIndex;
            return (
              <g key={p.eventId + i}>
                {/* Oversized transparent hit target — ≥24px in screen
                    space, comfortably bigger than the visible mark. */}
                <circle cx={xAt(i)} cy={yAt(p.placing)} r={12} fill="transparent" />
                {(isEndpoint || isHovered) && (
                  <circle
                    cx={xAt(i)}
                    cy={yAt(p.placing)}
                    r={4}
                    className="fill-brass-500 stroke-surface-0"
                    strokeWidth={2}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Direct label: only the most recent result, to avoid a number
            on every point — the tooltip and table carry the rest. */}
        <span
          className="pointer-events-none absolute text-xs font-medium text-text-primary"
          style={{
            left: `${(xAt(points.length - 1) / CHART_WIDTH) * 100}%`,
            top: `${(yAt(latest.placing) / CHART_HEIGHT) * 100}%`,
            transform: "translate(-100%, -140%)",
          }}
        >
          {ordinal(latest.placing)}
        </span>

        {hovered && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute z-10 max-w-[12rem] -translate-x-1/2 -translate-y-full rounded-md border border-surface-border bg-surface-1 px-2 py-1.5 text-xs shadow-md"
            style={{
              left: `${(xAt(hoverIndex) / CHART_WIDTH) * 100}%`,
              top: `${(yAt(hovered.placing) / CHART_HEIGHT) * 100}%`,
            }}
          >
            <p className="font-semibold text-text-primary">{ordinal(hovered.placing)}</p>
            <p className="truncate text-text-secondary">{hovered.eventName}</p>
            <p className="text-text-tertiary">
              {formatShortDate(hovered.eventDate)}
              {hovered.points !== undefined && ` · ${hovered.points} pts`}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setTableExpanded((v) => !v)}
        aria-expanded={tableExpanded}
        className="mt-1 text-xs text-text-secondary hover:underline"
      >
        {tableExpanded ? "Hide" : "Show"} as a table
      </button>

      {tableExpanded && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-surface-border">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-surface-1 text-text-tertiary">
              <tr>
                <th className="px-2 py-1 font-medium">Event</th>
                <th className="px-2 py-1 font-medium">Date</th>
                <th className="px-2 py-1 font-medium">Placing</th>
                <th className="px-2 py-1 font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={p.eventId + i} className="border-t border-surface-border">
                  <td className="px-2 py-1 text-text-primary">{p.eventName}</td>
                  <td className="px-2 py-1 text-text-secondary">{formatShortDate(p.eventDate)}</td>
                  <td className="px-2 py-1 text-text-secondary">{ordinal(p.placing)}</td>
                  <td className="px-2 py-1 text-text-secondary">{p.points ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
