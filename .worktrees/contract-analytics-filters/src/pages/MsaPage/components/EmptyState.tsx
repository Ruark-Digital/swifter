import React from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { FolderOffIcon, Add01Icon } from "@hugeicons/core-free-icons";

const EmptyState: React.FC = () => {
  return (
    <div
      className="flex flex-col items-center justify-center h-[520px] space-y-4"
      data-testid="msa-empty-state"
    >
      <HugeiconsIcon
        icon={FolderOffIcon}
        className="h-14 w-14 text-slate-400"
        aria-hidden
      />
      <div className="text-center space-y-1">
        <p className="text-2xl font-semibold text-slate-600">No MSA Yet</p>
        <p className="text-sm text-slate-500 max-w-md">
          You don’t have any Master Service Agreements at the moment. Click the
          button below to create your first MSA.
        </p>
      </div>
      <Button className="h-12 rounded-xl" data-testid="create-msa-cta">
        <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" /> Create MSA
      </Button>
    </div>
  );
};

export default EmptyState;
