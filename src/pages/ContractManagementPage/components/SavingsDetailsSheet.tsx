import React from "react";
import { ArrowLeft, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUserRole } from "@/hooks/useUserRole";
import { useToastHandler } from "@/hooks/useToaster";
import { getRequest } from "@/lib/axiosInstance";
import { DocumentItem, type DocType } from "./DocumentItem";
import { getFileExtension, getFileIcon } from "@/lib/fileUtils";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

type Props = {
  trigger: React.ReactNode;
  savingId?: string;
  basePath?: string;
  currency?: string;
};

type SavingsDetailDTO = {
  title?: string;
  category?: string;
  amount?: number;
  submittedDate?: string | Date;
  description?: string;
  files?: Array<{
    name?: string;
    url?: string;
    type?: string;
    size?: number | string;
  }>;
};

const SavingsDetailsSheet: React.FC<Props> = ({ trigger, savingId, basePath, currency = "USD" }) => {
  const [open, setOpen] = React.useState(false);
  const { isApprover, isManager } = useUserRole();
  const toast = useToastHandler();

  // Phase 2 markdown docs only expose savings detail for manager + approver.
  // Vendor/PM/view-only have no documented savings route — match the list
  // gating in `PaymentSummaryTabContent` so the URL maps stay consistent.
  const rolePrefix = React.useMemo(() => {
    if (basePath) return basePath;
    if (isManager) return `/contract/manager/contracts/payment-savings`;
    if (isApprover) return `/contract/approver/contracts/payment-savings`;
    return null;
  }, [basePath, isApprover, isManager]);

  const { data: detailRes, isLoading, isError, error } = useQuery<{
    message?: string;
    data?: SavingsDetailDTO;
  }>({
    queryKey: ["contract-savings-detail", rolePrefix, savingId],
    queryFn: async () => {
      const res = await getRequest({ url: `${rolePrefix}/${savingId}` });
      return res.data as any;
    },
    enabled: open && Boolean(savingId) && Boolean(rolePrefix),
    staleTime: 60_000,
    retry: false,
  });

  React.useEffect(() => {
    if (!isError) return;
    toast.error("Savings Details", (error as any)?.message || "Failed to fetch savings detail");
  }, [error, isError, toast]);

  const detail = detailRes?.data;
  const docs: DocType[] = (detail?.files ?? []).map((f, idx) => {
    const extension = getFileExtension(f.name || "", f.type || "");
    return {
      id: `${f.name || "file"}-${idx}`,
      name: f.name || "Document",
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

  const formatDate = (value?: string | Date) => {
    if (!value) return "-";
    try {
      return format(new Date(value), "dd MMM yyyy");
    } catch {
      return "-";
    }
  };

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
                <button type="button" className="inline-flex h-9 w-9 items-center justify-center">
                  <ArrowLeft className="h-5 w-5 text-[#2A4467] dark:text-blue-300" />
                </button>
              </SheetClose>
              <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">Savings Details</div>
            </div>

            <SheetClose asChild>
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center">
                <X className="h-5 w-5 text-[#EF4444]" />
              </button>
            </SheetClose>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="text-lg font-semibold text-[#0F0F0F] dark:text-slate-100">
                {isLoading ? (
                  <span className="inline-block h-4 w-56 rounded bg-[#E5E7EB]" />
                ) : (
                  detail?.title || "—"
                )}
              </div>
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

            <div className="mt-6 space-y-6">
              {!savingId ? (
                <div className="rounded-xl border border-dashed border-[#E5E7EB] dark:border-slate-700 p-6 text-sm text-[#6B7280] dark:text-slate-400">
                  No savings selected.
                </div>
              ) : isLoading ? (
                <div className="grid grid-cols-2 gap-x-16 gap-y-7 animate-pulse">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="h-3 w-40 rounded bg-[#F3F4F6]" />
                      <div className="h-4 w-52 rounded bg-[#E5E7EB]" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-16 gap-y-7">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">Savings Title</div>
                    <div className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">{detail?.title || "—"}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">Category</div>
                    <div className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">
                      {detail?.category || "—"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">Amount</div>
                    <div className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">
                      {detail?.amount != null ? formatCurrency(detail?.amount, "en-US", currency) : "—"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">Submission Date</div>
                    <div className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">
                      {formatDate(detail?.submittedDate)}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">Description</div>
                <div className="text-sm font-medium leading-6 text-[#374151] dark:text-slate-200">
                  {isLoading ? (
                    <span className="inline-block h-4 w-56 rounded bg-[#E5E7EB]" />
                  ) : (
                    detail?.description || "—"
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">Attached Documents</div>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-6">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="h-16 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#F9FAFB] dark:bg-slate-800 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {docs.map((d) => (
                      <DocumentItem
                        key={d.id}
                        d={d}
                        handlePreview={handlePreview}
                        handleDownload={handleDownload}
                      />
                    ))}
                    {docs.length === 0 && (
                      <div className="text-sm text-[#6B7280] dark:text-slate-400">No documents.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SavingsDetailsSheet;
