import React from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { FolderOffIcon, Add01Icon } from "@hugeicons/core-free-icons";
import { useUserRole } from "@/hooks/useUserRole";
import CreateMSADialog from "../layouts/CreateMSADialog";

const EmptyState: React.FC = () => {
  const { isManager } = useUserRole();

  return (
    <div
      className="flex flex-col items-center justify-center h-[520px] space-y-4"
      data-testid="msa-empty-state"
    >
      <HugeiconsIcon
        icon={FolderOffIcon}
        className="h-14 w-14 text-slate-400 dark:text-slate-500"
        aria-hidden
      />
      <div className="text-center space-y-1">
        <p className="text-2xl font-semibold text-slate-600 dark:text-slate-300">No MSA Yet</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          You don’t have any Master Service Agreements at the moment. Click the
          button below to create your first MSA.
        </p>
      </div>
      {isManager ? (
        <CreateMSADialog
          trigger={
            <Button className="h-12 rounded-xl" data-testid="create-msa-cta">
              <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" /> Create MSA
            </Button>
          }
        />
      ) : null}
    </div>
  );
};

export default EmptyState;
