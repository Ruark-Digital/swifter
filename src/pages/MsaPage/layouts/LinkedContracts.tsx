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
  createdAtRaw?: string;
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
  if (normalized === "closed") return "bg-[#6B72801A] text-[#6B7280] dark:text-slate-400";
  if (normalized === "suspended") return "bg-[#F59E0B1A] text-[#F59E0B]";
  if (normalized === "pending_approval") return "bg-[#F59E0B1A] text-[#F59E0B]";
  return "bg-[#E5E7EB] text-[#374151] dark:text-slate-200";
};

const normalizeStatus = (value?: string) =>
  (value ?? "").trim().toLowerCase().replace(/\s+/g, "_");

const applyDateFilter = (
  rows: LinkedContractRow[],
  dateFilter: string,
): LinkedContractRow[] => {
  if (!dateFilter || dateFilter === "all") return rows;
  const now = new Date();
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOf(now);
  return rows.filter((row) => {
    if (!row.createdAtRaw) return true;
    const created = new Date(row.createdAtRaw);
    if (dateFilter === "today")
      return startOf(created).getTime() === today.getTime();
    if (dateFilter === "last7days")
      return created >= new Date(today.getTime() - 6 * 86400000);
    if (dateFilter === "last30days")
      return created >= new Date(today.getTime() - 29 * 86400000);
    return true;
  });
};

const LinkedContracts: React.FC<Props> = ({ rows = [], isLoading = false }) => {
  const [search, setSearch] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const filtered = React.useMemo(() => {
    let result = rows;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.company.toLowerCase().includes(q) ||
          r.relationship.toLowerCase().includes(q),
      );
    }

    if (statusFilter && statusFilter !== "all") {
      result = result.filter(
        (r) => normalizeStatus(r.status) === normalizeStatus(statusFilter),
      );
    }

    result = applyDateFilter(result, dateFilter);

    return result;
  }, [rows, search, statusFilter, dateFilter]);

  const selectedFilterValues: Record<string, string> = {
    Status: statusFilter,
    Date: dateFilter,
  };

  const handleFilterChange = (filterTitle: string, value: string) => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    if (filterTitle === "Status") setStatusFilter(value);
    else if (filterTitle === "Date") setDateFilter(value);
  };

  const columns = React.useMemo<ColumnDef<LinkedContractRow>[]>(() => {
    return [
      {
        accessorKey: "title",
        header: "Contracts",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {row.original.title}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{row.original.code}</span>
          </div>
        ),
      },
      {
        accessorKey: "company",
        header: "Company",
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-900 dark:text-slate-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "relationship",
        header: "Contract Relationship",
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-900 dark:text-slate-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "value",
        header: "Value",
        cell: ({ getValue }) => {
          const v = getValue<string | undefined>();
          return (
            <span className="font-semibold text-slate-900 dark:text-slate-100">{v ?? "-"}</span>
          );
        },
      },
      {
        id: "date",
        header: "Date",
        cell: ({ row }) => (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <div>
              <span className="text-slate-700 dark:text-slate-200">Published:&nbsp;</span>
              <span>{row.original.published ?? "-"}</span>
            </div>
            <div>
              <span className="text-slate-700 dark:text-slate-200">End Date:&nbsp;</span>
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
              <MoreVertical className="h-4 w-4 text-slate-500 dark:text-slate-400" />
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
          { label: "All", value: "all" },
          { label: "Today", value: "today" },
          { label: "Last 7 Days", value: "last7days" },
          { label: "Last 30 Days", value: "last30days" },
        ],
      },
      {
        title: "Status",
        showIcon: true,
        options: [
          { label: "All", value: "all" },
          { label: "Active", value: "active" },
          { label: "Draft", value: "draft" },
          { label: "Suspended", value: "suspended" },
          { label: "Expired", value: "expired" },
          { label: "Terminated", value: "terminated" },
          { label: "Pending Approval", value: "pending_approval" },
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
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Contracts
            </div>
            <SearchInput
              placeholder="contract"
              searchQuery={search}
              setSearchQuery={setSearch}
            />
          </div>
          <DropdownFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            selectedValues={selectedFilterValues}
          />
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
        container: "bg-white dark:bg-slate-900 rounded-xl px-3",
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
