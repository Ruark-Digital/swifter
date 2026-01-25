import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export type RfiRow = {
  id: string;
  title: string;
  type: "Issued" | "Received";
  status: "Closed" | "Open";
};

const columns: ColumnDef<RfiRow>[] = [
  { accessorKey: "id", header: "RFI ID" },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ getValue }) => (
      <div className="max-w-[260px] text-sm text-slate-700">
        {getValue<string>()}
      </div>
    ),
  },
  { accessorKey: "type", header: "Type" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue<RfiRow["status"]>();
      const tone =
        s === "Open"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-600";
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
    cell: ({ row }) => (
      <div className="text-right">
        <a
          href="#"
          data-testid="view-rfi-detail"
          className="text-sm font-medium text-green-700 hover:underline"
        >
          {row.original.type === "Received" ? "Respond" : "View"}
        </a>
      </div>
    ),
  },
];

const sampleRows: RfiRow[] = [
  {
    id: "RFI-2025-10",
    title: "Additional structural reinforcement",
    type: "Issued",
    status: "Closed",
  },
  {
    id: "RFI-2025-10",
    title: "Additional structural reinforcement",
    type: "Received",
    status: "Open",
  },
];

const RfiTable: React.FC = () => {
  const [search, setSearch] = React.useState("");
  const filteredRows = React.useMemo(() => {
    if (!search) return sampleRows;
    const query = search.toLowerCase();
    return sampleRows.filter((row) =>
      [row.id, row.title, row.type].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [search]);
  return (
    <div className="space-y-4" data-testid="rfi-table">
      <DataTable<RfiRow>
        data={filteredRows}
        columns={columns}
        header={() => (
          <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-4">
            <span className="text-sm font-medium text-slate-900">RFI</span>
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

export default RfiTable;

