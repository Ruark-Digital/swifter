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

// Legacy date-only values were stored as exactly UTC midnight.
const LEGACY_UTC_MIDNIGHT = /^\d{4}-\d{2}-\d{2}T00:00:00(\.0+)?(Z|\+00:00)$/i;
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

const zoneOrBrowser = (tz?: string | null) =>
  resolveTimeZone(tz) ?? browserTimeZone();

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
  const zone = zoneOrBrowser(tz);
  const instant = fromZonedTime(`${ymd}T00:00:00`, zone);
  return formatInTimeZone(instant, zone, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
}

/** True for a value stored as exactly UTC midnight (a legacy date-only value). */
export const isLegacyUtcMidnight = (value: string | Date): boolean =>
  value instanceof Date
    ? !isNaN(value.getTime()) && value.getTime() % 86_400_000 === 0
    : LEGACY_UTC_MIDNIGHT.test(value.trim());

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
    const iso = value instanceof Date ? value.toISOString() : value.trim();
    return iso.slice(0, 10);
  }
  const normalized = typeof value === "string" ? ensureUtcInstant(value) : value;
  const instant =
    normalized instanceof Date ? normalized : new Date(normalized as string);
  if (isNaN(instant.getTime())) return undefined;
  return formatInTimeZone(instant, zoneOrBrowser(tz), "yyyy-MM-dd");
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
    return formatInTimeZone(instant, zoneOrBrowser(tz), pattern);
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
