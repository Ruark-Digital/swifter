import React from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from '@hugeicons/react'
import { FolderOffIcon, Add01Icon } from '@hugeicons/core-free-icons'


type EmptyStateProps = {
  handleCreateClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ handleCreateClick }) => {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center h-[600px] space-y-6"
    >
      <HugeiconsIcon icon={FolderOffIcon} className="h-14 w-14 text-slate-300" />
      <p className="text-2xl font-semibold text-slate-600">No Projects Yet</p>
      <Button
        data-testid="create-projects-button"
        aria-label="Create Projects"
        className="rounded-xl h-12 px-4"
        onClick={handleCreateClick}
      >
        <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" /> Create Projects
      </Button>
    </div>
  );
};

export default EmptyState;

