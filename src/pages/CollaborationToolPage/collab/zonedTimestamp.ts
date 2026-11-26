import { formatInTimeZone } from "date-fns-tz";
import { browserTimeZone, resolveTimeZone } from "@/lib/zonedDate";

/**
 * Timestamps in the collaboration sidebar are shown in the CONTRACT's timezone,
 * with the zone named, never silently in the viewer's browser zone. When the
 * contract's zone is unknown (no contract, or a role that cannot read it) the
 * viewer's own zone is used, still labelled.
 */
export const formatZonedTimestamp = (
  value: string | Date | undefined | null,
  timeZone?: string | null,
  options: { wallClock?: boolean; pattern?: string } = {},
): string => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  // Word-imported comments carry a wall-clock time with a misleading Z: show
  // the digits as-is (UTC), labelled UTC.
  const zone = options.wallClock
    ? "UTC"
    : (resolveTimeZone(timeZone) ?? browserTimeZone());
  return formatInTimeZone(date, zone, options.pattern ?? "MMM d, yyyy, h:mm a zzz");
};
