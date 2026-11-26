import { resolveTimeZone } from "@/lib/zonedDate";

/**
 * Map a stored timezone (an abbreviation such as "NZDT", or an IANA name) to
 * the value of a timezone select option. Exact matches win; otherwise an option
 * that resolves to the same zone (e.g. "NZDT" and "NZST" are both
 * Pacific/Auckland) is used. Undefined when nothing matches.
 */
export function matchTimezoneOption(
  tz: string | null | undefined,
  options: { value: string }[]
): string | undefined {
  const value = tz?.trim();
  if (!value) return undefined;
  const exact = options.find((o) => o.value.toUpperCase() === value.toUpperCase());
  if (exact) return exact.value;
  const zone = resolveTimeZone(value);
  if (!zone) return undefined;
  return options.find((o) => resolveTimeZone(o.value) === zone)?.value;
}
