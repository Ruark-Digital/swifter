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
   * The vendor user's current roles as populated `{ _id, name }` objects (from
   * the vendor-detail response). Preferred for prefill: `GET /users/{id}`
   * returns bare role ids, which can't be matched to the two named options.
   */
  currentRoles?: Array<{ _id?: string; name?: string } | string>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

/**
 * #84 — grant a vendor-side account Vendor (Solicitation) and/or Vendor-PM
 * (CLM) access. Reuses the QA #177 paired-role mechanism (RoleComboField +
 * roleCombos) but scoped to the two vendor roles. Prefills the current roles
 * (so saving never drops an existing grant), then PUTs the selected role
 * NAMES as `{ role }` to `PUT /procurement/vendors/{vendorId}`.
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

  const hasCurrentRoles =
    Array.isArray(currentRoles) && currentRoles.length > 0;

  // Current roles of the vendor user — prefill so we don't drop an existing
  // access on save. Only fetched when the caller didn't already pass the
  // (populated) roles; `/users/{id}` returns bare role ids anyway.
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
    // Prefer the populated roles passed from the vendor detail (they carry
    // names, so they resolve to the two named options). The `/users/{id}`
    // fetch only returns bare role ids and is a fallback.
    if (hasCurrentRoles) {
      forge.reset({ roles: optionsFromUserRoles(currentRoles, undefined, options) });
      return;
    }
    if (!user) return;
    const u = user as { roles?: unknown; role?: unknown };
    forge.reset({ roles: optionsFromUserRoles(u.roles, u.role, options) });
    // Re-hydrate only when the source roles / option list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, options, currentRoles]);

  const { mutateAsync: save, isPending } = useMutation({
    mutationKey: ["updateVendorAccess", vendorId],
    // Vendor role access is updated on the vendor resource, not the linked
    // user account: `PUT /procurement/vendors/{vendorId}` with `role` — an
    // array of role NAMES ("vendor"/"project_manager"), first = primary
    // (same shape as the project-manager endpoint), NOT role document ids.
    mutationFn: async (roleNames: string[]) =>
      await putRequest({
        url: `/procurement/vendors/${vendorId}`,
        payload: { role: roleNames },
      }),
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
    const selected = data.roles ?? [];
    if (selected.length === 0) {
      toast.error("Select access", "Assign at least one access.");
      return;
    }
    if (!vendorId) {
      toast.error("Error", "Missing vendor reference.");
      return;
    }
    // The BE expects role NAMES ("vendor"/"project_manager"), not the catalog
    // document ids the multi-select carries as its value — map each back to its
    // name via the option list.
    const roleNames = selected
      .map((o) => options.find((opt) => opt.value === o.value)?.name)
      .filter((n): n is string => !!n);
    if (roleNames.length === 0) {
      toast.error("Select access", "Assign at least one access.");
      return;
    }
    await save(roleNames);
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
