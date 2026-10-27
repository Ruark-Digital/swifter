// Role assignment rules for the user/admin management dialogs (QA #177).
//
// The BE lets a user hold up to two roles, but only specific pairs are valid.
// From the User schema: "Valid pairs are approver/evaluator or
// contract_manager/procurement." Everything else is single-role.

// Roles that are not assignable from these internal admin dialogs (assigned via
// other flows or platform-level). Mirrors the existing EditUserDialog filter.
export const RESTRICTED_ROLE_NAMES = [
  "super_admin",
  "project_manager",
  "vendor",
  "approval",
];

// The only combinable pairs, expressed as name -> partner name.
export const ROLE_PARTNER: Record<string, string> = {
  approver: "evaluator",
  evaluator: "approver",
  contract_manager: "procurement",
  procurement: "contract_manager",
  // #84 — a vendor-side account may hold Vendor (Solicitation) and/or
  // Vendor-PM (CLM = project_manager) access. Only assignable from the
  // vendor-scoped builder below, never from the internal admin dialogs.
  vendor: "project_manager",
  project_manager: "vendor",
};

export const partnerOf = (role?: string): string | undefined =>
  role ? ROLE_PARTNER[role.toLowerCase()] : undefined;

/**
 * Given the currently-selected role names, which role names may be selected?
 * `null` means unrestricted (nothing chosen yet — any role can be the first).
 * With one role chosen: itself plus its valid partner (or just itself when the
 * role has no partner, making it effectively single-role).
 */
export const allowedComboNames = (selected: string[]): string[] | null => {
  if (selected.length === 0) return null;
  const lowered = selected.map((s) => s.toLowerCase());
  if (lowered.length >= 2) return lowered;
  const partner = partnerOf(lowered[0]);
  return partner ? [lowered[0], partner] : [lowered[0]];
};

export type RoleCatalogItem = { _id?: string; id?: string; name?: string };

export type RoleOption = { value: string; label: string; name: string };

/** Build the base (restricted-filtered) option list from /onboarding/roles. */
export const buildRoleOptions = (catalog: RoleCatalogItem[]): RoleOption[] =>
  (catalog ?? [])
    .filter((r) => r.name && !RESTRICTED_ROLE_NAMES.includes(r.name.toLowerCase()))
    .map((r) => ({
      value: r._id ?? r.id ?? "",
      label: (r.name ?? "").replace(/_/g, " ").toUpperCase(),
      name: (r.name ?? "").toLowerCase(),
    }));

// #84 — the two vendor-side accesses, with client-facing labels.
export const VENDOR_ACCESS_ROLE_NAMES = ["vendor", "project_manager"];
const VENDOR_ACCESS_LABELS: Record<string, string> = {
  vendor: "Vendor (Solicitation)",
  project_manager: "Vendor-PM (CLM)",
};

/**
 * Vendor-scoped option list: only Vendor + Vendor-PM, with friendly labels.
 * Kept separate from {@link buildRoleOptions} so these roles stay excluded
 * from the internal admin dialogs (they remain in RESTRICTED_ROLE_NAMES).
 */
export const buildVendorAccessOptions = (
  catalog: RoleCatalogItem[]
): RoleOption[] =>
  (catalog ?? [])
    .filter((r) => r.name && VENDOR_ACCESS_ROLE_NAMES.includes(r.name.toLowerCase()))
    .map((r) => {
      const name = (r.name ?? "").toLowerCase();
      return {
        value: r._id ?? r.id ?? "",
        label: VENDOR_ACCESS_LABELS[name] ?? name.replace(/_/g, " ").toUpperCase(),
        name,
      };
    });

/** Live pair-enforcement: narrow the options to what may still be selected. */
export const filterOptionsByCombo = (
  options: RoleOption[],
  selectedIds: string[]
): RoleOption[] => {
  const selectedNames = options
    .filter((o) => selectedIds.includes(o.value))
    .map((o) => o.name);
  const allowed = allowedComboNames(selectedNames);
  return allowed ? options.filter((o) => allowed.includes(o.name)) : options;
};

/**
 * Resolve a user's existing roles (populated objects, bare ids, or name slugs,
 * plus a legacy singular role) into `{ value, label }` options for hydrating
 * the multi-select.
 */
export const optionsFromUserRoles = (
  userRoles: unknown,
  legacyRole: unknown,
  options: RoleOption[]
): { value: string; label: string }[] => {
  const raw: unknown[] =
    Array.isArray(userRoles) && userRoles.length
      ? userRoles
      : legacyRole
        ? [legacyRole]
        : [];

  const result: { value: string; label: string }[] = [];
  for (const entry of raw) {
    let opt: RoleOption | undefined;
    if (entry && typeof entry === "object") {
      const o = entry as RoleCatalogItem;
      const id = o._id ?? o.id;
      const nm = o.name?.toLowerCase();
      opt =
        options.find((x) => x.value === id) ??
        options.find((x) => x.name === nm);
    } else if (typeof entry === "string") {
      opt =
        options.find((x) => x.value === entry) ??
        options.find((x) => x.name === entry.toLowerCase());
    }
    if (opt && !result.some((x) => x.value === opt!.value)) {
      result.push({ value: opt.value, label: opt.label });
    }
  }
  return result;
};
