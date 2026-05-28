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
}) => {
  const { isVendor, isProjectManager, isApprover, isManager, isAdmin, isViewOnly } = useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  const toastHandler = useToastHandler();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [selectedDoc, setSelectedDoc] = React.useState<DocType | null>(null);

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

  const canManagerAct = isManager && isPendingApproval;


  const approveInvoiceMutation = useMutation<
    void,
    ApiResponseError,
    "approved" | "rejected"
  >({
    mutationKey: ["approveInvoice", contractId, invoiceId],
    mutationFn: async (action) => {
      const comment = action === "approved"
        ? "Invoice approved via bulk action"
        : "Invoice rejected via bulk action";
      if (isManager) {
        await contractManagerApi.approveInvoice(contractId, invoiceId, { action, comment });
        return;
      }
      await approverApi.approveInvoice(contractId, invoiceId, { action, comment });
    },
    onSuccess: async (_, action) => {
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
    onError: (err, action) => {
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
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] dark:border-slate-700 text-[#111827] dark:text-slate-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
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
                        currency: "USD",
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

          {canManagerAct ? (
            <div className="flex gap-3 pt-6">
              <Button
                variant="outline"
                className="h-11 flex-1 rounded-xl border-[#E5E7EB] dark:border-slate-700 text-sm font-semibold text-[#111827] dark:text-slate-100"
                disabled={approveInvoiceMutation.isPending}
                onClick={() => approveInvoiceMutation.mutate("rejected")}
              >
                {approveInvoiceMutation.isPending ? "Processing..." : "Reject"}
              </Button>
              <Button
                className="h-11 flex-1 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white"
                disabled={approveInvoiceMutation.isPending}
                onClick={() => approveInvoiceMutation.mutate("approved")}
              >
                {approveInvoiceMutation.isPending ? "Processing..." : "Approve"}
              </Button>
            </div>
          ) : null}

          {isApprover && canApprove && !isApproveStatusLoading ? (
            <div className="flex gap-3 pt-6">
              <Button
                variant="outline"
                className="h-11 flex-1 rounded-xl border-[#E5E7EB] dark:border-slate-700 text-sm font-semibold text-[#111827] dark:text-slate-100"
                disabled={approveInvoiceMutation.isPending}
                onClick={() => approveInvoiceMutation.mutate("rejected")}
              >
                {approveInvoiceMutation.isPending ? "Processing..." : "Reject"}
              </Button>
              <Button
                className="h-11 flex-1 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white"
                disabled={approveInvoiceMutation.isPending}
                onClick={() => approveInvoiceMutation.mutate("approved")}
              >
                {approveInvoiceMutation.isPending ? "Processing..." : "Approve"}
              </Button>
            </div>
          ) : null}
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
}) => {
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
  }, [contractId, actionsDisabled]);

  const invoiceRows: InvoiceRow[] = React.useMemo(() => {
    const currencyFormatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    });

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

      return {
        id,
        type,
        billed,
        remaining: "-",
        status,
      };
    });
  }, [rows]);


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
