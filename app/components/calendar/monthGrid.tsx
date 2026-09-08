"use client";
import React from "react";
import type { MyEvent } from "../../lib/myEvents";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DateParts = { year: number; month: number; day: number }; // month is 1-12

/**
 * Parses a bare "YYYY-MM-DD" (what MyEvent.startDate/endDate actually
 * are — see internal/bcp's EventInfo doc comment) into its numeric
 * parts by splitting the string, deliberately NOT via `new Date(str)`.
 * The Date constructor parses a date-only ISO string as UTC midnight,
 * which can render as the *previous* day once converted to a
 * negative-UTC-offset local timezone — a real, user-visible off-by-one
 * bug for a day-granularity calendar. Returns null for anything that
 * doesn't match (missing/malformed date).
 */
function parseDateParts(dateStr: string | undefined): DateParts | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

// A plain incrementing day-number for range comparisons — Date.UTC used
// purely as integer arithmetic here (divided down to whole days), never
// converted back to a wall-clock time or rendered, so there's no
// timezone pitfall despite "UTC" in the name.
function dayNumber(parts: DateParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day) / 86400000;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

type DayRange = { start: number; end: number; name: string };

/** One inclusive [start, end] day-number range (plus the event's own
 * name, for labeling the cells it covers) per event with a usable start
 * date — an event with no end date covers just its start day. */
function eventDayRanges(events: MyEvent[]): DayRange[] {
  const ranges: DayRange[] = [];
  for (const event of events) {
    const startParts = parseDateParts(event.startDate);
    if (!startParts) continue;
    const start = dayNumber(startParts);
    const endParts = parseDateParts(event.endDate);
    const end = endParts ? dayNumber(endParts) : start;
    ranges.push({ start, end: Math.max(start, end), name: event.eventName });
  }
  return ranges;
}

/** Every event name covering day-number dNum, in the order they were
 * passed in. */
function namesForDay(ranges: DayRange[], dNum: number): string[] {
  return ranges.filter((r) => dNum >= r.start && dNum <= r.end).map((r) => r.name);
}

/**
 * One day cell: the day number, plus (if any event covers it) its name
 * as a small truncated tag — the tag's own `title` carries the full
 * name for whenever it's cut off. A second-or-later event on the same
 * day collapses to a "+N more" line rather than stacking every name,
 * since a real player's schedule essentially never double-books a day
 * and this isn't worth much layout complexity for that rare case.
 */
function DayCell({ day, isToday, names }: { day: number; isToday: boolean; names: string[] }) {
  return (
    <div
      className={`min-h-[4.5rem] rounded-lg p-1 text-sm ${
        isToday ? "bg-indigo-50 dark:bg-indigo-950/40" : ""
      }`}
    >
      <span
        className={
          isToday
            ? "font-semibold text-indigo-600 dark:text-indigo-400"
            : "text-zinc-700 dark:text-zinc-300"
        }
      >
        {day}
      </span>
      {names.length > 0 && (
        <div className="mt-0.5 flex flex-col gap-0.5">
          <span
            title={names[0]}
            className="truncate rounded bg-indigo-100 px-1 py-0.5 text-[10px] font-medium leading-tight text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
          >
            {names[0]}
          </span>
          {names.length > 1 && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
              +{names.length - 1} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A hand-rolled month grid (no calendar library — this app has none,
 * and one small labeled grid isn't worth adding one for) labeling each
 * day that falls within any event's inclusive date range with that
 * event's name, so a multi-day GT is visibly tagged across every day it
 * spans, not just its start. Defaults to the current month; prev/next
 * buttons navigate. Full event detail (dates, placing, faction, a link
 * to the event page) still lives in the paired EventList
 * (app/components/myEvents/eventList.tsx) alongside this, not per-cell.
 */
export default function MonthGrid({ events }: { events: MyEvent[] }) {
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth() + 1);

  const ranges = React.useMemo(() => eventDayRanges(events), [events]);

  const firstOfMonth = new Date(year, month - 1, 1);
  const startWeekday = firstOfMonth.getDay();
  const totalDays = daysInMonth(year, month);
  const monthLabel = firstOfMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const todayNum = dayNumber({ year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() });

  const cells: (number | null)[] = [
    ...Array<null>(startWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const goPrev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const goNext = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous month"
          className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{monthLabel}</span>
        <button
          type="button"
          onClick={goNext}
          aria-label="Next month"
          className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400 dark:text-zinc-500">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day == null) return <div key={i} />;
          const dNum = dayNumber({ year, month, day });
          return <DayCell key={i} day={day} isToday={dNum === todayNum} names={namesForDay(ranges, dNum)} />;
        })}
      </div>
    </div>
  );
}
