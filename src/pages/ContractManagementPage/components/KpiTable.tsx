import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/layouts/DataTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type KpiRow = {
  kpiId: string;
  category: string;
  currentAvgScore: string;
  allTimeAvgScore: string;
  lastUpdated: string;
  actions: Array<"Update" | "View">;
};

const columns: ColumnDef<KpiRow>[] = [
  {
    accessorKey: "kpiId",
    header: "KPI ID",
    cell: ({ getValue }) => (
      <div className="w-[100px] py-2 text-sm font-semibold text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ getValue }) => (
      <div className="w-[160px] overflow-hidden py-2 text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "currentAvgScore",
    header: () => (
      <div className="w-[160px] overflow-hidden">Current Avg. Score</div>
    ),
    cell: ({ getValue }) => (
      <div className="w-[160px] py-2 text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "allTimeAvgScore",
    header: () => (
      <div className="w-[160px] overflow-hidden">All Time Avg. Score</div>
    ),
    cell: ({ getValue }) => (
      <div className="w-[160px] py-2 text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "lastUpdated",
    header: () => <div className="w-[160px] overflow-hidden">Last Updated</div>,
    cell: ({ getValue }) => (
      <div className="w-[160px] py-2 text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="w-[80px]">Action</div>,
    cell: ({ row }) => {
      const actions = row.original.actions;
      return (
        <div className="flex w-[80px] items-center justify-center gap-[10px] py-2">
          {actions.includes("Update") && (
            <a
              href="#"
              className="text-sm font-bold text-[#286EE0] underline"
            >
              Update
            </a>
          )}
          {actions.includes("View") && (
            <a
              href="#"
              className="text-sm font-bold text-[#43A047] underline"
            >
              View
            </a>
          )}
        </div>
      );
    },
  },
];

const sampleRows: KpiRow[] = [
  {
    kpiId: "KPI-1",
    category: "On‑Time Delivery/Schedule Compliance",
    currentAvgScore: "70%",
    allTimeAvgScore: "70%",
    lastUpdated: "12-02-2025",
    actions: ["Update", "View"],
  },
  {
    kpiId: "KPI-2",
    category: "Quality & Specification Compliance",
    currentAvgScore: "70%",
    allTimeAvgScore: "70%",
    lastUpdated: "12-02-2025",
    actions: ["Update"],
  },
  {
    kpiId: "KPI-3",
    category: "Responsiveness",
    currentAvgScore: "70%",
    allTimeAvgScore: "70%",
    lastUpdated: "12-02-2025",
    actions: ["Update", "View"],
  },
  {
    kpiId: "KPI-4",
    category: "Contractual Compliance",
    currentAvgScore: "70%",
    allTimeAvgScore: "70%",
    lastUpdated: "12-02-2025",
    actions: ["Update", "View"],
  },
  {
    kpiId: "KPI-4",
    category: "Cost Variance",
    currentAvgScore: "70%",
    allTimeAvgScore: "70%",
    lastUpdated: "12-02-2025",
    actions: ["Update", "View"],
  },
  {
    kpiId: "KPI-4",
    category: "Invoice Accuracy",
    currentAvgScore: "70%",
    allTimeAvgScore: "70%",
    lastUpdated: "12-02-2025",
    actions: ["Update", "View"],
  },
  {
    kpiId: "KPI-4",
    category: "Issue Resolution",
    currentAvgScore: "70%",
    allTimeAvgScore: "70%",
    lastUpdated: "12-02-2025",
    actions: ["Update", "View"],
  },
];

const KpiTable: React.FC = () => {
  const [search, setSearch] = React.useState("");

  const filteredRows = React.useMemo(() => {
    if (!search) return sampleRows;
    const query = search.toLowerCase();
    return sampleRows.filter((row) =>
      [
        row.kpiId,
        row.category,
        row.currentAvgScore,
        row.allTimeAvgScore,
        row.lastUpdated,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [search]);

  return (
    <div className="relative flex flex-col gap-8">
      <div className="flex flex-col rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E9E9EB] px-6 py-6">
          <div className="flex items-center gap-6">
            <div className="text-base font-semibold text-[#0F0F0F]">KPI</div>
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

          <DropdownMenu defaultOpen>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] px-[15px] py-[7px]"
              >
                <img
                  src="/assets/contract-management/kpi/calendar.svg"
                  className="h-5 w-5"
                />
                <span className="text-sm font-semibold text-[#6B6B6B]">
                  Date
                </span>
                <img
                  src="/assets/contract-management/kpi/chevron-down.svg"
                  className="h-5 w-5"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={12}
              className="w-[160px] rounded-xl border border-[#E5E7EB] p-0 shadow-[2px_-2px_4px_0px_#2A44671A]"
            >
              {["All", "Today", "Last 7 Days", "Last 30 Days", "Custom"].map((label) => (
                <DropdownMenuItem
                  key={label}
                  className="cursor-pointer rounded-none px-4 py-3 text-sm font-medium text-[#181818]"
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <DataTable<KpiRow>
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
            tBody: "bg-white",
            tRow: "border-b border-[#E5E7EB]",
            tHead: "px-6 py-3 text-sm font-semibold text-[#2A4467]",
            tCell: "px-6 py-4 text-sm text-slate-700 align-top",
          }}
        />
      </div>
    </div>
  );
};

export default KpiTable;

