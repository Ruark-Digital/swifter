import { useMemo } from "react";
import { useUser } from "@/store/authSlice";
import { UserRole } from "@/types";
import { getDashboardConfig } from "@/config/dashboardConfig";

/**
 * Hook to manage user role-based functionality
 */
export const useUserRole = () => {
  const user = useUser();

  const userRole: UserRole = useMemo(() => {
    const roleName = user?.role?.name;
    if (roleName) return roleName;

    try {
      const raw = window.localStorage.getItem("auth");
      if (!raw) return "procurement";
      const parsed = JSON.parse(raw);
      const persistedRoleName = parsed?.state?.user?.role?.name;
      return persistedRoleName || "procurement";
    } catch {
      return "procurement";
    }
  }, [user?.role?.name]);

  const dashboardConfig = useMemo(() => {
    return getDashboardConfig(userRole);
  }, [userRole]);

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    return userRole === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.includes(userRole);
  };

  const hasAllRoles = (roles: UserRole[]): boolean => {
    return roles.every((role) => userRole === role);
  };

  const isEvaluator = userRole === "evaluator";
  const isVendor = userRole === "vendor";
  const isProjectManager = userRole === "project_manager";
  const isApprover = userRole === "approver";
  const isViewOnly = userRole === "view_only";
  const isCompanyAdmin = userRole === "company_admin";
  const isSuperAdmin = userRole === "super_admin";
  const isProcurement = userRole === "procurement";
  const isManager = userRole === "contract_manager" || isProcurement;

  const isAdmin = hasAnyRole(["company_admin", "super_admin"]);
  const canManageUsers = hasAnyRole(["company_admin", "super_admin"]);
  const canManageCompanies = userRole === "super_admin";
  const canEvaluate = hasAnyRole(["evaluator", "company_admin", "super_admin"]);
  const canSubmitProposals = userRole === "vendor";
  const canManageSolicitations = hasAnyRole([
    "procurement",
    "company_admin",
    "super_admin",
  ]);

  return {
    userRole,
    dashboardConfig,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isEvaluator,
    isVendor,
    isProjectManager,
    isApprover,
    isViewOnly,
    isCompanyAdmin,
    isSuperAdmin,
    isProcurement,
    isAdmin,
    isManager,
    canManageUsers,
    canManageCompanies,
    canEvaluate,
    canSubmitProposals,
    canManageSolicitations,
  };
};
