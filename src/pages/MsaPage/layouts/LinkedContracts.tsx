import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/layouts/SearchInput";
import { DropdownFilters } from "@/components/layouts/SolicitationFilters";
import { MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";

export type LinkedContractRow = {
  id: string;
  title: string;
  code: string;
  company: string;
  relationship: string;
  value?: string;
  published?: string;
  endDate?: string;
  status: string;
};

type Props = {
  rows?: LinkedContractRow[];
  isLoading?: boolean;
};

const statusTone = (s: LinkedContractRow["status"]) => {
  const normalized = String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (normalized === "active") return "bg-[#43A0471A] text-[#43A047]";
  if (normalized === "terminated") return "bg-[#E539351A] text-[#E53935]";
  if (normalized === "closed") return "bg-[#6B72801A] text-[#6B7280]";
  if (normalized === "suspended") return "bg-[#F59E0B1A] text-[#F59E0B]";
  if (normalized === "pending_approval") return "bg-[#F59E0B1A] text-[#F59E0B]";
  return "bg-[#E5E7EB] text-[#374151]";
};

const LinkedContracts: React.FC<Props> = ({ rows = [], isLoading = false }) => {
  const [search, setSearch] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const filtered = React.useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.relationship.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const columns = React.useMemo<ColumnDef<LinkedContractRow>[]>(() => {
    return [
      {
        accessorKey: "title",
        header: "Contracts",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">
              {row.original.title}
            </span>
            <span className="text-xs text-slate-500">{row.original.code}</span>
          </div>
        ),
      },
      {
        accessorKey: "company",
        header: "Company",
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-900">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "relationship",
        header: "Contract Relationship",
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-900">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "value",
        header: "Value",
        cell: ({ getValue }) => {
          const v = getValue<string | undefined>();
          return (
            <span className="font-semibold text-slate-900">{v ?? "-"}</span>
          );
        },
      },
      {
        id: "date",
        header: "Date",
        cell: ({ row }) => (
          <div className="text-xs text-slate-500">
            <div>
              <span className="text-slate-700">Published:&nbsp;</span>
              <span>{row.original.published ?? "-"}</span>
            </div>
            <div>
              <span className="text-slate-700">End Date:&nbsp;</span>
              <span>{row.original.endDate ?? "-"}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const s = getValue<LinkedContractRow["status"]>();
          return (
            <div
              className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold ${statusTone(s)}`}
            >
              {s}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button variant="ghost" className="h-8 w-8 p-0" asChild>
            <Link
              to={`/dashboard/contract-management/${row.original.id}`}
              aria-label="View Contract"
            >
              <MoreVertical className="h-4 w-4 text-slate-500" />
            </Link>
          </Button>
        ),
      },
    ];
  }, []);

  const filters = React.useMemo(
    () => [
      {
        title: "Date",
        showIcon: true,
        options: [
          { value: "any", label: "Any" },
          {
            hasOptions: true,
            value: "range",
            label: "Range",
            subOptions: [
              { title: "Last 7 days", value: "7" },
              { title: "Last 30 days", value: "30" },
              { title: "Last 60 days", value: "60" },
              { title: "YTD", value: "YTD" },
            ],
          },
        ],
      },
      {
        title: "Status",
        showIcon: true,
        options: [
          { value: "all", label: "All" },
          { value: "active", label: "Active" },
          { value: "terminated", label: "Terminated" },
          { value: "closed", label: "Closed" },
          { value: "suspended", label: "Suspended" },
        ],
      },
      {
        title: "Category",
        options: [
          { value: "all", label: "All" },
          { value: "construction", label: "Construction" },
          { value: "it", label: "IT" },
          { value: "facilities", label: "Facilities" },
        ],
      },
    ],
    [],
  );

  return (
    <DataTable
      data={filtered}
      columns={columns}
      header={() => (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-slate-700">
              Contracts
            </div>
            <SearchInput
              placeholder="contract"
              searchQuery={search}
              setSearchQuery={setSearch}
            />
          </div>
          <DropdownFilters filters={filters as any} />
        </div>
      )}
      options={{
        disablePagination: false,
        disableSelection: true,
        isLoading,
        totalCounts: filtered.length,
        manualPagination: true,
        setPagination,
        pagination,
      }}
      classNames={{
        container: "bg-white rounded-xl px-3",
      }}
      emptyPlaceholder={
        <div className="text-center py-8">
          <p className="text-gray-500">No linked contracts found</p>
        </div>
      }
    />
  );
};

export default LinkedContracts;
