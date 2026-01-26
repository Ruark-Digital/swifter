import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export type NcrRow = {
  id: string;
  title: string;
  status: "Approved" | "Pending";
};

const columns: ColumnDef<NcrRow>[] = [
  { accessorKey: "id", header: "NCR ID" },
  { accessorKey: "title", header: "Title" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue<NcrRow["status"]>();
      const tone =
        s === "Approved"
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700";
      return (
        <span className={`px-4 py-1 rounded-full text-xs font-medium ${tone}`}>
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
        <a
          href="#"
          className="text-sm font-medium text-green-700 hover:underline"
        >
          View
        </a>
      </div>
    ),
  },
];

const sampleRows: NcrRow[] = [
  { id: "NCR-2025-10", title: "Progress Draw", status: "Approved" },
  { id: "NCR-2025-10", title: "Progress Draw", status: "Pending" },
  { id: "NCR-2025-10", title: "Progress Draw", status: "Pending" },
  { id: "NCR-2025-10", title: "Progress Draw", status: "Approved" },
  { id: "NCR-2025-10", title: "Progress Draw", status: "Approved" },
];

const NcrTable: React.FC = () => {
  const [search, setSearch] = React.useState("");

  const filteredRows = React.useMemo(() => {
    if (!search) return sampleRows;
    const query = search.toLowerCase();
    return sampleRows.filter((row) =>
      [row.id, row.title, row.status].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [search]);

  return (
    <div className="space-y-4" data-testid="ncr-table">
      <DataTable<NcrRow>
        data={filteredRows}
        columns={columns}
        header={() => (
          <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-4">
            <span className="text-sm font-medium text-slate-900">NCR</span>
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

export default NcrTable;

