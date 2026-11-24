import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
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

// Exact UTC offset (ms, east positive) of `zone` at instant `t`, read back from
// the zone's own formatted wall clock (date-fns-tz's getTimezoneOffset applies a
// local-time heuristic that is wrong right at a DST switch).
function offsetAt(zone: string, t: number): number {
  const [y, mo, d, h, mi, sec] = formatInTimeZone(
    new Date(t),
    zone,
    "yyyy-MM-dd-HH-mm-ss"
  )
    .split("-")
    .map(Number);
  return Date.UTC(y, mo - 1, d, h, mi, sec) - Math.floor(t / 1000) * 1000;
}

/**
 * Resolve a wall-clock date-time in `zone` to a UTC instant (ms), deterministically
 * across DST changes ("compatible" disambiguation, like Temporal):
 *  - a time that does not exist (spring-forward gap, e.g. 2027-03-14 02:30 in
 *    America/Toronto) is moved FORWARD by the gap, to 03:30 EDT;
 *  - a time that happens twice (fall-back overlap, e.g. 2027-11-07 01:30) takes
 *    the FIRST occurrence (EDT, the earlier instant).
 */
function resolveWallClock(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  zone: string
): number {
  const wall = Date.UTC(y, mo - 1, d, h, mi, 0, 0);
  const before = offsetAt(zone, wall - 86_400_000);
  const after = offsetAt(zone, wall + 86_400_000);
  const valid = Array.from(new Set([wall - before, wall - after])).filter(
    (t) => t + offsetAt(zone, t) === wall
  );
  return valid.length ? Math.min(...valid) : wall - before;
}

const ISO_WITH_OFFSET = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx";

/** Local wall-clock parts of a picked `Date` or a naive "yyyy-MM-dd[THH:mm]" string. */
function wallClockParts(value: Date | string) {
  if (value instanceof Date) {
    return isNaN(value.getTime())
      ? undefined
      : {
          ymd: format(value, "yyyy-MM-dd"),
          h: value.getHours(),
          mi: value.getMinutes(),
        };
  }
  const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value.trim());
  return m ? { ymd: m[1], h: Number(m[2] ?? 0), mi: Number(m[3] ?? 0) } : undefined;
}

/**
 * The picked wall-clock date-time as an instant in `tz`, written with the zone's
 * real UTC offset: (Jan 10 2027 09:00, Pacific/Pago_Pago) ->
 * "2027-01-10T09:00:00.000-11:00". Undefined when there is no valid date.
 */
export function toZonedDateTimeISO(
  value: Date | string | null | undefined,
  tz?: string | null
): string | undefined {
  if (!value) return undefined;
  const p = wallClockParts(value);
  if (!p) return undefined;
  const [y, mo, d] = p.ymd.split("-").map(Number);
  const zone = zoneFor(tz);
  return formatInTimeZone(
    new Date(resolveWallClock(y, mo, d, p.h, p.mi, zone)),
    zone,
    ISO_WITH_OFFSET
  );
}

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
  return ymd ? toZonedDateTimeISO(ymd, tz) : undefined;
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

// ---------------------------------------------------------------------------
// Contract/MSA effective + end DATE-TIMES (QA-044 follow-up)
//
// These two fields carry a time. The old code sent the picked wall-clock naively
// and the BE read it as UTC, so records created before the cutoff store the
// creator's wall-clock AS IF it were UTC (its meaning: that wall-clock in the
// record's timezone). Records on/after the cutoff store true instants. The two
// cannot be told apart by value, so the record's createdAt decides.
// ---------------------------------------------------------------------------

/**
 * Interim cutoff: records created BEFORE this instant store the wall-clock of
 * their effective/end date-times as UTC (legacy); records on/after it store true
 * instants. This is the merge time of PR #716. Remove once the BE migrates the
 * legacy values.
 */
export const DATETIME_LEGACY_CUTOFF = "2026-11-24T06:34:15Z";

/** True when `createdAt` is a valid time before DATETIME_LEGACY_CUTOFF. */
export function isLegacyDateTimeRecord(
  createdAt?: string | Date | null
): boolean {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  return !isNaN(t) && t < new Date(DATETIME_LEGACY_CUTOFF).getTime();
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Submit value for a contract/MSA effective/end date-time. New records get a true
 * instant in `tz`; a legacy record (see DATETIME_LEGACY_CUTOFF) keeps its legacy
 * encoding (wall-clock written as UTC) so the whole record stays one convention.
 */
export function toContractDateTimeISO(
  value: Date | string | null | undefined,
  tz?: string | null,
  createdAt?: string | Date | null
): string | undefined {
  if (!value) return undefined;
  if (!isLegacyDateTimeRecord(createdAt)) return toZonedDateTimeISO(value, tz);
  const p = wallClockParts(value);
  return p ? `${p.ymd}T${pad(p.h)}:${pad(p.mi)}:00.000Z` : undefined;
}

// A stored contract/MSA date-time as {wall-clock parts, zone to label with}.
function contractDateTimeInstant(
  value: string | Date,
  tz: string | null | undefined,
  createdAt: string | Date | null | undefined
) {
  const normalized = typeof value === "string" ? ensureUtcInstant(value) : value;
  const instant =
    normalized instanceof Date ? normalized : new Date(normalized as string);
  if (isNaN(instant.getTime())) return undefined;
  const zone = zoneFor(tz, value);
  if (!isLegacyDateTimeRecord(createdAt)) return { instant, zone, wallZone: zone };
  // Legacy: the UTC components ARE the wall-clock; label it with the record's zone.
  const [y, mo, d, h, mi] = formatInTimeZone(instant, "UTC", "yyyy-MM-dd-HH-mm")
    .split("-")
    .map(Number);
  const real = new Date(resolveWallClock(y, mo, d, h, mi, zone));
  return { instant: real, zone, wallZone: zone };
}

// The zone's short name from Intl in one locale, if the engine has one.
function intlShortName(zone: string, instant: Date, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: "short" })
      .formatToParts(instant)
      .find((p) => p.type === "timeZoneName")?.value;
  } catch {
    return undefined;
  }
}

/**
 * An unambiguous zone label for `instant`: a real abbreviation when the engine
 * has one (EST/EDT, PST, BST, CET, UTC), otherwise a GMT offset such as "GMT-11",
 * "GMT+14" or "GMT+5:30". Never a bare "GMT" next to a non-zero offset, which is
 * what some engines return for zones without an abbreviation.
 */
export function zoneLabel(zone: string, instant: Date): string {
  const offsetMin = Math.round(offsetAt(zone, instant.getTime()) / 60000);
  // en-US names the US zones; en-GB names BST/CET and the like.
  for (const locale of ["en-US", "en-GB"]) {
    const name = intlShortName(zone, instant, locale);
    if (name && /^[A-Z]{2,5}$/.test(name) && (offsetMin === 0 || name !== "GMT")) {
      return name;
    }
  }
  if (offsetMin === 0) return "GMT";
  const abs = Math.abs(offsetMin);
  const minutes = abs % 60;
  return `GMT${offsetMin < 0 ? "-" : "+"}${Math.floor(abs / 60)}${
    minutes ? `:${pad(minutes)}` : ""
  }`;
}

/**
 * Show a contract/MSA effective/end date-time as wall-clock in the record's
 * timezone, e.g. "10 Jan 2027, 09:00 AM". `withZone` appends the zone label
 * (detail views only). "N/A" when empty/invalid.
 */
export function formatContractDateTime(
  value: string | Date | null | undefined,
  tz?: string | null,
  createdAt?: string | Date | null,
  options: { pattern?: string; withZone?: boolean } = {}
): string {
  if (!value) return "N/A";
  const r = contractDateTimeInstant(value, tz, createdAt);
  if (!r) return "N/A";
  const pattern = options.pattern ?? "dd MMM yyyy, hh:mm a";
  const text = formatInTimeZone(r.instant, r.wallZone, pattern);
  return options.withZone ? `${text} ${zoneLabel(r.wallZone, r.instant)}` : text;
}

/**
 * A stored contract/MSA effective/end date-time as a local `Date` carrying the
 * same wall-clock, for picker preselection (round-trips with
 * `toContractDateTimeISO`).
 */
export function toContractDateTimeValue(
  value: string | Date | null | undefined,
  tz?: string | null,
  createdAt?: string | Date | null
): Date | undefined {
  if (!value) return undefined;
  const r = contractDateTimeInstant(value, tz, createdAt);
  if (!r) return undefined;
  const [y, mo, d, h, mi] = formatInTimeZone(r.instant, r.wallZone, "yyyy-MM-dd-HH-mm")
    .split("-")
    .map(Number);
  return new Date(y, mo - 1, d, h, mi);
}
