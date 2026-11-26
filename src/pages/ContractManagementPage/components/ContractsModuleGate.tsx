import React from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/store/authSlice";
import { isModuleDisabled } from "@/lib/moduleFlags";

/**
 * Shows a friendly notice instead of a blank page when someone opens a
 * Contracts URL directly while Contract Management is switched off for their
 * company. Only an explicit "off" blocks; an absent flag leaves the page as is.
 */
const ContractsModuleGate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = useUser();
  if (!isModuleDisabled(user?.module?.contractManagement)) return <>{children}</>;
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center"
      data-testid="contracts-module-disabled"
    >
      <p className="text-2xl font-semibold text-slate-700 dark:text-slate-200">
        Contracts are not enabled for your company
      </p>
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
        Contract Management is turned off for your company. Contact your
        administrator to have it enabled.
      </p>
      <Button variant="outline" onClick={() => window.history.back()}>
        Go back
      </Button>
    </div>
  );
};

export default ContractsModuleGate;
