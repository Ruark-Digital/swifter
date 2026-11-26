import timezones from "@/assets/timezones.json";
import { ZONE_ABBREV_IANA } from "@/lib/utils";
import { browserTimeZone } from "@/lib/zonedDate";

type Option = { label: string; value: string };

/** An IANA zone name ("Pacific/Auckland"), or UTC. Abbreviations are not IANA. */
const looksIana = (tz: string) => tz.includes("/") || tz.toUpperCase() === "UTC";

/**
 * Convert a stored zone (IANA already, or an abbreviation such as "NZST") to an
 * IANA name; undefined when it cannot be mapped (e.g. a fixed-offset abbreviation).
 */
export const toIanaZone = (tz?: string | null): string | undefined => {
  const v = tz?.trim();
  if (!v) return undefined;
  if (looksIana(v)) return v;
  return ZONE_ABBREV_IANA[v.toUpperCase()];
};

/** Contract timezone default: the creator's own zone as IANA, else the browser's. */
export const defaultContractTimezone = (userTz?: string | null): string =>
  toIanaZone(userTz) ?? browserTimeZone();

/**
 * Timezone choices as IANA names (what the contract service stores and returns).
 * Falls back to the app's abbreviation list only if the runtime cannot enumerate
 * IANA zones; `extra` keeps the current value selectable.
 */
export const buildTimezoneOptions = (extra?: string): Option[] => {
  const supported = (Intl as unknown as {
    supportedValuesOf?: (k: string) => string[];
  }).supportedValuesOf;
  const iana =
    typeof supported === "function" ? supported("timeZone") : ([] as string[]);
  const base: Option[] =
    iana.length > 0
      ? ["UTC", ...iana.filter((z) => z !== "UTC")].map((z) => ({
          label: z.replace(/_/g, " "),
          value: z,
        }))
      : timezones;
  return extra && !base.some((o) => o.value === extra)
    ? [{ label: extra, value: extra }, ...base]
    : base;
};
