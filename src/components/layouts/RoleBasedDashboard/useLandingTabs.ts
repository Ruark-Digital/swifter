import { useMemo } from "react";
import type { Modules, UserRole } from "@/types";

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
  // Truthy check (not `=== true`) to stay consistent with the sidebar nav
  // (src/lib/navigation.ts gates Contract Management on `modules?.contractManagement`).
  // The auth `module` payload can carry these flags as truthy non-boolean values,
  // so strict `=== true` hid the Contracts landing tab (and the Solicitations/
  // Contracts toggle) for users whose sidebar still showed Contract Management.
  const contractsOn = Boolean(modules?.contractManagement);
  // Solicitation is treated as on unless the super-admin explicitly disabled it
  // for the company — so the tab keeps showing while `modules` is still loading
  // or when the flag is absent, but hides once it's toggled off (QA #187).
  const solicitationOn = modules?.solicitationManagement !== false;

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

export function useLandingTabs(role: UserRole, modules: Modules | undefined) {
  return useMemo(() => computeLandingTabs(role, modules), [role, modules]);
}
