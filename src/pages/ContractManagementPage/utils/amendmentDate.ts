import { format } from "date-fns";

/**
 * Serialize an amendment date for the API as a timezone-safe calendar date.
 *
 * The date picker yields a local-midnight `Date`. Sending it via `.toISOString()`
 * shifts the calendar day backwards for users east of UTC (e.g. WAT/UTC+1),
 * which is why the new amendment date appeared to "go back by 1 day".
 * Emitting `yyyy-MM-dd` from the local date components preserves the day the
 * user actually picked, regardless of timezone.
 */
export const toAmendmentDateValue = (
  value: Date | string | number | undefined | null,
): string => {
  if (value instanceof Date) return format(value, "yyyy-MM-dd");
  return String(value ?? "");
};

export const toAmendmentDateTimeValue = (
  value: Date | string | number | undefined | null,
): string => {
  if (value instanceof Date) return format(value, "yyyy-MM-dd HH:mm:ss");
  return String(value ?? "");
};