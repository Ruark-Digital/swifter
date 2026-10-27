import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MultipleSelector, { type Option } from "@/components/ui/multiselect";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { putRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import type { ApiResponseError } from "@/types";

type PmRole = "vendor" | "project_manager";

type Props = {
  /** Project manager document id — the `pmId` path param. */
  pmId?: string;
  pmName?: string;
  /** The PM's current role(s), when the API surfaces them, for prefill. */
  currentRole?: string | string[];
  /** Vendor entity id — used only to invalidate the vendor detail cache. */
  vendorId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

// The BE accepts one or both of these; the first entry becomes the primary
// role. Values are role NAMES (not document ids like `/users/{id}`).
const ROLE_OPTIONS: Option[] = [
  { value: "vendor", label: "Vendor (Solicitation)" },
  { value: "project_manager", label: "Vendor-PM (CLM)" },
];

const toOptions = (current?: string | string[]): Option[] => {
  const names = (Array.isArray(current) ? current : current ? [current] : [])
    .map((n) => n.toLowerCase())
    .filter((n): n is PmRole => n === "vendor" || n === "project_manager");
  const seen = new Set<string>();
  const picked = names
    .filter((n) => (seen.has(n) ? false : (seen.add(n), true)))
    .map((n) => ROLE_OPTIONS.find((o) => o.value === n)!)
    .filter(Boolean);
  return picked.length ? picked : [ROLE_OPTIONS[1]]; // default: Vendor-PM
};

/**
 * #84 — manage a single project manager's access. Unlike the vendor account
 * (role document ids → `PUT /users/{id}`), a PM's roles are updated via
 * `PUT /procurement/vendors/project-manager/{pmId}` with `{ role: string[] }`
 * (role names, one or both, first entry = primary).
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

  const [selected, setSelected] = useState<Option[]>([ROLE_OPTIONS[1]]);

  useEffect(() => {
    if (!open) return;
    setSelected(toOptions(currentRole));
  }, [open, currentRole]);

  const { mutateAsync: save, isPending } = useMutation({
    mutationKey: ["updateProjectManagerAccess", pmId],
    mutationFn: async (roles: string[]) =>
      await putRequest({
        url: `/procurement/vendors/project-manager/${pmId}`,
        payload: { role: roles },
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

  const onSave = async () => {
    const roles = selected.map((o) => o.value);
    if (roles.length === 0) {
      toast.error("Select access", "Assign at least one access.");
      return;
    }
    await save(roles);
  };

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
            Grant this project manager Solicitation (Vendor) and/or CLM
            (Vendor-PM) access. You can assign one or both.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Access *
            </label>
            <MultipleSelector
              value={selected}
              options={ROLE_OPTIONS}
              onValueChange={(next) => setSelected(next.slice(0, 2))}
              placeholder="Select up to 2 roles"
              hideClearAllButton
            />
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
            onClick={onSave}
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
