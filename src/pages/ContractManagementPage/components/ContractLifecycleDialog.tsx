import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { postRequest, patchRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import type { ApiResponseError } from "@/types";
import { Ban, AlertTriangle, FolderPlus, BadgeCheck } from "lucide-react";
import type { LifecycleAction } from "./contractLifecycle";

type Kind = "contract" | "msa";

type Props = {
  action: LifecycleAction | null;
  kind: Kind;
  id: string;
  /** Optional contract/MSA title — currently unused in copy but kept for future. */
  title?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Brand navy — shadcn's default Button variant inverts to white in dark mode,
// so non-destructive CTAs are styled explicitly here.
const NAVY = "#2A4467";

// terminate/suspend/complete map to a single PATCH /status endpoint; the action
// verb maps to the contract lifecycle status value the BE expects.
const STATUS_FOR_ACTION: Record<"terminate" | "suspend" | "complete", string> = {
  terminate: "terminated",
  suspend: "suspended",
  complete: "completed",
};

type ActionConfig = {
  Icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  title: (noun: string) => string;
  desc: (nounLower: string) => string;
  confirmLabel: string;
  destructive: boolean;
  successTitle: (noun: string) => string;
};

const CONFIG: Record<LifecycleAction, ActionConfig> = {
  terminate: {
    Icon: Ban,
    iconClass: "text-red-500",
    title: (n) => `Terminate ${n}`,
    desc: (n) => `This action will permanently end the ${n}.`,
    confirmLabel: "Terminate",
    destructive: true,
    successTitle: (n) => `${n} Terminated Successfully`,
  },
  suspend: {
    Icon: AlertTriangle,
    iconClass: "text-red-500",
    title: (n) => `Suspend ${n}`,
    desc: (n) => `This action will suspend all actions & operations on this ${n}.`,
    confirmLabel: "Suspend",
    destructive: true,
    successTitle: (n) => `${n} Suspended Successfully`,
  },
  complete: {
    Icon: BadgeCheck,
    iconClass: "text-green-500",
    title: (n) => `Complete ${n}`,
    desc: (n) => `This action will mark this ${n} as complete.`,
    confirmLabel: "Complete",
    destructive: false,
    successTitle: (n) => `${n} Completed Successfully`,
  },
  manage: {
    Icon: FolderPlus,
    iconClass: "text-blue-500",
    title: (n) => `Manage ${n}`,
    desc: (n) => `This action will transfer ownership of this ${n} to you.`,
    confirmLabel: "Manage",
    destructive: false,
    successTitle: (n) => `${n} Management Successfully`,
  },
};

const ContractLifecycleDialog: React.FC<Props> = ({
  action,
  kind,
  id,
  open,
  onOpenChange,
}) => {
  const qc = useQueryClient();
  const toast = useToastHandler();

  const noun = kind === "msa" ? "MSA" : "Contract";
  const nounLower = kind === "msa" ? "MSA" : "contract";
  const base =
    kind === "msa"
      ? "/contract/manager/msa-contracts"
      : "/contract/manager/contracts";

  const mutation = useMutation({
    mutationFn: async () => {
      if (!action) return;
      if (action === "manage") {
        // Adds the current user to the contract's managers list.
        const res = await postRequest({ url: `${base}/${id}/manage`, payload: {} });
        return res.data;
      }
      // terminate / suspend / complete → lifecycle status update.
      const res = await patchRequest({
        url: `${base}/${id}/status`,
        payload: { status: STATUS_FOR_ACTION[action] },
      });
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey?.[0];
          if (typeof key !== "string") return false;
          return kind === "msa"
            ? key.includes("msa")
            : key.includes("contract") && !key.includes("msa");
        },
      });
    },
    onError: (error) => {
      toast.error(noun, error as ApiResponseError);
    },
  });

  // Reset success/error state whenever the dialog is dismissed so the next open
  // starts at the confirm step.
  React.useEffect(() => {
    if (!open) mutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!action) return null;

  const cfg = CONFIG[action];
  const succeeded = mutation.isSuccess;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md dark:bg-slate-900"
        data-testid={`lifecycle-dialog-${kind}-${action}`}
      >
        {succeeded ? (
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <BadgeCheck className="h-12 w-12 text-green-500" />
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {cfg.successTitle(noun)}
            </DialogTitle>
            <Button
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: NAVY }}
              data-testid="lifecycle-done"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <cfg.Icon className={`h-12 w-12 ${cfg.iconClass}`} />
            <div className="space-y-1">
              <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {cfg.title(noun)}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                {cfg.desc(nounLower)}
              </DialogDescription>
            </div>
            <div className="flex w-full gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 dark:border-slate-700 dark:text-slate-100"
                disabled={mutation.isPending}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className={
                  cfg.destructive
                    ? "flex-1 bg-red-500 text-white hover:bg-red-600"
                    : "flex-1 text-white hover:opacity-90"
                }
                style={cfg.destructive ? undefined : { backgroundColor: NAVY }}
                disabled={mutation.isPending}
                data-testid="lifecycle-confirm"
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? "Please wait…" : cfg.confirmLabel}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContractLifecycleDialog;
