import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/layouts/DataTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ArrowLeft, Search, X } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useToastHandler } from "@/hooks/useToaster";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";
import { getFileExtension, getFileIcon } from "@/lib/fileUtils";
import type { ApiResponseError } from "@/types";
import type {
  ApprovalActionDTO,
  ContractInvoiceDTO,
  ContractInvoiceStatsDTO,
} from "@/pages/ContractManagementPage/api/contractManagerApi";
import { DocumentItem, type DocType } from "@/pages/ContractManagementPage/components/DocumentItem";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import InvoiceStatsCards from "@/pages/ContractManagementPage/components/InvoiceStatsCards";
import CreateInvoiceDialog from "@/pages/ContractManagementPage/components/CreateInvoiceDialog";

type Props = {
  contractId: string;
  isActive?: boolean;
  actionsDisabled?: boolean;
};

type InvoiceRow = {
  id: string;
  invoiceId: string;
  type: string;
  billed: string;
  remaining: string;
  status: string;
};

type MsaInvoiceDetailsSheetProps = {
  trigger: React.ReactNode;
  contractId: string;
  invoiceId: string;
  basePath: string;
  statsQueryKey: readonly unknown[];
  invoicesQueryKey: readonly unknown[];
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

const MsaInvoiceDetailsSheet: React.FC<MsaInvoiceDetailsSheetProps> = ({
  trigger,
  contractId,
  invoiceId,
  basePath,
  statsQueryKey,
  invoicesQueryKey,
}) => {
  const { isApprover } = useUserRole();
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
    queryKey: ["msaInvoiceDetail", contractId, invoiceId, basePath],
    queryFn: async () => {
      const res = await getRequest({ url: `${basePath}/${invoiceId}` });
      return res.data as { message?: string; data?: ContractInvoiceDTO };
    },
    enabled: open && Boolean(contractId) && Boolean(invoiceId),
    staleTime: 30000,
  });

  const { data: approveStatusRes } = useQuery({
    queryKey: ["msaInvoiceApproveStatus", contractId, invoiceId, basePath],
    queryFn: async () => {
      const res = await getRequest({ url: `${basePath}/${invoiceId}/approve/status` });
      return res.data as { data?: { status?: boolean }; status?: boolean };
    },
    enabled: open && isApprover && Boolean(contractId) && Boolean(invoiceId),
    staleTime: 30000,
  });

  const approveInvoiceMutation = useMutation({
    mutationFn: async (status: NonNullable<ApprovalActionDTO["action"]>) => {
      const comment = status === "approved"
        ? "Invoice approved via bulk action"
        : "Invoice rejected via bulk action";
      const payload: ApprovalActionDTO = { action: status, comment };
      const res = await postRequest({
        url: `${basePath}/${invoiceId}/approve`,
        payload,
      });
      return res.data;
    },
    onSuccess: async (response) => {
      toastHandler.success(
        "Invoice",
        response?.message || "Invoice approval status updated successfully",
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invoicesQueryKey }),
        queryClient.invalidateQueries({ queryKey: statsQueryKey }),
        queryClient.invalidateQueries({
          queryKey: ["msaInvoiceDetail", contractId, invoiceId, basePath],
        }),
      ]);
      setOpen(false);
    },
    onError: (mutationError) => {
      toastHandler.error("Invoice", mutationError as ApiResponseError);
    },
  });

  const invoice = data?.data;

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

  const canApprove = Boolean(
    approveStatusRes && (approveStatusRes.data?.status ?? approveStatusRes.status),
  );

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

  const statusToneClass =
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
          .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
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
        <div className="space-y-6">
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
                  {isLoading ? "Loading..." : invoiceIdLabel}
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                  statusToneClass,
                )}
              >
                {statusLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <LabelRow label="Invoice ID" value={invoiceIdLabel} />
              <LabelRow label="Type" value={isLoading ? "Loading..." : typeLabel} />
              <LabelRow
                label="Amount"
                value={
                  isLoading
                    ? "Loading..."
                    : formatCurrency(
                        typeof invoice?.amount === "number" ? invoice.amount : undefined,
                      )
                }
              />
              <LabelRow
                label="Tax"
                value={
                  isLoading
                    ? "Loading..."
                    : typeof invoice?.taxValue === "number"
                      ? `${invoice.taxValue}%`
                      : "-"
                }
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF]">Description</div>
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
                  {files.map((doc) => (
                    <DocumentItem
                      key={doc.id}
                      d={doc}
                      handlePreview={(nextDoc) => {
                        if (!nextDoc?.url) return;
                        setSelectedDoc(nextDoc);
                        setViewerOpen(true);
                      }}
                      handleDownload={(nextDoc) => {
                        if (!nextDoc.url) return;
                        window.open(nextDoc.url, "_blank", "noopener,noreferrer");
                      }}
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

          {isApprover && canApprove ? (
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
      </SheetContent>
      {selectedDoc && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedDoc(null);
          }}
          fileUrl={selectedDoc.url || ""}
          fileName={selectedDoc.name || "Attachment"}
          fileType={getFileExtension(selectedDoc.name, selectedDoc.type)}
        />
      )}
    </Sheet>
  );
};

const statusTone = (status?: string) => {
  const normalized = status?.toLowerCase();
  if (normalized === "approved") return "bg-[#EAF7EE] text-[#43A047]";
  if (normalized === "active") return "bg-[#E6F0FF] text-[#2563EB]";
  if (normalized === "pending") return "bg-[#FFF8E1] text-[#F4B400]";
  if (normalized === "rejected") return "bg-[#FEECEC] text-[#E53935]";
  if (normalized === "draft") return "bg-slate-100 text-slate-700";
  return "bg-slate-100 text-slate-700";
};

const formatCurrency = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  return `$${value.toLocaleString("en-US")}`;
};

const Invoice: React.FC<Props> = ({ contractId, isActive, actionsDisabled }) => {
  const { isManager, isApprover, isVendor, isProjectManager, isAdmin, isViewOnly } =
    useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<{ stats?: unknown; list?: unknown }>({});
  const [search, setSearch] = React.useState("");

  const basePath = React.useMemo(() => {
    if (isManager || isAdmin) return `/contract/manager/msa-contract/${contractId}/invoice`;
    if (isApprover) return `/contract/approver/msa-contract/${contractId}/invoice`;
    if (isVendor || isProjectManager)
      return `/contract/vendor/msa-contract/${contractId}/invoice`;
    if (isViewOnly) return `/contract/user/msa-contract/${contractId}/invoice`;
    return `/contract/user/msa-contract/${contractId}/invoice`;
  }, [
    contractId,
    isAdmin,
    isApprover,
    isManager,
    isVendor,
    isProjectManager,
    isViewOnly,
  ]);

  const statsPath = `${basePath}/stats`;
  const statsQueryKey = useUserQueryKey(["msa-invoices-stats", contractId, statsPath]);
  const invoicesQueryKey = useUserQueryKey(["msa-invoices", contractId, basePath]);

  const {
    data: statsRes,
    isLoading: isStatsLoading,
    error: statsError,
  } = useQuery({
    queryKey: statsQueryKey,
    queryFn: async () => {
      const res = await getRequest({ url: statsPath });
      return res.data as { data?: ContractInvoiceStatsDTO };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const {
    data: invoicesRes,
    isLoading: isInvoicesLoading,
    error: listError,
  } = useQuery({
    queryKey: invoicesQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("limit", "200");
      const res = await getRequest({ url: `${basePath}?${params.toString()}` });
      return res.data as {
        data?: {
          invoices?: ContractInvoiceDTO[];
          contractInvoices?: ContractInvoiceDTO[];
        };
      };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  React.useEffect(() => {
    toastErrorRef.current = toastHandler.error;
  }, [toastHandler.error]);

  React.useEffect(() => {
    if (!statsError) return;
    if (lastErrorRef.current.stats === statsError) return;
    lastErrorRef.current.stats = statsError;
    toastErrorRef.current("MSA Invoice Stats", statsError as ApiResponseError);
  }, [statsError]);

  React.useEffect(() => {
    if (!listError) return;
    if (lastErrorRef.current.list === listError) return;
    lastErrorRef.current.list = listError;
    toastErrorRef.current("MSA Invoice", listError as ApiResponseError);
  }, [listError]);

  const sourceRows = React.useMemo(() => {
    const payload = invoicesRes?.data;
    if (Array.isArray(payload?.invoices)) return payload.invoices;
    if (Array.isArray(payload?.contractInvoices)) return payload.contractInvoices;
    return [];
  }, [invoicesRes?.data]);

  const rows = React.useMemo<InvoiceRow[]>(
    () =>
      sourceRows.map((invoice) => {
        const raw = invoice as any;
        const billed = formatCurrency(invoice.amount);
        const remaining = formatCurrency(raw?.remaining ?? raw?.balance ?? raw?.remainingAmount);
        return {
          id: raw?._id || invoice.invoiceId || "-",
          invoiceId: invoice.invoiceId || raw?._id || "-",
          type: invoice.type
            ? invoice.type
                .split(" ")
                .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
                .join(" ")
            : "-",
          billed,
          remaining,
          status: invoice.status || "pending",
        };
      }),
    [sourceRows],
  );

  const filteredRows = React.useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (row) =>
        row.invoiceId.toLowerCase().includes(q) ||
        row.type.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const columns = React.useMemo<ColumnDef<InvoiceRow>[]>(
    () => [
      { accessorKey: "invoiceId", header: "Invoice ID" },
      { accessorKey: "type", header: "Type" },
      {
        id: "amountBilled",
        header: "Amount/Billed",
        cell: ({ row }) => (
          <div className="text-xs text-slate-600">
            <p>
              <span className="text-slate-500">Billed:&nbsp;</span>
              <span className="text-slate-900 font-medium">{row.original.billed}</span>
            </p>
            <p>
              <span className="text-slate-500">Remaining:&nbsp;</span>
              <span className="text-slate-900 font-medium">{row.original.remaining}</span>
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue<string>() || "pending";
          return (
            <Badge
              variant="secondary"
              className={cn(
                "rounded-full border-none px-4 py-1 font-semibold",
                statusTone(status),
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <MsaInvoiceDetailsSheet
              contractId={contractId}
              invoiceId={row.original.id}
              basePath={basePath}
              statsQueryKey={statsQueryKey}
              invoicesQueryKey={invoicesQueryKey}
              trigger={
                <Button
                  variant="link"
                  className="h-auto p-0 font-semibold text-[#43A047] hover:no-underline"
                >
                  View
                </Button>
              }
            />
          </div>
        ),
      },
    ],
    [basePath, contractId, invoicesQueryKey, statsQueryKey],
  );

  return (
    <TabsContent value="invoice" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-[#0F0F0F]">
          Invoice
        </h3>
        {isVendor && (
          <CreateInvoiceDialog
            contractId={contractId}
            createPath={basePath}
            invalidateQueryKey={invoicesQueryKey}
            trigger={
              <Button
                className="h-12 rounded-xl bg-[#2A4467] px-5 text-base font-semibold text-white hover:bg-[#2A4467]/90"
                disabled={!!actionsDisabled}
              >
                Create Invoice
              </Button>
            }
          />
        )}
      </div>

      <InvoiceStatsCards stats={statsRes?.data} isLoading={isStatsLoading} />

      <DataTable<InvoiceRow>
        data={filteredRows}
        columns={columns}
        options={{
          disableSelection: true,
          disablePagination: true,
          isLoading: isInvoicesLoading,
        }}
        header={() => (
          <div className="flex items-center gap-4 border-b border-[#E9E9EB] px-6 py-4">
            <div className="text-base font-semibold text-[#0F0F0F]">Invoices</div>
            <div className="relative w-[320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#6B6B6B]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search invoices"
                className="h-12 rounded-lg border border-[#E5E7EB] pl-9 text-sm text-[#0F0F0F] placeholder:text-[#6B6B6B]"
              />
            </div>
          </div>
        )}
        classNames={{
          container: "overflow-hidden rounded-xl border border-[#E5E7EB] bg-white",
          table: "border-spacing-y-0",
          tHeader: "bg-[#F9FAFB]",
          tHeadRow: "border-b border-[#E5E7EB]",
          tBody: "bg-white",
          tRow: "border-b border-[#E5E7EB]",
          tHead: "px-6 py-3 text-sm font-semibold text-[#2A4467]",
          tCell: "px-6 py-4 text-sm text-slate-700 align-top",
        }}
        emptyPlaceholder={
          <div className="px-6 py-8 text-sm text-slate-500">No invoices found.</div>
        }
      />
    </TabsContent>
  );
};

export default Invoice;
