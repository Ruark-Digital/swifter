import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { putRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import type { ApiResponseError } from "@/types";

type PmRole = "vendor" | "project_manager";

type Props = {
  /** Project manager document id — the `pmId` path param. */
  pmId?: string;
  pmName?: string;
  /** The PM's current role, when the API surfaces it, for prefill. */
  currentRole?: string;
  /** Vendor entity id — used only to invalidate the vendor detail cache. */
  vendorId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

// The BE only allows a project-manager account one of these two roles.
const ROLE_OPTIONS: { value: PmRole; label: string }[] = [
  { value: "vendor", label: "Vendor (Solicitation)" },
  { value: "project_manager", label: "Vendor-PM (CLM)" },
];

/**
 * #84 — manage a single project manager's access. Unlike the vendor account
 * (multi-role → `PUT /users/{id}`), a PM holds exactly one role, updated via
 * `PUT /procurement/vendors/project-manager/{pmId}` with `{ role }`.
 */
const ManageProjectManagerAccessDialog: React.FC<Props> = ({
  pmId,
  pmName,
  currentRole,
  vendorId,
  open = false,
  onOpenChange,
}) => {
  const toast = useToastHandler();
  const qc = useQueryClient();
  const setOpen = onOpenChange ?? (() => {});

  const [role, setRole] = useState<PmRole>("project_manager");

  useEffect(() => {
    if (!open) return;
    const normalized = currentRole?.toLowerCase();
    setRole(normalized === "vendor" ? "vendor" : "project_manager");
  }, [open, currentRole]);

  const { mutateAsync: save, isPending } = useMutation({
    mutationKey: ["updateProjectManagerAccess", pmId],
    mutationFn: async (nextRole: PmRole) =>
      await putRequest({
        url: `/procurement/vendors/project-manager/${pmId}`,
        payload: { role: nextRole },
      }),
    onSuccess: () => {
      toast.success("Access updated", "Project manager access saved.");
      if (vendorId) qc.invalidateQueries({ queryKey: ["vendor", vendorId] });
      setOpen(false);
    },
    onError: (error) => {
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message || "Failed to update access",
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0">
        <div className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-200">
            Manage Access{pmName ? ` — ${pmName}` : ""}
          </DialogTitle>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Grant this project manager Solicitation (Vendor) or CLM (Vendor-PM)
            access.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Access *
            </label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as PmRole)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select access" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 pt-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-gray-300 px-8 py-2 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending || !pmId}
            onClick={() => save(role)}
            className="rounded-lg bg-[#2A4467] px-8 py-2 text-white hover:bg-[#1e3147] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save Access"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageProjectManagerAccessDialog;
