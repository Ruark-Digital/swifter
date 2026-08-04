import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as a currency string based on the provided locale and currency.
 * @param {number} amount - The amount of money to format.
 * @param {string} locale - The locale string (e.g., 'en-US', 'fr-FR').
 * @param {string} currency - The currency code (e.g., 'USD', 'EUR').
 * @returns {string} The formatted currency string.
 */
export function formatCurrency(
  amount: number,
  locale: Intl.LocaleOptions["region"],
  currency: Intl.NumberFormatOptions["currency"]
) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(amount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return amount.toString();
  }
}

export function resolveCurrency(
  localCurrency?: string | null,
  profileCurrency?: string | null,
) {
  return (
    [localCurrency, profileCurrency].find(
      (currency) => typeof currency === "string" && currency.trim(),
    ) ?? "USD"
  );
}

// Compact currency: one decimal with K/M/B/T (e.g. $527.5M, $358.3K) per the
// dashboard figma. Used where large spend/value figures would otherwise overflow.
export function formatCompactCurrency(
  amount: number,
  currency: Intl.NumberFormatOptions["currency"] = "USD",
  locale: string = "en-US"
) {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(safe);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return safe.toString();
  }
}

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

/**
 * Resolve a milestone's linked deliverable to a display name.
 *
 * The backend returns `milestone[].deliverable` inconsistently: a populated
 * `{ name }` object, the deliverable's `_id` string, or a legacy name string.
 * Pass a `_id -> name` map (built from the contract/MSA `deliverables` list)
 * to resolve id references. Returns "" — caller renders "-" — when nothing
 * resolves, and never the milestone's own name (QA #47).
 */
export function resolveMilestoneDeliverableName(
  raw: unknown,
  nameById?: Map<string, string>,
): string {
  if (raw && typeof raw === "object") {
    const name = (raw as { name?: unknown }).name;
    return typeof name === "string" ? name.trim() : "";
  }
  if (typeof raw === "string") {
    const val = raw.trim();
    if (!val) return "";
    const mapped = nameById?.get(val);
    if (mapped) return mapped;
    // An unresolved ObjectId isn't a human-readable name → show blank, not
    // the raw id (and never the milestone title).
    if (OBJECT_ID_RE.test(val)) return "";
    return val; // legacy name string
  }
  return "";
}

const getFileNameFromUrl = (url: string) => {
  const parts = url.split("/");
  return parts[parts.length - 1] || "";
};

export const downloadFile = async (fileUrl: string) => {
  const response = await fetch(fileUrl);
  const blob = await response.blob();
  const fileName = getFileNameFromUrl(fileUrl);
  const downloadUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();

  URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(link);
};

export const formatSecurityType = (raw: unknown): string => {
  if (typeof raw !== "string") return "-";
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "-") return "-";
  return trimmed
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const MODULE_ACRONYMS = new Set(["RFI", "NCR", "LEM", "CAPA", "MSA", "KPI"]);

/**
 * Format an action-log module/entity string for display.
 * Splits camelCase into words, upper-cases known acronyms (RFI, NCR, ...),
 * and title-cases everything else. e.g. "rfi" -> "RFI", "ContractSavings" -> "Contract Savings".
 */
export const formatModuleLabel = (raw: unknown): string => {
  if (typeof raw !== "string") return "-";
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "-") return trimmed || "-";
  return trimmed
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) =>
      MODULE_ACRONYMS.has(w.toUpperCase())
        ? w.toUpperCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join(" ");
};

export const createFormData = (body: Record<string, any>) => {
  const formData = new FormData();

  Object.entries(body).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

/**
 * Safely format dates with optional IANA timezone support.
 * Falls back to local formatting when timezone is not provided.
 */
export function formatDateTZ(
  dateInput: string | Date | undefined | null,
  formatStr?: string,
  _timezone?: string
): string {
  // Guard: undefined/null -> safe string
  if (!dateInput) return "N/A";

  // If a timezone is requested, we'll interpret the input as an actual instant (Date)
  // and then render it for that timezone using formatInTimeZone.
  // if (timezone && timezone.trim().length > 0) {
  //   let instant: Date;

  //   if (typeof dateInput === "string") {
  //     // If plain YYYY-MM-DD (no time part) -> construct a UTC midnight for that date
  //     if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
  //       const [y, m, d] = dateInput.split("-").map(Number);
  //       // create a UTC midnight instant for that date
  //       instant = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  //     } else {
  //       // For ISO-like strings (with 'T' or timezone suffix) parse as ISO -> real instant
  //       instant = parseISO(dateInput);
  //     }
  //   } else {
  //     instant = dateInput;
  //   }

  //   if (isNaN(instant.getTime())) return "N/A";

  //   return formatInTimeZone(instant, timezone, formatStr || "MMM dd, yyyy hh:mm a");
  // }

  try {
    // Read the wall-clock digits exactly as recorded in the source string (or Date
    // object) -- we intentionally do NOT convert to the viewer's browser timezone.
    // The goal is to show the time in the zone it was captured in.
    let year: number, month: number, day: number, hour: number, minute: number, second: number;
    let offsetLabel = "";

    if (typeof dateInput === "string") {
      const match = dateInput.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/
      );

      if (match) {
        [year, month, day, hour, minute, second] = match
          .slice(1, 7)
          .map(Number) as [number, number, number, number, number, number];
        if (match[7]) offsetLabel = getOffsetAbbreviation(match[7]);
      } else {
        // Not a "T"-delimited ISO datetime (e.g. a plain date-only string) --
        // fall back to native parsing.
        const parsed = new Date(dateInput);
        if (isNaN(parsed.getTime())) return "N/A";
        year = parsed.getFullYear();
        month = parsed.getMonth() + 1;
        day = parsed.getDate();
        hour = parsed.getHours();
        minute = parsed.getMinutes();
        second = parsed.getSeconds();
      }
    } else {
      year = dateInput.getFullYear();
      month = dateInput.getMonth() + 1;
      day = dateInput.getDate();
      hour = dateInput.getHours();
      minute = dateInput.getMinutes();
      second = dateInput.getSeconds();
    }

    // `format()` reads the Date's LOCAL getters, so building it from the source's
    // own wall-clock digits reproduces those exact digits in the output regardless
    // of the viewer's browser timezone (no conversion happens).
    const displayDate = new Date(year, month - 1, day, hour, minute, second);

    const pattern = formatStr || "MMM dd, yyyy hh:mm a";

    // date-fns's localized-time tokens (p/pp/ppp/pppp) pull their timezone name
    // from the BROWSER's Intl data, not the source's -- swap that piece out for
    // our own offset-derived abbreviation so e.g. a "-05:00" source renders "EST",
    // not the viewer's local zone.
    const zoneToken = pattern.match(/p{1,4}$/);
    if (zoneToken && offsetLabel) {
      const prefix = pattern.slice(0, -zoneToken[0].length).trim();
      const timePart = format(displayDate, "h:mm:ss a");
      return `${prefix ? format(displayDate, prefix) + " " : ""}${timePart} ${offsetLabel}`;
    }

    return format(displayDate, pattern);
  } catch {
    return "N/A";
  }
}

// Best-effort UTC-offset -> common abbreviation mapping, covering every
// standard-time offset in use worldwide (labels sourced from and kept
// consistent with `src/assets/timezones.json`, the same list used by the
// app's timezone pickers). A bare numeric offset can't distinguish e.g. EST
// from CDT (both -05:00), or EET from CAT (both +02:00) -- multiple real
// zones share almost every offset, so each entry below is a representative
// pick, not a guaranteed-unique resolution. Falls back to a "GMT±HH:MM"
// label for the handful of rarer offsets not listed here.
const TIMEZONE_OFFSET_ABBREVIATIONS: Record<string, string> = {
  "-10:00": "HST",
  "-09:00": "AKST",
  "-08:00": "PST",
  "-07:00": "MST",
  "-06:00": "CST",
  "-05:00": "EST",
  "-04:00": "EDT",
  "-03:00": "BRT",
  "-01:00": "AZOT",
  "+00:00": "GMT",
  "+01:00": "CET",
  "+02:00": "EET",
  "+03:00": "MSK",
  "+04:00": "GST",
  "+05:00": "PKT",
  "+05:30": "IST",
  "+05:45": "NPT",
  "+06:00": "BTT",
  "+06:30": "MMT",
  "+07:00": "ICT",
  "+08:00": "SGT",
  "+09:00": "JST",
  "+09:30": "ACST",
  "+10:00": "AEST",
  "+12:00": "NZST",
  "+12:45": "CHAST",
  "+13:00": "TON",
  "+14:00": "LINT",
};

function getOffsetAbbreviation(offsetRaw: string): string {
  const normalized =
    offsetRaw === "Z"
      ? "+00:00"
      : offsetRaw.length === 5
      ? `${offsetRaw.slice(0, 3)}:${offsetRaw.slice(3)}`
      : offsetRaw;
  return TIMEZONE_OFFSET_ABBREVIATIONS[normalized] || `GMT${normalized}`;
}

// Internal helper: compute the timezone offset (in minutes) for a given UTC date and IANA timezone.
function getTimeZoneOffset(dateUTC: Date, timeZone: string): number {
  // Ensure we use a UTC-based date for stable calculations
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = dtf.formatToParts(dateUTC);
  const map: Record<string, number> = {} as any;
  for (const { type, value } of parts) {
    if (type !== "literal") map[type] = Number(value);
  }

  const asUTC = Date.UTC(
    map.year,
    (map.month || 1) - 1,
    map.day || 1,
    map.hour || 0,
    map.minute || 0,
    map.second || 0
  );

  // Difference between the timezone-reconstructed UTC timestamp and the original UTC timestamp
  // yields the offset in milliseconds (positive for zones ahead of UTC).
  const diffMs = asUTC - dateUTC.getTime();
  return diffMs / 60000; // minutes
}

/**
 * Convert a "wall time" (date/time without offset) in a specific IANA timezone into a UTC Date.
 * This mimics date-fns-tz's zonedTimeToUtc, avoiding direct dependency on that export.
 *
 * Example:
 *   zonedTimeToUtc(new Date("2025-01-01T12:00"), "America/Los_Angeles").toISOString()
 */
export function zonedTimeToUtc(
  dateInput: string | Date,
  timeZone: string
): Date {
  const local = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (!(local instanceof Date) || isNaN(local.getTime())) {
    return new Date(NaN);
  }

  try {
    // Build a UTC timestamp from the local date's wall time components
    const utcTsFromLocalWall = Date.UTC(
      local.getFullYear(),
      local.getMonth(),
      local.getDate(),
      local.getHours(),
      local.getMinutes(),
      local.getSeconds(),
      local.getMilliseconds()
    );

    // Determine the timezone offset (in minutes) at that instant for the target IANA timezone
    const offsetMin = getTimeZoneOffset(new Date(utcTsFromLocalWall), timeZone);

    // Adjust the UTC timestamp by subtracting the offset to get the true UTC instant
    const adjustedUtcTs = utcTsFromLocalWall - offsetMin * 60000;
    return new Date(adjustedUtcTs);
  } catch {
    return new Date(NaN);
  }
}

export const formatDateForInput = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

export const parseFileSize = (size: string | number): number => {
  if (typeof size === "number") return size;
  const match = size.match(/^([\d.]+)\s*(KB|MB|GB|TB)?$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase();
  if (unit === "KB") return value * 1024;
  if (unit === "MB") return value * 1024 * 1024;
  if (unit === "GB") return value * 1024 * 1024 * 1024;
  if (unit === "TB") return value * 1024 * 1024 * 1024 * 1024;
  return value;
};
