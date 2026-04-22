import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge02Icon } from "@hugeicons/core-free-icons";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDetails?: () => void;
};

const SuccessAlert: React.FC<Props> = ({
  open,
  onOpenChange,
  onViewDetails,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md rounded-2xl">
        <div
          data-testid="project-created-success-dialog"
          className="space-y-2 flex flex-col justify-center items-center"
        >
          <div className="flex w-full items-center justify-center pb-2">
            <HugeiconsIcon
              icon={CheckmarkBadge02Icon}
              className="h-16 w-16 text-green-600"
              aria-hidden="true"
            />
          </div>
          <h5 className="text-base font-semibold text-slate-600">
            Project Created Successfully
          </h5>
          <p className="sr-only">Your project has been created.</p>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl"
            onClick={() => onOpenChange(false)}
            data-testid="success-close-button"
          >
            Close
          </Button>
          <Button
            className="flex-1 h-12 rounded-xl"
            onClick={() => {
              onOpenChange(false);
              onViewDetails?.();
            }}
            data-testid="success-view-details-button"
          >
            View Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessAlert;
