// Shared date handling for MyEvent/EventInfo's startDate/endDate — see
// app/components/calendar/monthGrid.tsx, app/components/myEvents/
// eventList.tsx, and app/components/overview/overviewPanel.tsx, the
// three places that need to turn one of these strings into "which
// calendar day is this."

export type DateParts = { year: number; month: number; day: number }; // month is 1-12

/**
 * Resolves a MyEvent date field to the calendar day it actually
 * represents. BCP's EventInfo.Dates.Start/End (see internal/bcp's
 * doc comment) has been observed sending TWO different shapes for the
 * same field, apparently depending on whether the organizer set explicit
 * times:
 *
 *   - A bare "YYYY-MM-DD", with no time or timezone meaning at all — the
 *     date IS the date, wherever the viewer is.
 *   - A full ISO instant like "2026-09-14T00:00:00.000Z" — a genuine
 *     moment in time (e.g. an event's real closing time, 6pm the evening
 *     before in a US timezone), which needs converting to the viewer's
 *     own local time to know which day it actually falls on for them.
 *
 * Treating either shape with the other's logic is wrong in opposite
 * directions: running a bare date through `new Date()` and reading it
 * back in local time can roll it back a day in negative-UTC-offset
 * timezones (BCP's implicit UTC midnight isn't really UTC — it's just
 * "the date," so converting it introduces a timezone that was never
 * there). Taking a full timestamp's date digits literally — ignoring
 * the time it carries — can push it a day *late*, which is exactly what
 * happened for a real Challengers Cup 2026 event: its published end was
 * "2026-09-14T00:00:00.000Z" (6pm Sep 13 in Mountain time), and reading
 * "14" straight off the string claimed the event ran a day longer than
 * it did.
 *
 * Returns null for missing or unparseable input.
 */
export function eventDateParts(dateStr: string | undefined): DateParts | null {
  if (!dateStr) return null;

  const bareMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (bareMatch) {
    return { year: Number(bareMatch[1]), month: Number(bareMatch[2]), day: Number(bareMatch[3]) };
  }

  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  return { year: parsed.getFullYear(), month: parsed.getMonth() + 1, day: parsed.getDate() };
}

/**
 * A friendly display string for an event's date span: "Mar 1, 2026" for
 * a single day, "Mar 1, 2026 – Mar 2, 2026" for a range. Built on top of
 * eventDateParts (see its doc comment above) rather than formatting the
 * raw strings directly — the whole point is resolving each one to the
 * correct calendar day first, then reconstructing a LOCAL date (the
 * numeric Date constructor, not string parsing, so this step itself
 * can't reintroduce a timezone shift) purely to hand to
 * toLocaleDateString for display.
 */
export function formatDateRange(start?: string, end?: string): string | undefined {
  const startParts = eventDateParts(start);
  if (!startParts) return undefined;
  const fmt = (p: DateParts) =>
    new Date(p.year, p.month - 1, p.day).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const startStr = fmt(startParts);
  const endParts = eventDateParts(end);
  if (!endParts) return startStr;
  const endStr = fmt(endParts);
  return startStr === endStr ? startStr : `${startStr} – ${endStr}`;
}
