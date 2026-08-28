import { useMemo } from "react";
import type { Modules, UserRole } from "@/types";
import { isModuleDisabled, isModuleEnabled } from "@/lib/moduleFlags";

export type LandingTabId =
  | "solicitations"
  | "invitations"
  | "overview"
  | "contracts";

export interface LandingTab {
  id: LandingTabId;
  label: string;
}

const CONTRACTS_TAB: LandingTab = { id: "contracts", label: "Contracts" };

export function computeLandingTabs(
  role: UserRole,
  modules: Modules | undefined,
): LandingTab[] {
  // Module flags can be booleans (legacy/persisted) or `{ enabled: boolean }`
  // objects (current BE payload) — the helpers handle both.
  const contractsOn =
    role !== "procurement" && isModuleEnabled(modules?.contractManagement);
  // Solicitation is treated as on unless the super-admin explicitly disabled it
  // for the company — so the tab keeps showing while `modules` is still loading
  // or when the flag is absent, but hides once it's toggled off (QA #187).
  const solicitationOn = !isModuleDisabled(modules?.solicitationManagement);

  switch (role) {
    case "procurement": {
      const tabs: LandingTab[] = [];
      if (solicitationOn)
        tabs.push({ id: "solicitations", label: "Solicitations" });
      if (contractsOn) tabs.push(CONTRACTS_TAB);
      return tabs;
    }
    case "vendor": {
      const tabs: LandingTab[] = [];
      if (solicitationOn)
        tabs.push({ id: "invitations", label: "Solicitation" });
      if (contractsOn) tabs.push(CONTRACTS_TAB);
      return tabs;
    }
    case "company_admin": {
      const base: LandingTab[] = [
        { id: "overview", label: "Dashboard" },
      ];
      return contractsOn ? [...base, CONTRACTS_TAB] : base;
    }
    case "project_manager":
      return contractsOn ? [CONTRACTS_TAB] : [];
    default:
      return [];
  }
}

/**
 * QA #225 — pick the role whose landing tabs the dashboard should render for a
 * vendor-side account.
 *
 * The dashboard aliases a project_manager (Vendor-PM / CLM) to the vendor view,
 * which carries the "Solicitation" landing tab. But a Vendor-PM account that
 * holds ONLY project_manager access has no Solicitation surface, so its landing
 * tabs must come from the real project_manager role (Contracts only). The
 * Solicitation toggle returns only when the account also holds the vendor
 * (Solicitation) role.
 */
export function resolveLandingTabRole(
  activeRole: UserRole,
  roles: UserRole[],
): UserRole {
  if (activeRole !== "project_manager") return activeRole;
  return roles.includes("vendor") ? "vendor" : "project_manager";
}

export function useLandingTabs(role: UserRole, modules: Modules | undefined) {
  return useMemo(() => computeLandingTabs(role, modules), [role, modules]);
}
