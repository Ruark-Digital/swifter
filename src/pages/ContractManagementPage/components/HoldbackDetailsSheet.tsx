import React from "react";
import { ArrowLeft, X } from "lucide-react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import { getFileExtension, getFileIcon } from "@/lib/fileUtils";
import { DocumentItem, type DocType } from "./DocumentItem";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import { formatDate } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { getHoldbackStatusBadgeProps } from "../lib/holdbacks";

type Props = {
  trigger: React.ReactNode;
  holdBackId?: string;
  basePath?: string;
  currency?: string;
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
  basePath,
  currency = "USD",
}) => {
  const toast = useToastHandler();
  const [open, setOpen] = React.useState(false);
  const { isVendor, isProjectManager, isApprover, isManager } = useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;

  // Phase 2 documents `/contract/{manager,approver,vendor}/contracts/payment-holdbacks/{id}`
  // for holdback detail. View-only has no documented detail route.
  const rolePrefix = React.useMemo(() => {
    if (basePath) return basePath; // allow parent override
    if (isManager) return `/contract/manager/contracts/payment-holdbacks`;
    if (isApprover) return `/contract/approver/contracts/payment-holdbacks`;
    if (isContractVendorLike) return `/contract/vendor/contracts/payment-holdbacks`;
    return null;
  }, [basePath, isApprover, isManager, isContractVendorLike]);

  const queryKey = ["contract-holdback-detail", rolePrefix, holdBackId];
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
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<"approved" | "rejected" | null>(null);
  const approveMutation = useMutation({
    mutationFn: async (action: "approved" | "rejected") => {
      void action;
      throw new Error("Holdback approval endpoint not available");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setConfirmOpen(false);
    },
    onError: (err: any) => {
      toast.error("Holdback Approval", err?.message || "Operation not supported");
      setConfirmOpen(false);
    },
  });

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
            <div className="flex justify-end pb-6">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-[#0F0F0F] dark:text-slate-100"
              >
                <img
                  src="/assets/contract-management/payment-summary/share.svg"
                  className="h-4 w-4"
                />
                Export
              </button>
            </div>

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

          {isApprover && (
            <div className="flex items-center justify-between gap-6 border-t border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-950 px-8 py-6">
              <button
                type="button"
                className="h-12 flex-1 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 text-sm font-semibold text-[#0F0F0F] dark:text-slate-100"
                disabled={isLoading || !holdBackId || approveMutation.isPending}
                onClick={() => {
                  setConfirmAction("rejected");
                  setConfirmOpen(true);
                }}
              >
                Reject
              </button>
              <button
                type="button"
                className="h-12 flex-1 rounded-xl bg-[#2A4467] text-sm font-semibold text-white"
                disabled={isLoading || !holdBackId || approveMutation.isPending}
                onClick={() => {
                  setConfirmAction("approved");
                  setConfirmOpen(true);
                }}
              >
                Approve
              </button>
            </div>
          )}

          <ConfirmAlert
            open={confirmOpen}
            onClose={(v) => setConfirmOpen(v)}
            title={confirmAction === "approved" ? "Approve Holdback" : "Reject Holdback"}
            text={
              confirmAction === "approved"
                ? "Are you sure you want to approve this holdback?"
                : "Are you sure you want to reject this holdback?"
            }
            onPrimaryAction={() => {
              if (!confirmAction) return;
              approveMutation.mutate(confirmAction);
            }}
            primaryButtonText={confirmAction === "approved" ? "Approve" : "Reject"}
            secondaryButtonText="Cancel"
            type={confirmAction === "approved" ? "success" : "delete"}
            isLoading={approveMutation.isPending}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HoldbackDetailsSheet;
