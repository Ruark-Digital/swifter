import React from "react";
import { ArrowLeft, X } from "lucide-react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserRole } from "@/hooks/useUserRole";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { getRequest, postRequest, putRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import { getFileExtension, getFileIcon } from "@/lib/fileUtils";
import { DocumentItem, type DocType } from "./DocumentItem";
import { formatDate } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";
import { getHoldbackStatusBadgeProps } from "../lib/holdbacks";

type Props = {
  trigger: React.ReactNode;
  holdBackId?: string;
  // contractId is required: BE indexes detail GET, /approve, and /approve/status
  // by the parent contract (multi-level escalation lives there).
  contractId?: string;
  // Which surface this sheet is rendered on. Drives the `/contracts` vs
  // `/msa-contracts` segment in every role-prefixed URL.
  contractType?: "Contract" | "MsaContract";
  basePath?: string;
  currency?: string;
  /** BE-computed flag: is the logged-in user the contract's owner/manager.
   *  Gates the manager (CM) accept/reject decision on a holdback-release
   *  application — a manager who doesn't own the contract can view but not
   *  decide. Approver escalation is unaffected. */
  owner?: boolean;
};

export interface HoldbackDetailDTO {
  _id: string;
  contract: string;
  contractRefModel: string;
  company: string;
  amount: number;
  holdBackId: string;
  type: string;
  status: string;
  approvedBy: string;
  description: string;
  releasedDate: Date;
  files: File[];
  __v: number;
  // The CM's accept/reject decision is recorded here. The top-level `status`
  // stays "pending" through the approver escalation, so this sub-status is the
  // signal for whether the CM still has an action.
  manager?: { status?: string; comment?: string };
}

export interface File {
  name: string;
  url: string;
  type: string;
  size: string;
  _id: string;
  uploadedAt: Date;
}

const HoldbackDetailsSheet: React.FC<Props> = ({
  trigger,
  holdBackId,
  contractId,
  contractType = "Contract",
  basePath,
  currency = "USD",
  owner,
}) => {
  const toast = useToastHandler();
  const [open, setOpen] = React.useState(false);
  const { isVendor, isProjectManager, isApprover, isManager } = useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;

  // Path segment that distinguishes Contract from MSA across every role.
  const contractSegment =
    contractType === "MsaContract" ? "msa-contracts" : "contracts";

  // Swagger documents `/contract/{manager,approver,vendor}/{segment}/{contractId}/payment-holdbacks/{id}`
  // for holdback detail. View-only has no documented detail route.
  const rolePrefix = React.useMemo(() => {
    if (basePath) return basePath; // allow parent override
    if (!contractId) return null;
    if (isManager)
      return `/contract/manager/${contractSegment}/${contractId}/payment-holdbacks`;
    if (isApprover)
      return `/contract/approver/${contractSegment}/${contractId}/payment-holdbacks`;
    if (isContractVendorLike)
      return `/contract/vendor/${contractSegment}/${contractId}/payment-holdbacks`;
    return null;
  }, [basePath, contractId, isApprover, isManager, isContractVendorLike, contractSegment]);

  // Approver-only routes: `/contract/approver/{segment}/{contractId}/payment-holdbacks/{id}/approve`
  // and `.../approve/status`. Require contractId because BE indexes the approval
  // workflow by the parent contract (multi-level escalation lives there).
  const approveBaseUrl = React.useMemo(() => {
    if (!isApprover || !contractId || !holdBackId) return null;
    return `/contract/approver/${contractSegment}/${contractId}/payment-holdbacks/${holdBackId}/approve`;
  }, [isApprover, contractId, holdBackId, contractSegment]);

  // #142 — CM accept/reject stage on a vendor-submitted application. Distinct
  // from the approver escalation above: the manager uses PUT `/approve`
  // ("Approve or reject a vendor holdback application"), no `/approve/status`.
  const managerDecideUrl = React.useMemo(() => {
    if (!isManager || !contractId || !holdBackId) return null;
    return `/contract/manager/${contractSegment}/${contractId}/payment-holdbacks/${holdBackId}/approve`;
  }, [isManager, contractId, holdBackId, contractSegment]);

  const queryKey = useUserQueryKey([
    "contract-holdback-detail",
    rolePrefix,
    holdBackId,
  ]);
  const { data: detailRes, isLoading, isError, error } = useQuery<{
    message?: string;
    data?: HoldbackDetailDTO;
  }>({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({
        url: `${rolePrefix}/${holdBackId}`,
      });
      return res.data as any;
    },
    enabled: open && Boolean(holdBackId) && Boolean(rolePrefix),
    staleTime: 60_000,
    retry: false,
  });

  React.useEffect(() => {
    if (!isError) return;
    toast.error(
      "Holdback Details",
      (error as any)?.message || "Failed to fetch details",
    );
  }, [error, isError, toast]);

  const detail = detailRes?.data;
  const statusBadge = React.useMemo(
    () => getHoldbackStatusBadgeProps(detail?.status),
    [detail?.status],
  );
  // The CM accept/reject action shows only until the CM acts. On decision,
  // `detail.manager.status` flips to approved/rejected while the top-level
  // `status` stays "pending" through the approver escalation — so the CM
  // buttons must key off the manager sub-status, not the top status.
  const managerHasDecided = ["approved", "rejected"].includes(
    (detail?.manager?.status ?? "").toLowerCase(),
  );

  const mappedDocs: DocType[] = (detail?.files ?? []).map((f) => {
    const extension = getFileExtension(f.name || "", f.type || "");
    return {
      id: f.name || "-",
      name: f.name || "-",
      type: extension,
      size: typeof f.size === "number" ? `${f.size}B` : f.size || "-",
      url: f.url,
      icon: getFileIcon(extension),
    };
  });

  const handlePreview = (doc: DocType) => {
    if (!doc.url) return;
    window.open(doc.url, "_blank", "noopener,noreferrer");
  };
  const handleDownload = (doc: DocType) => {
    if (!doc.url) return;
    const a = window.document.createElement("a");
    a.href = doc.url;
    a.download = doc.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  const queryClient = useQueryClient();

  // `/approve/status` precheck — BE returns `{status: boolean}` where true means
  // the current approver is at the active level AND has not already acted.
  // We use this to gate button visibility (hide, not disable) since a `false`
  // answer means the user has no recoverable action here.
  const approveStatusQueryKey = useUserQueryKey([
    "contract-holdback-approve-status",
    approveBaseUrl,
  ]);
  const { data: approveStatusRes } = useQuery<{
    message?: string;
    data?: { status?: boolean };
  }>({
    queryKey: approveStatusQueryKey,
    queryFn: async () => {
      const res = await getRequest({ url: `${approveBaseUrl}/status` });
      return res.data as any;
    },
    enabled: open && Boolean(approveBaseUrl),
    staleTime: 30_000,
    retry: false,
  });
  const canAct = approveStatusRes?.data?.status === true;

  // Bare list-query prefix matches both Contract and MSA list keys created by
  // `useUserQueryKey` (which appends userId — prefix matching still hits).
  const listQueryKey = React.useMemo(
    () =>
      contractType === "MsaContract"
        ? ["msa-payment-holdbacks", contractId]
        : ["contract-payment-holdbacks", contractId],
    [contractType, contractId],
  );

  // Single-dialog flip pattern (Pattern B): `pendingAction` drives both
  // dialog visibility and which variant (Approve vs Reject) we render.
  // `commentDraft` resets whenever the dialog closes.
  const [pendingAction, setPendingAction] = React.useState<
    "approved" | "rejected" | null
  >(null);
  const [commentDraft, setCommentDraft] = React.useState("");
  React.useEffect(() => {
    if (pendingAction === null) setCommentDraft("");
  }, [pendingAction]);

  const approveMutation = useMutation({
    mutationKey: ["decideHoldback", approveBaseUrl ?? managerDecideUrl],
    mutationFn: async ({
      action,
      comment,
    }: {
      action: "approved" | "rejected";
      comment: string;
    }) => {
      // Approver escalation → POST; CM accept/reject → PUT. A user has a single
      // active role, so exactly one branch applies.
      if (isApprover && approveBaseUrl) {
        const res = await postRequest({
          url: approveBaseUrl,
          payload: { action, comment },
        });
        return res.data as { message?: string };
      }
      if (isManager && Boolean(owner) && managerDecideUrl) {
        const res = await putRequest({
          url: managerDecideUrl,
          payload: { action, comment },
        });
        return res.data as { message?: string };
      }
      throw new Error("Approve endpoint is not available for this role.");
    },
    onSuccess: (res, vars) => {
      toast.success(
        `Holdback ${vars.action === "approved" ? "approved" : "rejected"}`,
        res?.message ?? "Holdback status updated",
      );
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: listQueryKey });
      queryClient.invalidateQueries({ queryKey: approveStatusQueryKey });
      setPendingAction(null);
    },
    onError: (err: any) => {
      toast.error("Holdback Approval", err);
    },
  });
  const isApproving = approveMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="right-4 top-4 bottom-4 h-[calc(100vh-30px)] sm:max-w-4xl p-0 rounded-2xl border border-[#E5E7EB] dark:border-slate-800 overflow-hidden [&>button]:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-8 pt-7">
            <div className="flex items-center gap-3">
              <SheetClose asChild>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center"
                >
                  <ArrowLeft className="h-5 w-5 text-[#2A4467] dark:text-blue-300" />
                </button>
              </SheetClose>
              <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                Holdback Details
              </div>
            </div>

            <SheetClose asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center"
              >
                <X className="h-5 w-5 text-[#EF4444]" />
              </button>
            </SheetClose>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
            <div className="space-y-6">
              {!holdBackId ? (
                <div className="rounded-xl border border-dashed border-[#E5E7EB] dark:border-slate-700 p-6 text-sm text-[#6B7280] dark:text-slate-400">
                  No holdback selected.
                </div>
              ) : isLoading ? (
                <div className="grid grid-cols-2 gap-x-16 gap-y-7 animate-pulse">
                  <div className="space-y-2">
                    <div className="h-3 w-40 rounded bg-[#F3F4F6]" />
                    <div className="h-4 w-52 rounded bg-[#E5E7EB]" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-40 rounded bg-[#F3F4F6]" />
                    <div className="h-4 w-52 rounded bg-[#E5E7EB]" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-40 rounded bg-[#F3F4F6]" />
                    <div className="h-4 w-52 rounded bg-[#E5E7EB]" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-40 rounded bg-[#F3F4F6]" />
                    <div className="h-4 w-52 rounded bg-[#E5E7EB]" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-16 gap-y-7">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
                      Release Type
                    </div>
                    <div className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">
                      {detail?.type === "full"
                        ? "Full Release"
                        : detail?.type === "partial"
                          ? "Partial Release"
                          : "-"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
                      Release ID
                    </div>
                    <div className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">
                      {detail?.holdBackId || "-"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
                      Released Amount
                    </div>
                    <div className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">
                      {detail?.amount != null ? formatCurrency(detail?.amount, "en-US", currency) : "-"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
                      Released Date
                    </div>
                    <div className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">
                      {detail?.releasedDate ? formatDate(detail?.releasedDate, "dd MMM yyyy") : "-"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
                      Status
                    </div>
                    <Badge
                      className={`w-fit rounded-full px-4 py-1 text-xs font-semibold ${statusBadge.className}`}
                    >
                      {statusBadge.label}
                    </Badge>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
                  Description
                </div>
                <div className="text-sm font-medium leading-6 text-[#374151] dark:text-slate-200">
                  {isLoading ? (
                    <span className="inline-block h-4 w-56 rounded bg-[#E5E7EB]" />
                  ) : (
                    detail?.description || "-"
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-3">
                <div className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">
                  Attached Documents
                </div>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-6">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-16 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#F9FAFB] dark:bg-slate-800 animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {mappedDocs.map((d) => (
                      <DocumentItem
                        key={d.id}
                        d={d}
                        handlePreview={handlePreview}
                        handleDownload={handleDownload}
                      />
                    ))}
                    {mappedDocs.length === 0 && (
                      <div className="text-sm text-[#6B7280] dark:text-slate-400">
                        No documents.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {isApprover && canAct && (
            <div className="flex items-center justify-between gap-6 border-t border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-950 px-8 py-6">
              <button
                type="button"
                className="h-12 flex-1 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 text-sm font-semibold text-[#0F0F0F] dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !holdBackId || isApproving}
                onClick={() => setPendingAction("rejected")}
              >
                Reject
              </button>
              <button
                type="button"
                className="h-12 flex-1 rounded-xl bg-[#2A4467] text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !holdBackId || isApproving}
                onClick={() => setPendingAction("approved")}
              >
                Approve
              </button>
            </div>
          )}

          {/* #142 — CM accept/reject on a vendor-submitted application. Shown
              while the application awaits the CM's decision and hidden once the
              CM has acted (manager.status flips even though the top-level status
              stays "pending" for the approver escalation that follows). */}
          {isManager &&
            Boolean(owner) &&
            (detail?.status ?? "").toLowerCase() === "pending" &&
            !managerHasDecided && (
            <div className="flex items-center justify-between gap-6 border-t border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-950 px-8 py-6">
              <button
                type="button"
                className="h-12 flex-1 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 text-sm font-semibold text-[#0F0F0F] dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !holdBackId || isApproving}
                onClick={() => setPendingAction("rejected")}
              >
                Reject
              </button>
              <button
                type="button"
                className="h-12 flex-1 rounded-xl bg-[#2A4467] text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !holdBackId || isApproving}
                onClick={() => setPendingAction("approved")}
              >
                Approve
              </button>
            </div>
          )}

          <Dialog
            open={pendingAction !== null}
            onOpenChange={(next) => {
              if (!next && !isApproving) setPendingAction(null);
            }}
          >
            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                  {pendingAction === "approved"
                    ? "Approve Holdback"
                    : "Reject Holdback"}
                </DialogTitle>
              </DialogHeader>
              <div className="px-6 pb-6 space-y-4">
                <p className="text-sm text-[#6B7280] dark:text-slate-400">
                  {pendingAction === "approved"
                    ? "Add an optional comment before approving this holdback release."
                    : "Let the team know why this holdback release is being rejected (optional)."}
                </p>
                <textarea
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Enter your comment"
                  rows={5}
                  className="w-full resize-none rounded-lg border border-[#E5E7EB] bg-white p-3 text-sm text-[#0F0F0F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2A4467] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  autoFocus
                />
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827] dark:text-slate-100 dark:border-slate-700 dark:bg-slate-800"
                    disabled={isApproving}
                    onClick={() => setPendingAction(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className={cn(
                      "h-11 flex-1 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed",
                      pendingAction === "approved"
                        ? "bg-[#16A34A] hover:bg-[#15803D]"
                        : "bg-[#E53935] hover:bg-[#C62828]",
                    )}
                    disabled={isApproving}
                    aria-busy={isApproving}
                    onClick={() => {
                      if (pendingAction === null) return;
                      approveMutation.mutate({
                        action: pendingAction,
                        comment: commentDraft.trim(),
                      });
                    }}
                  >
                    {isApproving
                      ? pendingAction === "approved"
                        ? "Approving..."
                        : "Rejecting..."
                      : pendingAction === "approved"
                        ? "Approve"
                        : "Reject"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HoldbackDetailsSheet;
