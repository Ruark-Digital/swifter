import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export type DeliverableRow = {
  id: string;
  title: string;
  dueDate: string;
  submissionDate?: string;
  submissionStatus: "Submitted" | "Late" | "Pending";
  kpi: string;
  status: "Approved" | "Rejected" | "Under Review";
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
        <a href="#" className="text-sm font-medium text-green-700 hover:underline">
          View
        </a>
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

