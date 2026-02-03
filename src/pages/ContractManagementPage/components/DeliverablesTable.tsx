import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
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

export type DeliverableRow = {
  id: string;
  title: string;
  dueDate: string;
  submissionDate?: string;
  submissionStatus: "Submitted" | "Late" | "Pending";
  kpi: string;
  status: "Approved" | "Rejected" | "Under Review";
};

type DeliverableDetailsSheetProps = {
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

const DeliverableDetailsSheet: React.FC<DeliverableDetailsSheetProps> = ({
  trigger,
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl rounded-2xl overflow-y-auto [&>button]:hidden"
      >
        <div className="space-y-6" data-testid="deliverable-details-sheet">
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
                  Deliverable Details
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-[#0F0F0F]">
                Additional structural reinforcement
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
              >
                <Share2 className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <LabelRow
                label="Deliverable Title"
                value="Additional structural reinforcement"
              />
              <LabelRow
                label="Vendor/Contractor"
                value={
                  <a className="text-[#2563EB] underline">
                    Olamide Oladehinde
                  </a>
                }
              />
              <LabelRow label="Due Date" value="April 30, 2025" />
              <LabelRow label="Submission Date" value="-" />
              <LabelRow label="Submission Status" value="Pending" />
              <LabelRow label="Submission KPI" value="Due in 4 days" />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF]">Status</div>
              <div className="inline-flex rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#F59E0B]">
                Under Review
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF]">Description</div>
              <div className="text-sm text-[#374151]">
                Lorem ipsum dolor sit amet consectetur. Volutpat quis egestas
                nunc egestas ut sed accumsan commodo vitae. Ullamcorper feugiat
                pulvinar consectetur vel natoque amet enim ac sed. Laoreet
                fringilla sollicitudin pharetra sit proin dictum. Sit sed lorem
                mauris.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-base font-semibold text-[#0F0F0F]">
              Attached Documents
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DocCard name="RFP_HRSoftware" type="DOC" size="25KB" />
              <DocCard name="RFP_HRSoftware" type="PDF" size="1MB" />
              <DocCard name="RFP_HRSoftware" type="DOC" size="25KB" />
              <DocCard name="RFP_HRSoftware" type="PDF" size="1MB" />
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

const columns: ColumnDef<DeliverableRow>[] = [
  { accessorKey: "id", header: "Deliverable ID" },
  {
    accessorKey: "title",
    header: "Deliverable Title",
    cell: ({ getValue }) => (
      <div className="max-w-[260px] text-sm text-slate-700">
        {getValue<string>()}
      </div>
    ),
  },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="space-y-1 text-xs text-slate-600">
        <p>
          <span className="text-slate-500">Due Date:&nbsp;</span>
          <span className="text-slate-900">{row.original.dueDate}</span>
        </p>
        <p>
          <span className="text-slate-500">Submission Date:&nbsp;</span>
          <span className="text-slate-900">
            {row.original.submissionDate ?? "-"}
          </span>
        </p>
      </div>
    ),
  },
  { accessorKey: "submissionStatus", header: "Submission Status" },
  { accessorKey: "kpi", header: "KPI" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue<DeliverableRow["status"]>();
      const tone =
        s === "Approved"
          ? "bg-green-100 text-green-700"
          : s === "Rejected"
          ? "bg-red-100 text-red-600"
          : "bg-yellow-100 text-yellow-700";
      return (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone}`}
        >
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
        <DeliverableDetailsSheet
          trigger={
            <button
              type="button"
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

const sampleRows: DeliverableRow[] = [
  {
    id: "DEL-2025-10",
    title: "Additional structural reinforcement",
    dueDate: "2025-03-25",
    submissionDate: "2025-03-25",
    submissionStatus: "Submitted",
    kpi: "4 days early",
    status: "Approved",
  },
  {
    id: "DEL-2025-10",
    title: "Additional structural reinforcement",
    dueDate: "2025-03-25",
    submissionDate: "2025-03-25",
    submissionStatus: "Submitted",
    kpi: "4 days late",
    status: "Approved",
  },
  {
    id: "DEL-2025-10",
    title: "Additional structural reinforcement",
    dueDate: "2025-03-25",
    submissionDate: "-",
    submissionStatus: "Late",
    kpi: "7 days late",
    status: "Rejected",
  },
  {
    id: "DEL-2025-10",
    title: "Additional structural reinforcement",
    dueDate: "2025-03-25",
    submissionDate: "-",
    submissionStatus: "Pending",
    kpi: "Due in 4 days",
    status: "Under Review",
  },
];

const DeliverablesTable: React.FC = () => {
  const [search, setSearch] = React.useState("");
  const filteredRows = React.useMemo(() => {
    if (!search) return sampleRows;
    const query = search.toLowerCase();
    return sampleRows.filter((row) =>
      [
        row.id,
        row.title,
        row.submissionStatus,
        row.status,
        row.kpi,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [search]);

  
  return (
    <div className="space-y-4" data-testid="deliverables-table">
      <DataTable<DeliverableRow>
        data={filteredRows}
        columns={columns}
        header={() => (
          <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-4">
            <span className="text-sm font-medium text-slate-900">
              Deliverables
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-[260px] pl-9"
              />
            </div>
          </div>
        )}
        options={{
          disableSelection: true,
          disablePagination: true,
          manualPagination: false,
          totalCounts: filteredRows.length,
          setPagination: () => {},
          pagination: { pageIndex: 0, pageSize: 10 },
        }}
        classNames={{
          container: "border border-[#E5E7EB] rounded-xl bg-white",
          tHeader: "bg-[#F9FAFB]",
          tHeadRow: "border-b border-[#E5E7EB]",
          tBody: "bg-white",
          tRow: "border-b border-[#E5E7EB]",
          tHead: "px-6 py-3 text-xs font-semibold text-slate-500",
          tCell: "px-6 py-4 text-sm text-slate-700 align-top",
        }}
      />
    </div>
  );
};

export default DeliverablesTable;
