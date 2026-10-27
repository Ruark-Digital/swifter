import { useMemo } from "react";
import { useUser } from "@/store/authSlice";
import { Role, UserRole } from "@/types";
import { getDashboardConfig } from "@/config/dashboardConfig";
import { useActiveRole } from "@/hooks/useActiveRole";
import { useRoleCatalog } from "@/hooks/useRoleCatalog";

const KNOWN_ROLE_NAMES = new Set<string>([
  "evaluator",
  "vendor",
  "project_manager",
  "approver",
  "view_only",
  "company_admin",
  "super_admin",
  "procurement",
  "contract_manager",
]);

// A string role value is an id (not a name) when it isn't a known role slug.
const looksLikeRoleId = (value: string) => !KNOWN_ROLE_NAMES.has(value);

/**
 * Hook to manage user role-based functionality.
 *
 * Multi-role (QA #177): the user may hold up to two roles. We resolve a single
 * *active* role from the set so every downstream guard/dashboard/API-dispatch
 * keeps operating exactly as it did in the single-role world. The full set and
 * a switcher setter are exposed for the header RoleSwitcher.
 */
export const useUserRole = () => {
  const user = useUser();

  // Raw role values: prefer multi-role `roles`, fall back to legacy singular
  // `role`. Items may be populated Role objects, name slugs, or bare ids.
  const rawRoles = useMemo<(Role | string)[]>(() => {
    if (user?.roles?.length) return user.roles;
    if (user?.role) return [user.role];
    return [];
  }, [user?.roles, user?.role]);

  // Only fetch the id->name catalog when a bare id string actually appears.
  const needsCatalog = useMemo(
    () => rawRoles.some((r) => typeof r === "string" && looksLikeRoleId(r)),
    [rawRoles]
  );
  const { idToName } = useRoleCatalog(needsCatalog);

  const roleSet = useMemo<UserRole[]>(() => {
    const names = rawRoles
      .map((r) => {
        if (typeof r !== "string") return r?.name;
        return looksLikeRoleId(r) ? idToName.get(r) : (r as UserRole);
      })
      .filter((name): name is UserRole => !!name);
    return Array.from(new Set(names));
  }, [rawRoles, idToName]);

  const { activeRole, setActiveRole } = useActiveRole(roleSet, user?._id);

  const userRole: UserRole = useMemo(() => {
    // Active role from the resolved set (multi-role path).
    if (activeRole && roleSet.includes(activeRole)) return activeRole;

    // Legacy single-role fallback (unchanged): live user, then persisted store.
    const roleName = user?.role?.name;
    if (roleName) return roleName;

    try {
      const raw = window.localStorage.getItem("auth");
      if (!raw) return "view_only";
      const parsed = JSON.parse(raw);
      const persistedRoleName = parsed?.state?.user?.role?.name;
      return persistedRoleName || "view_only";
    } catch {
      return "view_only";
    }
  }, [activeRole, roleSet, user?.role?.name]);

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

  const hasMultipleRoles = roleSet.length > 1;

  return {
    userRole,
    roles: roleSet,
    hasMultipleRoles,
    setActiveRole,
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
