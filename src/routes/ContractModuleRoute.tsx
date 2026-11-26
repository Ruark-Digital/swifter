import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * Route guard for the Contracts / MSA modules. Mirrors the sidebar
 * (`lib/navigation.ts`), which shows these pages to contract_manager,
 * procurement, vendor, project_manager, approver, view_only and company_admin,
 * so other roles (evaluator, super_admin) opening the URL directly get a clear
 * "no access" page instead of a failed-to-load detail page.
 */
export const ContractModuleRoute = ({ children }: { children: ReactNode }) => {
  const {
    userRole,
    isManager,
    isVendor,
    isProjectManager,
    isApprover,
    isViewOnly,
    isCompanyAdmin,
  } = useUserRole();

  // Role not resolved yet (e.g. role catalog still loading): don't flash a denial.
  if (!userRole) return <>{children}</>;

  const allowed =
    isManager ||
    isVendor ||
    isProjectManager ||
    isApprover ||
    isViewOnly ||
    isCompanyAdmin;

  if (allowed) return <>{children}</>;

  return (
    <div
      className="flex flex-col items-center justify-center h-[520px] space-y-3 text-center"
      data-testid="no-access"
    >
      <p className="text-2xl font-semibold text-slate-700 dark:text-slate-200">
        You don't have access
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
        Your role doesn't include Contracts or MSAs.
      </p>
      <Link to="/dashboard" className="text-blue-600 underline underline-offset-4">
        Back to dashboard
      </Link>
    </div>
  );
};
