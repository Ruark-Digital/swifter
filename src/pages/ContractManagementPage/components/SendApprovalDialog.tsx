import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";

type ApproverPoolEntry = {
  approverId?: string;
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  approvalLevels?: number[];
};

type PoolResponse = {
  status?: number;
  message?: string;
  data?: ApproverPoolEntry[];
};

type Props = {
  trigger: React.ReactNode;
  contractId: string;
  /** "claim" | "change" — drives toast copy. Default "claim". */
  entityLabel?: "claim" | "change";
  /** POST endpoint for assignment. If omitted, the submit is a no-op
   *  (preserves the placeholder behavior on call sites that aren't wired).
   *  The caller is responsible for embedding the entity id in the path. */
  assignUrl?: string;
  /** Called after a successful POST; typically a query invalidation. */
  onSent?: () => void;
};

const SendApprovalDialog: React.FC<Props> = ({
  trigger,
  contractId,
  entityLabel = "claim",
  assignUrl,
  onSent,
}) => {
  const toast = useToastHandler();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [selectedGroup, setSelectedGroup] = React.useState<string>("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Reset everything when the dialog closes so a re-open starts fresh.
  React.useEffect(() => {
    if (!open) {
      setSelectedGroup("");
      setSelectedIds([]);
    }
  }, [open]);

  const { data: poolRes, isLoading } = useQuery<PoolResponse>({
    queryKey: ["contract-approvers-pool", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/contracts/${contractId}/approvers`,
      });
      return res.data as PoolResponse;
    },
    enabled: open && Boolean(contractId),
    staleTime: 60_000,
    retry: false,
  });

  const allApprovers = React.useMemo<ApproverPoolEntry[]>(
    () => poolRes?.data ?? [],
    [poolRes?.data],
  );

  // Group options derived from the union of all approvalLevels across the pool.
  const groupOptions = React.useMemo(() => {
    const levels = new Set<number>();
    for (const a of allApprovers) {
      for (const lvl of a?.approvalLevels ?? []) {
        if (typeof lvl === "number" && !Number.isNaN(lvl)) levels.add(lvl);
      }
    }
    return Array.from(levels)
      .sort((a, b) => a - b)
      .map((level) => ({
        value: String(level),
        label: `Approval Level ${level}`,
      }));
  }, [allApprovers]);

  // Filtered to the chosen group only. Empty when no group is selected —
  // that's the visibility gate the user asked for.
  const visibleApprovers = React.useMemo(() => {
    if (!selectedGroup) return [];
    return allApprovers.filter((a) =>
      (a?.approvalLevels ?? []).some((lvl) => String(lvl) === selectedGroup),
    );
  }, [allApprovers, selectedGroup]);

  const approverById = React.useMemo(() => {
    const m = new Map<string, ApproverPoolEntry>();
    for (const a of allApprovers) {
      const id = a?.approverId ?? a?._id;
      if (id) m.set(id, a);
    }
    return m;
  }, [allApprovers]);

  const assignedApprovers = React.useMemo(
    () =>
      selectedIds
        .map((id) => approverById.get(id))
        .filter((a): a is ApproverPoolEntry => !!a),
    [selectedIds, approverById],
  );

  const toggleAssigned = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const removeAssigned = (id: string) => {
    setSelectedIds((prev) => prev.filter((v) => v !== id));
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!assignUrl) {
        throw new Error(
          `Send-for-approval endpoint is not configured for this ${entityLabel}.`,
        );
      }
      return await postRequest({
        url: assignUrl,
        payload: { userIds: selectedIds },
      });
    },
    onSuccess: () => {
      toast.success(
        "Success",
        `Approvers assigned to this ${entityLabel} successfully`,
      );
      queryClient.invalidateQueries({
        queryKey: ["contract-approvers-pool", contractId],
      });
      onSent?.();
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(
        "Error",
        error?.response?.data?.message ??
          error?.message ??
          `Failed to send this ${entityLabel} for approval`,
      );
    },
  });

  const canSubmit =
    !!assignUrl && selectedIds.length > 0 && !sendMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl rounded-2xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
            Send for Approval
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Select Approvers Group
            </span>
            <Select
              value={selectedGroup}
              onValueChange={setSelectedGroup}
              disabled={isLoading || groupOptions.length === 0}
            >
              <SelectTrigger className="h-11 w-full rounded-lg border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <SelectValue
                  placeholder={
                    isLoading
                      ? "Loading approvers..."
                      : groupOptions.length === 0
                        ? "No approval levels configured"
                        : "Select Option"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {groupOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedGroup ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-950/40">
              <div className="grid grid-cols-[1fr_120px_120px] gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                <span>Approver</span>
                <span>Role</span>
                <span className="text-right">Action</span>
              </div>
              {visibleApprovers.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No approvers configured for this group.
                </div>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                  {visibleApprovers.map((a) => {
                    const id = a.approverId ?? a._id ?? "";
                    const isAssigned = selectedIds.includes(id);
                    return (
                      <li
                        key={id}
                        className="grid grid-cols-[1fr_120px_120px] gap-2 items-center px-4 py-3"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {a.name || "—"}
                          </span>
                          {a.email && (
                            <a
                              href={`mailto:${a.email}`}
                              className="text-xs text-blue-600 dark:text-blue-400 underline"
                            >
                              {a.email}
                            </a>
                          )}
                        </div>
                        <span className="text-slate-700 dark:text-slate-300">
                          {a.role || "—"}
                        </span>
                        <button
                          type="button"
                          onClick={() => id && toggleAssigned(id)}
                          disabled={!id}
                          className={cn(
                            "inline-flex items-center justify-end gap-1.5 text-sm font-semibold transition-colors",
                            isAssigned
                              ? "text-green-600 dark:text-green-400"
                              : "text-slate-600 dark:text-slate-300 hover:text-[#2A4467] dark:hover:text-blue-300",
                          )}
                        >
                          {isAssigned ? (
                            <>
                              <Check className="h-4 w-4" /> Assigned
                            </>
                          ) : (
                            "Assign"
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Select a group to see available approvers.
            </div>
          )}

          <div className="space-y-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Assigned Approvers
            </span>
            {assignedApprovers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 px-3 py-3 text-sm text-slate-500 dark:text-slate-400">
                No approvers assigned yet.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800/60 px-3 py-3">
                {assignedApprovers.map((a) => {
                  const id = a.approverId ?? a._id ?? "";
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#2A44671A] dark:bg-blue-900/30 px-2 py-1 text-xs font-semibold text-[#2A4467] dark:text-blue-200"
                    >
                      {a.name || a.email || "—"}
                      <button
                        type="button"
                        onClick={() => id && removeAssigned(id)}
                        className="text-[#E53935] dark:text-red-300"
                        aria-label={`Remove ${a.name || a.email}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              onClick={() => setOpen(false)}
              disabled={sendMutation.isPending}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => sendMutation.mutate()}
              disabled={!canSubmit}
              aria-busy={sendMutation.isPending}
            >
              {sendMutation.isPending
                ? "Sending..."
                : `Send for Approval${
                    selectedIds.length > 0 ? ` (${selectedIds.length})` : ""
                  }`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendApprovalDialog;
