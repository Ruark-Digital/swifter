import type { ModuleFlagValue } from "@/types";

export type ModuleFlag = ModuleFlagValue | null | undefined;

/**
 * The BE now ships module flags as `{ enabled: boolean }` objects in the auth
 * `module` payload; older payloads (and cached/persisted users) carry plain
 * booleans. Accept both.
 *
 * Enabled only when explicitly on (boolean `true` or `{ enabled: true }`).
 */
export const isModuleEnabled = (flag: ModuleFlag): boolean =>
  flag === true || (typeof flag === "object" && flag?.enabled === true);

/**
 * Disabled only when explicitly off (boolean `false` or `{ enabled: false }`).
 * Use this for "on unless explicitly disabled" gates: absent flags stay on.
 */
export const isModuleDisabled = (flag: ModuleFlag): boolean =>
  flag === false ||
  (typeof flag === "object" && flag !== null && flag?.enabled === false);
