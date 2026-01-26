import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export type AmendmentRow = {
  amendmentId: string;
  amendmentTitle: string;
  vendorStatus: "Accepted" | "Pending" | "Rejected";
  status: "Approved" | "Pending" | "Rejected";
};

const columns: ColumnDef<AmendmentRow>[] = [
  {
    accessorKey: "amendmentId",
    header: "Amendment ID",
    cell: ({ getValue }) => (
      <div className="w-[100px] py-2 text-center text-sm font-semibold text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "amendmentTitle",
    header: "Amendment Title",
    cell: ({ getValue }) => (
      <div className="w-[160px] py-2 text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "vendorStatus",
    header: "Vendor Status",
    cell: ({ getValue }) => (
      <div className="w-[100px] py-2 text-center text-sm font-semibold text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue<AmendmentRow["status"]>();
      const tone =
        s === "Approved"
          ? "bg-[#43A0471A] text-[#43A047]"
          : s === "Pending"
          ? "bg-[#FACC151A] text-[#FACC15]"
          : "bg-[#E539351A] text-[#E53935]";
      return (
        <div className="flex w-[120px] items-center justify-center py-2">
          <div className={`rounded-xl px-[18px] py-[6px] ${tone}`}>
            <span className="text-xs font-semibold leading-[15px]">{s}</span>
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Action",
    cell: () => (
      <div className="w-[80px] py-2 text-center">
        <a
          href="#"
          className="text-sm font-bold text-[#43A047] underline"
        >
          View
        </a>
      </div>
    ),
  },
];

const sampleRows: AmendmentRow[] = [
  {
    amendmentId: "AM-2025-10",
    amendmentTitle: "Additional structural reinforcement",
    vendorStatus: "Accepted",
    status: "Approved",
  },
  {
    amendmentId: "AM-2025-10",
    amendmentTitle: "Additional structural reinforcement",
    vendorStatus: "Pending",
    status: "Pending",
  },
  {
    amendmentId: "AM-2025-10",
    amendmentTitle: "Additional structural reinforcement",
    vendorStatus: "Rejected",
    status: "Rejected",
  },
  {
    amendmentId: "AM-2025-10",
    amendmentTitle: "Additional structural reinforcement",
    vendorStatus: "Accepted",
    status: "Approved",
  },
];

const AmendmentsTable: React.FC = () => {
  const [search, setSearch] = React.useState("");

  const filteredRows = React.useMemo(() => {
    if (!search) return sampleRows;
    const query = search.toLowerCase();
    return sampleRows.filter((row) =>
      [row.amendmentId, row.amendmentTitle, row.vendorStatus, row.status].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [search]);

  return (
    <div data-testid="amendments-table" className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
      <div className="flex items-center gap-6 border-b border-[#E9E9EB] px-6 py-6">
        <div className="text-base font-semibold text-[#0F0F0F]">Amendments</div>
        <div className="relative w-[300px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#6B6B6B]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="h-12 w-[300px] rounded-lg border border-[#E5E7EB] pl-9 text-sm text-[#0F0F0F] placeholder:text-[#6B6B6B]"
          />
        </div>
      </div>

      <div className="px-0 pb-0">
        <DataTable<AmendmentRow>
          data={filteredRows}
          columns={columns}
          options={{
            disableSelection: true,
            disablePagination: true,
            manualPagination: false,
            totalCounts: filteredRows.length,
            setPagination: () => {},
            pagination: { pageIndex: 0, pageSize: 10 },
          }}
          classNames={{
            container: "[&>div:last-child]:hidden",
            table: "border-spacing-y-0",
            tHeader: "bg-[#F9FAFB]",
            tHeadRow: "border-b border-[#E5E7EB]",
            tRow: "px-0 border-b border-[#E5E7EB]",
            tHead: "h-auto px-0 py-0 text-sm font-semibold text-[#2A4467]",
            tCell: "p-0",
          }}
        />
      </div>
    </div>
  );
};

export default AmendmentsTable;

