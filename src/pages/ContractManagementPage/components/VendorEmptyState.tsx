import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FolderOffIcon } from "@hugeicons/core-free-icons";

const VendorEmptyState: React.FC = () => {
  return (
    <div
      className="flex flex-col items-center justify-center h-[520px] space-y-4"
      data-testid="vendor-empty-state"
    >
      <HugeiconsIcon
        icon={FolderOffIcon}
        className="h-14 w-14 text-slate-400"
        aria-hidden
      />
      <div className="text-center space-y-1">
        <p className="text-2xl font-semibold text-slate-600">No Contracts Yet</p>
        <p className="text-sm text-slate-500 max-w-md">
          You don’t have any contracts at the moment. Once a contract is assigned to
          you, it will appear here.
        </p>
      </div>
    </div>
  );
};

export default VendorEmptyState;
