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
import { ArrowLeft, Search, Share2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  status: "Approved" | "Pending" | "Rejected" | "Draft";
};

type InvoiceDetailsSheetProps = {
  trigger: React.ReactNode;
  contractId: string;
  invoiceId: string;
};

const LabelRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="text-xs font-medium text-[#9CA3AF]">{label}</div>
    <div className="text-sm font-medium text-[#111827]">{value}</div>
  </div>
);


const InvoiceDetailsSheet: React.FC<InvoiceDetailsSheetProps> = ({
  trigger,
  contractId,
  invoiceId,
}) => {
  const { isVendor, isApprover, isManager, isAdmin, isViewOnly } = useUserRole();
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
    queryKey: ["contractInvoiceDetail", contractId, invoiceId],
    queryFn: async () => {
      if (isApprover) {
        return await approverApi.getInvoiceDetail(contractId, invoiceId);
      }
      if (isVendor) {
        const res = await vendorApi.getInvoiceDetail(contractId, invoiceId);
        return { message: res.data.message, data: res.data.data };
      }
      if (isManager || isAdmin) {
        return await contractManagerApi.getInvoiceDetail(invoiceId);
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

  const pendingSignal = (invoice?.approverStatus || invoice?.status || "")
    .toLowerCase()
    .trim();

  const canApprove = pendingSignal === "pending";

  const canManagerAct = isManager && pendingSignal === "pending";


  const approveInvoiceMutation = useMutation<
    void,
    ApiResponseError,
    "approved" | "rejected"
  >({
    mutationKey: ["approveInvoice", contractId, invoiceId],
    mutationFn: async (action) => {
      if (isManager) {
        await contractManagerApi.approveInvoice(contractId, invoiceId, { action });
        return;
      }
      await approverApi.approveInvoice(contractId, invoiceId, { action });
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
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <SheetTitle className="text-base font-semibold text-[#0F0F0F]">
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
                <div className="text-xs font-medium text-[#9CA3AF]">
                  Invoice Details
                </div>
                <div className="text-base font-semibold text-[#0F0F0F]">
                  {invoice?.title ?? "-"}
                </div>
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
              >
                <Share2 className="mr-2 h-4 w-4" /> Export
              </Button>
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
              <div className="text-xs font-medium text-[#9CA3AF]">
                Description/Note
              </div>
              <div className="text-sm text-[#374151]">
                {isLoading
                  ? "Loading..."
                  : invoice?.description || "No description provided."}
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-3">
                <div className="text-base font-semibold text-[#0F0F0F]">
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
                className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827]"
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

          {(isApprover && canApprove) ? (
            <div className="flex gap-3 pt-6">
              <Button
                variant="outline"
                className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827]"
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
};

const InvoiceTable: React.FC<InvoiceTableProps> = ({
  rows = [],
  isLoading,
  totalCount,
  pagination,
  setPagination,
  contractId,
}) => {
  const [search, setSearch] = React.useState("");

  const columns = React.useMemo<ColumnDef<InvoiceRow>[]>(() => {
    return [
      { accessorKey: "id", header: "Invoice ID" },
      { accessorKey: "type", header: "Type" },
      {
        id: "amountBilled",
        header: "Amount/Billed",
        cell: ({ row }) => (
          <div className="text-xs text-slate-600">
            <p>
              <span className="text-slate-500">Billed:&nbsp;</span>
              <span className="text-slate-900 font-medium">
                {row.original.billed}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Remaining:&nbsp;</span>
              <span className="text-slate-900 font-medium">
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
  }, [contractId]);

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

  const filteredRows = React.useMemo(() => {
    if (!search) return invoiceRows;
    const query = search.toLowerCase();
    return invoiceRows.filter((row) =>
      [row.id, row.type].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [invoiceRows, search]);


  return (
    <div className="space-y-4" data-testid="invoice-table">
      <DataTable<InvoiceRow>
        data={filteredRows}
        columns={columns}
        header={() => (
          <div className="flex items-center gap-3 w-full border-b border-[#E5E7EB] px-5 py-4">
            <span className="text-sm font-medium text-slate-900">
              Invoices
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search changes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-[260px] pl-9"
              />
            </div>
          </div>
        )}
        options={{
          disableSelection: true,
          isLoading,
          manualPagination: true,
          totalCounts: totalCount ?? filteredRows.length,
          setPagination,
          pagination,
        }}
        classNames={{
          container: "border border-[#E5E7EB] rounded-xl bg-white",
          tHeader: "bg-[#F9FAFB]",
          tHeadRow: "border-b border-[#E5E7EB]",
          tBody: "bg-white",
          tRow: "border-b border-[#E5E7EB]",
          tHead: "px-6 py-3 text-xs font-semibold text-slate-500",
          tCell: "px-6 py-4 text-sm text-slate-700",
        }}
      />
    </div>
  );
};

export default InvoiceTable;
