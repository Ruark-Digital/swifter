import { formatInTimeZone } from "date-fns-tz";
import { resolveTimeZone } from "@/lib/zonedDate";

/**
 * "Today" as seen in the given timezone, returned as a local-midnight Date so
 * it can be used directly as a calendar `minDate` (the calendar compares local
 * dates). Falls back to the browser's today when the zone is missing/unknown.
 */
export function todayInZone(tz?: string | null, now: Date = new Date()): Date {
  const zone = resolveTimeZone(tz);
  if (!zone) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const [y, m, d] = formatInTimeZone(now, zone, "yyyy-MM-dd")
    .split("-")
    .map(Number);
  return new Date(y, m - 1, d);
}
