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
import { ArrowLeft, Download, Eye, Search, Share2, X } from "lucide-react";
import type { ContractInvoiceDTO } from "../api/contractManagerApi";

export type InvoiceRow = {
  id: string;
  type: string;
  billed: string;
  remaining: string;
  status: "Approved" | "Pending" | "Rejected" | "Draft";
};

type InvoiceDetailsSheetProps = {
  trigger: React.ReactNode;
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

const DocCard = ({
  name,
  type,
  size,
}: {
  name: string;
  type: "DOC" | "PDF";
  size: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2FF] text-xs font-semibold text-[#3B82F6]">
      {type}
    </div>
    <div className="flex-1">
      <div className="text-sm font-medium text-[#111827]">{name}</div>
      <div className="text-xs text-[#9CA3AF]">
        {type} • {size}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280]"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6F0FF] text-[#2563EB]"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const InvoiceDetailsSheet: React.FC<InvoiceDetailsSheetProps> = ({
  trigger,
}) => {
  return (
    <Sheet>
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
              <div className="text-base font-semibold text-[#0F0F0F]">
                Invoice Details
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
              >
                <Share2 className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <LabelRow label="Submitted by" value="Zenith Solutions" />
              <LabelRow label="Invoice ID" value="INV-2025-10" />
              <LabelRow label="Invoice Category" value="Milestone Payment" />
              <LabelRow label="Linked Milestone" value="Milestone 1" />
              <LabelRow label="Submission Date" value="April 30, 2025" />
              <LabelRow
                label="Status"
                value={
                  <span className="inline-flex rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#16A34A]">
                    Approved
                  </span>
                }
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF]">
                Description/Note
              </div>
              <div className="text-sm text-[#374151]">
                Crypto ipsum bitcoin ethereum dogecoin litecoin. Compound
                decentraland stacks decred uniswap velas serum. Crypto ipsum
                bitcoin ethereum dogecoin litecoin. Compound decentraland stacks
                decred uniswap velas serum. Crypto ipsum bitcoin ethereum dogecoin
                litecoin. Compound decentraland stacks decred uniswap velas serum.
                Crypto ipsum bitcoin ethereum dogecoin litecoin. Compound
                decentraland stacks decred uniswap velas serum.
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-base font-semibold text-[#0F0F0F]">
                Attachment
              </div>
              <DocCard name="RFP_HRSoftware" type="DOC" size="25KB" />
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827]"
            >
              Reject
            </Button>
            <Button className="h-11 flex-1 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white">
              Approve
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const columns: ColumnDef<InvoiceRow>[] = [
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
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${tone}`}>
          {s}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: () => (
      <div className="text-right">
        <InvoiceDetailsSheet
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

type InvoiceTableProps = {
  rows?: ContractInvoiceDTO[];
  isLoading?: boolean;
  totalCount?: number;
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
};

const InvoiceTable: React.FC<InvoiceTableProps> = ({
  rows = [],
  isLoading,
  totalCount,
  pagination,
  setPagination,
}) => {
  const [search, setSearch] = React.useState("");

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
          <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-4">
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
