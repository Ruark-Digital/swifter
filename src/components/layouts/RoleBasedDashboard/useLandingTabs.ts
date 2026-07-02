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
  const contractsOn = modules?.contractManagement === true;

  switch (role) {
    case "procurement":
      return contractsOn
        ? [{ id: "solicitations", label: "Solicitations" }, CONTRACTS_TAB]
        : [{ id: "solicitations", label: "Solicitations" }];
    case "vendor":
      return contractsOn
        ? [{ id: "invitations", label: "Solicitation" }, CONTRACTS_TAB]
        : [{ id: "invitations", label: "Solicitation" }];
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
