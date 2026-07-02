import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ArrowLeft, Edit2, Search, X } from "lucide-react";
import CreateInvoiceDialog from "./CreateInvoiceDialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import type { ContractInvoiceDTO } from "../api/contractManagerApi";
import { contractManagerApi } from "../api/contractManagerApi";
import { approverApi } from "../api/approverApi";
import { vendorApi } from "../api/vendorApi";
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import { useToastHandler } from "@/hooks/useToaster";
import { getFileExtension, getFileIcon } from "@/lib/fileUtils";
import { DocumentItem, type DocType } from "./DocumentItem";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import type { ApiResponseError } from "@/types";

export type InvoiceRow = {
  id: string;
  type: string;
  billed: string;
  remaining: string;
  status: "Approved" | "Pending" | "Rejected" | "Draft" | "Active";
};

type InvoiceDetailsSheetProps = {
  trigger: React.ReactNode;
  contractId: string;
  invoiceId: string;
  actionsDisabled?: boolean;
  /** Only the contract owner/manager may approve/reject an invoice (QA #164). */
  owner?: boolean;
  /** Contract-level currency; falls back to USD when the API omits it. */
  currency?: string;
};

const LabelRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">{label}</div>
    <div className="text-sm font-medium text-[#111827] dark:text-slate-100">{value}</div>
  </div>
);


const InvoiceDetailsSheet: React.FC<InvoiceDetailsSheetProps> = ({
  trigger,
  contractId,
  invoiceId,
  actionsDisabled,
  owner,
  currency,
}) => {
  const currencyCode = currency || "USD";
  const { isVendor, isProjectManager, isApprover, isManager, isAdmin, isViewOnly } = useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  const toastHandler = useToastHandler();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [selectedDoc, setSelectedDoc] = React.useState<DocType | null>(null);

  // Approve / reject opens a comment dialog first. `pendingAction` drives the
  // dialog's title/CTA/color; `commentDraft` resets whenever the dialog closes.
  const [pendingAction, setPendingAction] = React.useState<
    "approved" | "rejected" | null
  >(null);
  const [commentDraft, setCommentDraft] = React.useState("");

  React.useEffect(() => {
    if (pendingAction === null) setCommentDraft("");
  }, [pendingAction]);

  const {
    data,
    isLoading,
    error,
  } = useQuery<{
    message?: string;
    data?: ContractInvoiceDTO;
  }>({
    queryKey: useUserQueryKey(["contractInvoiceDetail", contractId, invoiceId]),
    queryFn: async () => {
      if (isApprover) {
        return await approverApi.getInvoiceDetail(contractId, invoiceId);
      }
      if (isContractVendorLike) {
        const res = await vendorApi.getInvoiceDetail(contractId, invoiceId);
        return { message: res.data.message, data: res.data.data };
      }
      if (isManager || isAdmin) {
        return await contractManagerApi.getInvoiceDetail(contractId, invoiceId);
      }
      if (isViewOnly) {
        const res = await getRequest({
          url: `/contract/user/contracts/${contractId}/invoice/${invoiceId}`,
        });
        return res.data as { message?: string; data?: ContractInvoiceDTO };
      }
      return { data: undefined, message: undefined };
    },
    enabled: open && Boolean(contractId) && Boolean(invoiceId),
    staleTime: 30000,
  });

  const invoice = data?.data;

  const isPendingApproval = invoice?.approverStatus === "pending";

  const { data: approveStatusData, isLoading: isApproveStatusLoading } = useQuery<
    { message?: string; data?: { status?: boolean } },
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["invoiceApproveStatus", contractId, invoiceId]),
    queryFn: async () => {
      return await approverApi.getInvoiceApproveStatus(contractId, invoiceId);
    },
    enabled: open && Boolean(contractId) && Boolean(invoiceId) && isApprover,
    staleTime: 30000,
  });

  const canApprove =
    isPendingApproval && approveStatusData?.data?.status === true;

  const canManagerAct = isManager && isPendingApproval && !!owner;


  const approveInvoiceMutation = useMutation<
    void,
    ApiResponseError,
    { action: "approved" | "rejected"; comment: string }
  >({
    mutationKey: ["approveInvoice", contractId, invoiceId],
    mutationFn: async ({ action, comment }) => {
      if (isManager) {
        await contractManagerApi.approveInvoice(contractId, invoiceId, { action, comment });
        return;
      }
      await approverApi.approveInvoice(contractId, invoiceId, { action, comment });
    },
    onSuccess: async (_, { action }) => {
      setPendingAction(null);
      toastHandler.success(
        "Invoice updated",
        action === "approved"
          ? "Invoice approved successfully"
          : "Invoice rejected successfully",
      );
      await queryClient.invalidateQueries({ queryKey: ["contractInvoiceDetail"] });
      await queryClient.invalidateQueries({ queryKey: ["contractInvoices"] });
      await queryClient.invalidateQueries({
        queryKey: ["invoiceApproveStatus", contractId, invoiceId],
      });
    },
    onError: (err, { action }) => {
      toastHandler.error(
        action === "approved"
          ? "Failed to approve invoice"
          : "Failed to reject invoice",
        err?.response?.data?.message || "Unable to update invoice status",
      );
    },
  });

  const handlePreview = React.useCallback((d: DocType) => {
    setSelectedDoc(d);
    setViewerOpen(true);
  }, []);

  const handleDownload = React.useCallback((d: DocType) => {
    if (!d.url) return;
    window.open(d.url, "_blank", "noopener,noreferrer");
  }, []);

  const files: DocType[] =
    invoice?.files?.map((file, index) => {
      const ext = getFileExtension(file?.name || "", file?.type || "");
      return {
        id: `${file?.name || "attachment"}-${index}`,
        name: file?.name || "Attachment",
        type: ext,
        size: file?.size || "—",
        url: file?.url,
        icon: getFileIcon(ext),
      };
    }) ?? [];

  const statusLabel =
    invoice?.status === "approved"
      ? "Approved"
      : invoice?.status === "rejected"
        ? "Rejected"
        : invoice?.status === "draft"
          ? "Draft"
          : invoice?.status === "pending"
            ? "Pending"
            : invoice?.status ?? "-";

  const statusTone =
    invoice?.status === "approved"
      ? "bg-green-100 text-green-700"
      : invoice?.status === "rejected"
        ? "bg-red-100 text-red-700"
        : invoice?.status === "draft"
          ? "bg-slate-100 text-slate-700"
          : "bg-yellow-100 text-yellow-700";

  const invoiceIdLabel = invoice?.invoiceId ?? invoice?._id ?? invoiceId;
  const typeLabel =
    typeof invoice?.type === "string"
      ? invoice.type
          .split(" ")
          .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
          .join(" ")
      : "-";

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setViewerOpen(false);
          setSelectedDoc(null);
        }
      }}
    >
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[560px] rounded-2xl overflow-y-auto [&>button]:hidden"
      >
        <div className="space-y-6" data-testid="invoice-details-sheet">
          <SheetHeader className="space-y-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SheetClose asChild>
                  <button
                    type="button"
                    aria-label="Close invoice details"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] dark:border-slate-700 text-[#111827] dark:text-slate-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </SheetClose>
                <SheetTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                  Invoice
                </SheetTitle>
              </div>
              <SheetClose asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FCA5A5] text-[#EF4444]"
                >
                  <X className="h-4 w-4" />
                </button>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
                  Invoice Details
                </div>
                <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                  {invoice?.title ?? "-"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isContractVendorLike &&
                  !actionsDisabled &&
                  invoice?.status === "rejected" && (
                    <CreateInvoiceDialog
                      contractId={contractId}
                      mode="edit"
                      invoiceId={invoiceId}
                      initialInvoice={invoice as any}
                      trigger={
                        <Button
                          variant="outline"
                          data-testid="edit-invoice-trigger"
                          className="h-9 rounded-lg border-[#E5E7EB] dark:border-slate-700 px-3 text-xs font-semibold text-[#2A4467] dark:text-slate-200"
                        >
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </Button>
                      }
                    />
                  )}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <LabelRow label="Invoice ID" value={invoiceIdLabel} />
              <LabelRow label="Invoice Category" value={typeLabel || "-"} />
              <LabelRow
                label="Amount"
                value={
                  typeof invoice?.amount === "number"
                    ? new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: currencyCode,
                      }).format(invoice.amount)
                    : "-"
                }
              />
              <LabelRow
                label="Tax Code"
                value={invoice?.taxCode ?? "-"}
              />
              <LabelRow
                label="Status"
                value={
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}
                  >
                    {statusLabel}
                  </span>
                }
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
                Description/Note
              </div>
              <div className="text-sm text-[#374151] dark:text-slate-300">
                {isLoading
                  ? "Loading..."
                  : invoice?.description || "No description provided."}
              </div>
            </div>

            {!isLoading && (
              <div className="space-y-3">
                <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                  Breakdown
                </div>
                {!Array.isArray(invoice?.items) || invoice.items.length === 0 ? (
                  <div className="rounded-lg border border-[#E5E7EB] dark:border-slate-700 p-4 text-sm text-[#6B7280] dark:text-slate-400">
                    No itemized breakdown was submitted for this invoice — see
                    the attached document below.
                  </div>
                ) : (
                <div className="overflow-x-auto rounded-lg border border-[#E5E7EB] dark:border-slate-700">
                  {/* min-w + table-layout:fixed keep Component/Description readable
                      instead of the browser auto-shrinking them to fit the 560px
                      sheet — the table scrolls horizontally on narrow viewports
                      rather than wrapping every word onto its own line. */}
                  <table className="w-full min-w-[640px] text-sm [table-layout:fixed]">
                    <thead className="bg-[#F9FAFB] dark:bg-slate-800 text-left text-xs font-medium text-[#6B7280] dark:text-slate-400">
                      <tr>
                        <th className="w-[18%] px-3 py-2">Component</th>
                        <th className="w-[30%] px-3 py-2">Description</th>
                        <th className="w-[10%] px-3 py-2 text-right">Qty</th>
                        <th className="w-[12%] px-3 py-2">Unit</th>
                        <th className="w-[15%] px-3 py-2 text-right">
                          Unit Price
                        </th>
                        <th className="w-[15%] px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-700 text-[#111827] dark:text-slate-200">
                      {invoice.items.map((it, idx) => {
                        const qty =
                          typeof it.quantity === "number" ? it.quantity : 0;
                        const unitPrice =
                          typeof it.unitPrice === "number" ? it.unitPrice : 0;
                        const total = qty * unitPrice;
                        return (
                          <tr key={idx}>
                            <td className="px-3 py-2 align-top font-medium break-words">
                              {it.component || "-"}
                            </td>
                            <td className="px-3 py-2 align-top text-[#374151] dark:text-slate-300 break-words">
                              {it.description || "-"}
                            </td>
                            <td className="px-3 py-2 align-top text-right">
                              {qty || "-"}
                            </td>
                            <td className="px-3 py-2 align-top break-words">
                              {it.unitOfmeasurement || "-"}
                            </td>
                            <td className="px-3 py-2 align-top text-right whitespace-nowrap">
                              {unitPrice
                                ? new Intl.NumberFormat(undefined, {
                                    style: "currency",
                                    currency: currencyCode,
                                  }).format(unitPrice)
                                : "-"}
                            </td>
                            <td className="px-3 py-2 align-top text-right font-medium whitespace-nowrap">
                              {total
                                ? new Intl.NumberFormat(undefined, {
                                    style: "currency",
                                    currency: currencyCode,
                                  }).format(total)
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            )}

            {files.length > 0 && (
              <div className="space-y-3">
                <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                  Attachments
                </div>
                <div className="space-y-2">
                  {files.map((d) => (
                    <DocumentItem
                      key={d.id}
                      d={d}
                      handlePreview={handlePreview}
                      handleDownload={handleDownload}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && !invoice && (
              <div className="text-xs text-red-600">
                Failed to load invoice details.
              </div>
            )}
          </div>

          {canManagerAct || (isApprover && canApprove && !isApproveStatusLoading) ? (
            <div className="flex gap-3 pt-6">
              <Button
                variant="outline"
                className="h-11 flex-1 rounded-xl border-[#E5E7EB] dark:border-slate-700 text-sm font-semibold text-[#111827] dark:text-slate-100"
                onClick={() => setPendingAction("rejected")}
              >
                Reject
              </Button>
              <Button
                className="h-11 flex-1 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white"
                onClick={() => setPendingAction("approved")}
              >
                Approve
              </Button>
            </div>
          ) : null}

          <Dialog
            open={pendingAction !== null}
            onOpenChange={(next) => {
              if (!next && !approveInvoiceMutation.isPending) {
                setPendingAction(null);
              }
            }}
          >
            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                  {pendingAction === "approved"
                    ? "Approve Invoice"
                    : "Reject Invoice"}
                </DialogTitle>
              </DialogHeader>
              <div className="px-6 pb-6 space-y-4">
                <p className="text-sm text-[#6B7280] dark:text-slate-400">
                  {pendingAction === "approved"
                    ? "Add an optional comment before approving this invoice."
                    : "Let the vendor know why this invoice is being rejected."}
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
                    className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827] dark:text-slate-100"
                    disabled={approveInvoiceMutation.isPending}
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
                    disabled={approveInvoiceMutation.isPending}
                    aria-busy={approveInvoiceMutation.isPending}
                    onClick={() => {
                      if (pendingAction === null) return;
                      approveInvoiceMutation.mutate({
                        action: pendingAction,
                        comment: commentDraft.trim(),
                      });
                    }}
                  >
                    {approveInvoiceMutation.isPending
                      ? pendingAction === "approved"
                        ? "Approving..."
                        : "Rejecting..."
                      : pendingAction === "approved"
                        ? "Approve"
                        : "Confirm Reject"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {selectedDoc && (
          <DocumentViewer
            isOpen={viewerOpen}
            onClose={() => {
              setViewerOpen(false);
              setSelectedDoc(null);
            }}
            fileUrl={selectedDoc.url as string}
            fileName={selectedDoc.name}
            fileType={getFileExtension(selectedDoc.name, selectedDoc.type)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

type InvoiceTableProps = {
  rows?: ContractInvoiceDTO[];
  isLoading?: boolean;
  totalCount?: number;
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  contractId: string;
  invoiceIdSearch: string;
  setInvoiceIdSearch: (next: string) => void;
  actionsDisabled?: boolean;
  owner?: boolean;
  /** Contract-level currency; falls back to USD when the API omits it. */
  currency?: string;
  /** Contract-level `remaining` from FinancialStatement (outstanding balance
   *  after all billed invoices). API has no per-invoice remaining — this is
   *  the only real "remaining" value in the spec. */
  contractRemaining?: number;
};

const InvoiceTable: React.FC<InvoiceTableProps> = ({
  rows = [],
  isLoading,
  totalCount,
  pagination,
  setPagination,
  contractId,
  invoiceIdSearch,
  setInvoiceIdSearch,
  actionsDisabled,
  owner,
  currency,
  contractRemaining,
}) => {
  const currencyCode = currency || "USD";
  const columns = React.useMemo<ColumnDef<InvoiceRow>[]>(() => {
    return [
      { accessorKey: "id", header: "Invoice ID" },
      { accessorKey: "type", header: "Type" },
      {
        id: "amountBilled",
        header: "Amount/Billed",
        cell: ({ row }) => (
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <p>
              <span className="text-slate-500 dark:text-slate-400">Billed:&nbsp;</span>
              <span className="text-slate-900 dark:text-slate-100 font-medium">
                {row.original.billed}
              </span>
            </p>
            <p>
              <span className="text-slate-500 dark:text-slate-400">Remaining:&nbsp;</span>
              <span className="text-slate-900 dark:text-slate-100 font-medium">
                {row.original.remaining}
              </span>
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const s = getValue<InvoiceRow["status"]>();
          const tone =
            s === "Approved"
              ? "bg-green-100 text-green-700"
              : s === "Active"
                ? "bg-blue-100 text-blue-700"
              : s === "Pending"
                ? "bg-yellow-100 text-yellow-700"
                : s === "Draft"
                  ? "bg-slate-100 text-slate-700"
                  : "bg-red-100 text-red-700";
          return (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${tone}`}
            >
              {s}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <InvoiceDetailsSheet
              contractId={contractId}
              invoiceId={row.original.id}
              actionsDisabled={actionsDisabled}
              owner={owner}
              currency={currencyCode}
              trigger={
                <button
                  type="button"
                  data-testid="view-invoice-detail"
                  className="text-sm font-medium text-green-700 hover:underline"
                >
                  View
                </button>
              }
            />
          </div>
        ),
      },
    ];
  }, [contractId, actionsDisabled, owner, currencyCode]);

  const invoiceRows: InvoiceRow[] = React.useMemo(() => {
    const currencyFormatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
    });
    const remainingLabel =
      typeof contractRemaining === "number"
        ? currencyFormatter.format(contractRemaining)
        : "-";

    return rows.map((inv) => {
      const id = inv.invoiceId ?? inv._id ?? "-";
      const type = (inv.type ?? "-")
        .split(" ")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ");
      const billed =
        typeof inv.amount === "number" ? currencyFormatter.format(inv.amount) : "-";

      const status: InvoiceRow["status"] =
        inv.status === "approved"
          ? "Approved"
          : inv.status === "active"
            ? "Active"
          : inv.status === "rejected"
            ? "Rejected"
            : inv.status === "draft"
              ? "Draft"
              : "Pending";

      // "Remaining" is contract-level (FinancialStatement.remaining) — the
      // API has no per-invoice remaining. Only surface it for invoices that
      // have actually reduced the outstanding balance (Approved); the rest
      // haven't affected `remaining` yet, so a dash is honest there.
      return {
        id,
        type,
        billed,
        remaining: status === "Approved" ? remainingLabel : "-",
        status,
      };
    });
  }, [rows, contractRemaining, currencyCode]);


  return (
    <div className="space-y-4" data-testid="invoice-table">
      <DataTable<InvoiceRow>
        data={invoiceRows}
        columns={columns}
        header={() => (
          <div className="flex items-center gap-3 w-full border-b border-[#E5E7EB] dark:border-slate-800 px-5 py-4">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Invoices</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search invoices"
                value={invoiceIdSearch}
                onChange={(e) => setInvoiceIdSearch(e.target.value)}
                className="h-10 w-[260px] pl-9"
              />
            </div>
          </div>
        )}
        options={{
          disableSelection: true,
          isLoading,
          manualPagination: true,
          totalCounts: totalCount ?? invoiceRows.length,
          setPagination,
          pagination,
        }}
        classNames={{
          container: "border border-[#E5E7EB] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900",
          tHeader: "bg-[#F9FAFB] dark:bg-slate-800",
          tHeadRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tBody: "bg-white dark:bg-slate-900",
          tRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tHead: "px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400",
          tCell: "px-6 py-4 text-sm text-slate-700 dark:text-slate-200",
        }}
      />
    </div>
  );

};

export default InvoiceTable;
