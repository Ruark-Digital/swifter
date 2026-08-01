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
 * Format a date/time in the VIEWER's local browser timezone.
 *
 * The source value is interpreted as an absolute instant (an ISO string with a
 * `Z`/offset suffix, or a `Date`) and rendered with `date-fns` `format`, whose
 * tokens read the Date's local getters — so every user sees the same instant in
 * their own timezone. This is the app-wide model (QA #23/#41a/#44/#49/#59b):
 * one consistent, viewer-relative clock instead of raw source digits.
 *
 * Correctness depends on the backend emitting real instants (`…Z` or an
 * explicit offset). A naive datetime with no offset is parsed as the viewer's
 * local time by the JS engine, i.e. shown unconverted — that is a backend
 * contract gap, not something the display layer can recover.
 *
 * The third argument is retained for call-site compatibility but ignored: the
 * viewer's timezone is always used, never a passed-in zone.
 */
export function formatDateTZ(
  dateInput: string | Date | undefined | null,
  formatStr?: string,
  _timezone?: string
): string {
  // Guard: undefined/null -> safe string
  if (!dateInput) return "N/A";

  const pattern = formatStr || "MMM dd, yyyy hh:mm a";

  try {
    let instant: Date;

    if (typeof dateInput === "string") {
      // Date-only strings (YYYY-MM-DD) carry no instant. Parsing them via
      // `new Date` would assume UTC midnight and can roll back a day for
      // west-of-UTC viewers, so build a local-midnight date and render as-is.
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [y, m, d] = dateInput.split("-").map(Number);
        instant = new Date(y, m - 1, d);
      } else {
        // ISO datetime with a Z/offset suffix -> a real instant. `format`
        // reads local getters, so this renders in the viewer's timezone.
        instant = new Date(dateInput);
      }
    } else {
      instant = dateInput;
    }

    if (isNaN(instant.getTime())) return "N/A";

    return format(instant, pattern);
  } catch {
    return "N/A";
  }
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
