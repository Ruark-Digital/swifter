import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forge, useForge } from "@adexdsamson/forge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRequest, putRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import { useRoleCatalog } from "@/hooks/useRoleCatalog";
import {
  buildVendorAccessOptions,
  optionsFromUserRoles,
} from "@/lib/roleCombos";
import { RoleComboField } from "@/components/layouts/RoleComboField";
import type { Option } from "@/components/ui/multiselect";
import type { ApiResponseError } from "@/types";

type Props = {
  /** The vendor's underlying user account id (roles live on the user). */
  userId?: string;
  vendorName?: string;
  /** Vendor entity id — used only to invalidate the vendor detail cache. */
  vendorId?: string;
  /**
   * The vendor user's current roles, already present on the vendor-detail
   * payload (`vendor.user.roles`). When supplied, the dialog pre-selects them
   * directly and skips the redundant `/users/{id}` fetch.
   */
  currentRoles?: unknown;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

/**
 * #84 — grant a vendor-side account Vendor (Solicitation) and/or Vendor-PM
 * (CLM) access. Reuses the QA #177 paired-role mechanism (RoleComboField +
 * roleCombos) but scoped to the two vendor roles. Fetches the user's current
 * roles first so saving never clobbers an existing grant, then PUTs the
 * updated `roles[]` to `PUT /users/{id}`.
 */
const ManageVendorAccessDialog: React.FC<Props> = ({
  userId,
  vendorName,
  vendorId,
  currentRoles,
  open: controlledOpen,
  onOpenChange,
  trigger,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const toast = useToastHandler();
  const qc = useQueryClient();

  const { roles: catalog } = useRoleCatalog(open);
  const options = useMemo(() => buildVendorAccessOptions(catalog), [catalog]);

  // Roles already present on the vendor-detail payload are authoritative and
  // avoid a round-trip. Only fall back to `/users/{id}` when they aren't passed.
  const hasCurrentRoles = Array.isArray(currentRoles) && currentRoles.length > 0;

  // Current roles of the vendor user — prefill so we don't drop an existing
  // access on save.
  const { data: userRes, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => (await getRequest({ url: `/users/${userId}` })).data,
    enabled: open && !!userId && !hasCurrentRoles,
  });
  const user = (userRes as { data?: unknown })?.data ?? userRes;

  const forge = useForge<{ roles: Option[] }>({
    defaultValues: { roles: [] },
  });

  useEffect(() => {
    if (!open || options.length === 0) return;
    const u = (user ?? {}) as { roles?: unknown; role?: unknown };
    // Prefer the roles handed down from the vendor-detail payload; otherwise
    // use the freshly fetched user. Bail until at least one source is ready.
    const roles = hasCurrentRoles ? currentRoles : u.roles;
    if (!hasCurrentRoles && !user) return;
    forge.reset({ roles: optionsFromUserRoles(roles, u.role, options) });
    // Re-hydrate only when the source roles / option list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, options, currentRoles]);

  const { mutateAsync: save, isPending } = useMutation({
    mutationKey: ["updateVendorAccess", userId],
    mutationFn: async (roleIds: string[]) =>
      await putRequest({ url: `/users/${userId}`, payload: { roles: roleIds } }),
    onSuccess: () => {
      toast.success("Access updated", "Vendor access roles saved.");
      qc.invalidateQueries({ queryKey: ["vendors"] });
      if (vendorId) qc.invalidateQueries({ queryKey: ["vendor", vendorId] });
      qc.invalidateQueries({ queryKey: ["user", userId] });
      setOpen(false);
    },
    onError: (error) => {
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message || "Failed to update vendor access",
      );
    },
  });

  const onSubmit = async (data: { roles: Option[] }) => {
    const roleIds = (data.roles ?? []).map((o) => o.value);
    if (roleIds.length === 0) {
      toast.error("Select access", "Assign at least one access.");
      return;
    }
    await save(roleIds);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md p-0">
        <div className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-200">
            Manage Access{vendorName ? ` — ${vendorName}` : ""}
          </DialogTitle>
        </div>

        <Forge control={forge.control} onSubmit={onSubmit}>
          <div className="space-y-4 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Grant this vendor account Solicitation (Vendor) and/or CLM
              (Vendor-PM) access. You can assign one or both.
            </p>
            {isLoadingUser ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading current access…
              </p>
            ) : (
              <RoleComboField
                control={forge.control}
                options={options}
                label="Access *"
              />
            )}
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
              type="submit"
              disabled={isPending || isLoadingUser}
              className="rounded-lg bg-[#2A4467] px-8 py-2 text-white hover:bg-[#1e3147] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save Access"}
            </Button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default ManageVendorAccessDialog;
