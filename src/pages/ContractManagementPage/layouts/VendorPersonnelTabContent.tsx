import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/layouts/DataTable";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import { getRequest, putRequest } from "@/lib/axiosInstance";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useUserRole } from "@/hooks/useUserRole";
import { useToastHandler } from "@/hooks/useToaster";
import type { ApiResponseError } from "@/types";

export type VendorPersonnel = {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
};

type Props = {
  contractId: string;
  isActive?: boolean;
  owner?: boolean;
  /** Contract/MSA lifecycle status — actions are only allowed once active/publish. */
  status?: string;
  /** Picks the manager base path segment: contracts vs msa-contracts. */
  contractType?: "Contract" | "MsaContract";
  /** Optional query key to also invalidate on save (e.g. the parent contract/MSA detail query). */
  invalidateQueryKey?: unknown[];
};

const emptyDraft: VendorPersonnel = { name: "", email: "", phone: "", role: "" };

const VendorPersonnelTabContent: React.FC<Props> = ({
  contractId,
  isActive,
  owner,
  status,
  contractType = "Contract",
  invalidateQueryKey,
}) => {
  const { isManager, isCompanyAdmin } = useUserRole();
  // Tab is visible to the owning CM/PL, but add/edit/remove is only allowed
  // once the contract is active/published (per product rule).
  const isActionableStatus = status === "active" || status === "publish";
  const canManage =
    (isManager || isCompanyAdmin) && Boolean(owner) && isActionableStatus;
  const toastHandler = useToastHandler();
  const qc = useQueryClient();

  const segment = contractType === "MsaContract" ? "msa-contracts" : "contracts";
  const basePath = `/contract/manager/${segment}/${contractId}/vendor-personnel`;
  const queryKey = useUserQueryKey([
    "vendor-personnel",
    contractType,
    contractId,
  ]);

  const { data, isLoading } = useQuery<
    { data?: VendorPersonnel[] },
    ApiResponseError
  >({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({ url: basePath });
      return res.data as { data?: VendorPersonnel[] };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const personnel = React.useMemo<VendorPersonnel[]>(
    () => (Array.isArray(data?.data) ? (data?.data as VendorPersonnel[]) : []),
    [data?.data],
  );

  // The endpoint replaces the whole list, so every add/edit/remove rebuilds the
  // array and PUTs it back.
  const saveMutation = useMutation<unknown, ApiResponseError, VendorPersonnel[]>({
    mutationKey: ["vendor-personnel", "save", contractType, contractId],
    mutationFn: async (next) => {
      const payload = {
        personnel: next.map((p) => ({
          name: p.name,
          email: p.email,
          phone: p.phone || undefined,
          role: p.role || undefined,
        })),
      };
      const res = await putRequest({ url: basePath, payload });
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey });
      if (invalidateQueryKey) {
        await qc.invalidateQueries({ queryKey: invalidateQueryKey });
      }
    },
    onError: (err) => toastHandler.error("Vendor Personnel", err),
  });

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editIndex, setEditIndex] = React.useState<number | null>(null);
  const [draft, setDraft] = React.useState<VendorPersonnel>(emptyDraft);
  const [removeIndex, setRemoveIndex] = React.useState<number | null>(null);

  const openAdd = () => {
    setEditIndex(null);
    setDraft(emptyDraft);
    setDialogOpen(true);
  };
  const openEdit = (idx: number) => {
    setEditIndex(idx);
    setDraft({ ...personnel[idx] });
    setDialogOpen(true);
  };

  const canSubmitDraft =
    draft.name.trim().length > 0 && draft.email.trim().length > 0;

  const handleSave = async () => {
    if (!canSubmitDraft) return;
    const clean: VendorPersonnel = {
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone?.trim() || undefined,
      role: draft.role?.trim() || undefined,
    };
    const next =
      editIndex === null
        ? [...personnel, clean]
        : personnel.map((p, i) => (i === editIndex ? clean : p));
    try {
      await saveMutation.mutateAsync(next);
      setDialogOpen(false);
      toastHandler.success(
        "Vendor Personnel",
        editIndex === null ? "Personnel added" : "Personnel updated",
      );
    } catch {
      // error toast handled in onError
    }
  };

  const handleRemove = async () => {
    if (removeIndex === null) return;
    const next = personnel.filter((_, i) => i !== removeIndex);
    try {
      await saveMutation.mutateAsync(next);
      setRemoveIndex(null);
      toastHandler.success("Vendor Personnel", "Personnel removed");
    } catch {
      // error toast handled in onError
    }
  };

  const columns = React.useMemo<ColumnDef<VendorPersonnel>[]>(() => {
    const base: ColumnDef<VendorPersonnel>[] = [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => row.original.name || "-",
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email || "-",
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => row.original.phone || "-",
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => row.original.role || "-",
      },
    ];
    if (canManage) {
      base.push({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="text-sm font-medium text-green-700 hover:underline"
              data-testid="edit-personnel"
              onClick={() => openEdit(row.index)}
            >
              Edit
            </button>
            <button
              type="button"
              className="text-sm font-medium text-red-600 hover:underline"
              data-testid="remove-personnel"
              onClick={() => setRemoveIndex(row.index)}
            >
              Remove
            </button>
          </div>
        ),
      });
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, personnel]);

  return (
    <TabsContent value="vendor-personnel" className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
            Vendor Personnel
          </h3>
          <p className="text-sm text-[#6B7280] dark:text-slate-400">
            People the vendor has assigned to this{" "}
            {contractType === "MsaContract" ? "MSA" : "contract"}.
          </p>
          {(isManager || isCompanyAdmin) &&
            Boolean(owner) &&
            !isActionableStatus && (
              <p className="mt-1 text-xs text-[#9CA3AF] dark:text-slate-500">
                Personnel can be added or edited once the{" "}
                {contractType === "MsaContract" ? "MSA" : "contract"} is
                active/published.
              </p>
            )}
        </div>
        {canManage && (
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add Personnel
          </Button>
        )}
      </div>

      <DataTable<VendorPersonnel>
        data={personnel}
        columns={columns}
        options={{ isLoading }}
        emptyPlaceholder={
          isLoading ? "Loading..." : "No vendor personnel yet."
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editIndex === null ? "Add Personnel" : "Edit Personnel"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">
                Name
              </label>
              <Input
                value={draft.name}
                placeholder="Full name"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">
                Email
              </label>
              <Input
                type="email"
                value={draft.email}
                placeholder="name@example.com"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">
                Phone <span className="text-slate-400">(optional)</span>
              </label>
              <Input
                value={draft.phone ?? ""}
                placeholder="Phone number"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">
                Role <span className="text-slate-400">(optional)</span>
              </label>
              <Input
                value={draft.role ?? ""}
                placeholder="e.g. Site Engineer"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, role: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDialogOpen(false)}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={!canSubmitDraft || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmAlert
        open={removeIndex !== null}
        onClose={(o) => !o && setRemoveIndex(null)}
        type="warning"
        title="Remove Personnel"
        text="Remove this person from the vendor personnel list?"
        primaryButtonText="Remove"
        secondaryButtonText="Cancel"
        primaryButtonLoading={saveMutation.isPending}
        onPrimaryAction={handleRemove}
        onSecondaryAction={() => setRemoveIndex(null)}
      />
    </TabsContent>
  );
};

export default VendorPersonnelTabContent;
