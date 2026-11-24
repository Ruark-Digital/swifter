import { format } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  ZONE_ABBREV_IANA,
  ZONE_ABBREV_OFFSET_MINUTES,
  ensureUtcInstant,
} from "@/lib/utils";

/**
 * Calendar dates in a record's timezone (QA-044).
 *
 * A picked calendar date means "that date in the applicable timezone" (the
 * contract's, or the logged-in user's when the record has none). It is sent as
 * the start of that day with the zone's real UTC offset, and shown back in the
 * same zone, so the day never shifts with the browser's timezone.
 */

const DEFAULT_PATTERN = "dd MMM yyyy";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const browserTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const offsetString = (minutes: number): string => {
  const abs = Math.abs(minutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${minutes < 0 ? "-" : "+"}${hh}:${mm}`;
};

/**
 * Resolve a stored timezone to something date-fns-tz understands: an IANA name
 * or a fixed `±HH:mm` offset. Accepts IANA names ("America/Toronto") and the
 * abbreviations the app stores ("EST"); DST-observing abbreviations resolve to
 * their IANA zone so summer dates use the right offset. Undefined if unknown.
 */
export function resolveTimeZone(tz?: string | null): string | undefined {
  const value = tz?.trim();
  if (!value) return undefined;
  const upper = value.toUpperCase();
  if (upper === "UTC") return "UTC";
  const iana = ZONE_ABBREV_IANA[upper];
  if (iana) return iana;
  const fixed = ZONE_ABBREV_OFFSET_MINUTES[upper];
  if (fixed !== undefined) return offsetString(fixed);
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    return undefined;
  }
}

// A trailing UTC offset on an ISO string, e.g. "-08:00" (Z is "+00:00").
const embeddedOffset = (value: string | Date | null | undefined) => {
  if (typeof value !== "string") return undefined;
  const m = /(?:T|\s)\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/i.exec(
    value.trim()
  );
  if (!m) return undefined;
  if (m[1].toUpperCase() === "Z") return "+00:00";
  const d = m[1].replace(":", "");
  return `${d[0]}${d.slice(1, 3)}:${d.slice(3, 5)}`;
};

// Zone to render in: the record's, else (for values the BE already rendered in
// the requesting user's zone, e.g. list rows with no timezone) the string's own
// offset, else the browser's. The browser is only the last resort.
const zoneFor = (tz?: string | null, value?: string | Date | null) =>
  resolveTimeZone(tz) ?? embeddedOffset(value) ?? browserTimeZone();

/** Calendar date (yyyy-MM-dd) of a picked `Date` (local parts) or ISO/date string. */
const ymdOf = (value: Date | string): string | undefined => {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : format(value, "yyyy-MM-dd");
  }
  return /^\d{4}-\d{2}-\d{2}/.exec(value.trim())?.[0];
};

/**
 * The picked calendar date as the start of that day in `tz`, with the matching
 * UTC offset (DST-correct): ("2027-03-14", "America/Toronto") ->
 * "2027-03-14T00:00:00.000-05:00". Undefined when there is no valid date.
 */
export function toZonedStartOfDayISO(
  value: Date | string | null | undefined,
  tz?: string | null
): string | undefined {
  if (!value) return undefined;
  const ymd = ymdOf(value);
  if (!ymd) return undefined;
  const zone = zoneFor(tz);
  const instant = fromZonedTime(`${ymd}T00:00:00`, zone);
  return formatInTimeZone(instant, zone, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
}

/**
 * True when the value's INSTANT is exactly UTC midnight, whatever offset the
 * string is written in (legacy date-only values; the API may return them as
 * "2027-01-24T16:00:00.000-08:00"). `yyyy-MM-dd` strings are not instants.
 */
export const isLegacyUtcMidnight = (value: string | Date): boolean => {
  if (typeof value === "string" && DATE_ONLY.test(value.trim())) return false;
  const normalized = typeof value === "string" ? ensureUtcInstant(value) : value;
  const instant =
    normalized instanceof Date ? normalized : new Date(normalized as string);
  return !isNaN(instant.getTime()) && instant.getTime() % 86_400_000 === 0;
};

// A local-midnight Date for a calendar date, so date-fns `format` echoes it.
const localDate = (ymd: string): Date => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** The stored value's calendar date (yyyy-MM-dd) as seen in `tz`. */
function calendarYmd(
  value: string | Date | null | undefined,
  tz?: string | null
): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string" && DATE_ONLY.test(value.trim())) {
    return value.trim();
  }
  if (isLegacyUtcMidnight(value)) {
    const normalized =
      typeof value === "string" ? ensureUtcInstant(value) : value;
    const instant =
      normalized instanceof Date ? normalized : new Date(normalized as string);
    return instant.toISOString().slice(0, 10);
  }
  const normalized = typeof value === "string" ? ensureUtcInstant(value) : value;
  const instant =
    normalized instanceof Date ? normalized : new Date(normalized as string);
  if (isNaN(instant.getTime())) return undefined;
  return formatInTimeZone(instant, zoneFor(tz, value), "yyyy-MM-dd");
}

/**
 * Format a stored date or date-time in `tz` instead of the browser's zone.
 * Legacy UTC-midnight values and `yyyy-MM-dd` strings render as their own
 * calendar date (no shift). "N/A" when empty or invalid.
 */
export function formatInTz(
  value: string | Date | null | undefined,
  tz?: string | null,
  pattern: string = DEFAULT_PATTERN
): string {
  if (!value) return "N/A";
  try {
    const dateOnly =
      (typeof value === "string" && DATE_ONLY.test(value.trim())) ||
      isLegacyUtcMidnight(value);
    if (dateOnly) {
      const ymd = calendarYmd(value, tz);
      return ymd ? format(localDate(ymd), pattern) : "N/A";
    }
    const normalized =
      typeof value === "string" ? ensureUtcInstant(value) : value;
    const instant =
      normalized instanceof Date ? normalized : new Date(normalized as string);
    if (isNaN(instant.getTime())) return "N/A";
    return formatInTimeZone(instant, zoneFor(tz, value), pattern);
  } catch {
    return "N/A";
  }
}

/**
 * A stored value as a local-midnight `Date` for the calendar date it shows in
 * `tz`, for date-picker preselection (round-trips with `toZonedStartOfDayISO`).
 */
export function toCalendarDate(
  value: string | Date | null | undefined,
  tz?: string | null
): Date | undefined {
  const ymd = calendarYmd(value, tz);
  return ymd ? localDate(ymd) : undefined;
}
