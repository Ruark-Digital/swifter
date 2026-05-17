import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import { DropdownFilters } from "@/components/layouts/SolicitationFilters";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  format,
  isWithinInterval,
  subDays,
  startOfDay,
  endOfDay,
} from "date-fns";

export type MsaRow = {
  id: string;
  title: string;
  code: string;
  vendor: string;
  value?: string;
  owner: string;
  published?: string;
  endDate?: string;
  status:
    | "Active"
    | "Draft"
    | "Expired"
    | "Terminated"
    | "Suspended"
    | "Pending Approval";
  category?: string;
};

const columns: ColumnDef<MsaRow>[] = [
  {
    accessorKey: "title",
    header: "MSA",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-slate-900 dark:text-slate-100">{row.original.title}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{row.original.code}</span>
      </div>
    ),
  },
  { accessorKey: "vendor", header: "Vendor" },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ getValue }) => {
      const v = getValue<string | undefined>();
      return <span className="font-semibold text-slate-900 dark:text-slate-100">{v ?? "-"}</span>;
    },
  },
  { accessorKey: "owner", header: "Owner" },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {row.original.published && (
          <div>
            Published: {format(new Date(row.original.published), "yyyy MMM dd")}
          </div>
        )}
        {row.original.endDate && (
          <div>
            End Date: {format(new Date(row.original.endDate), "yyyy MMM dd")}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue<MsaRow["status"]>();
      const tone =
        s === "Active"
          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
          : s === "Draft"
            ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            : s === "Expired" || s === "Terminated" || s === "Suspended"
              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"; // Pending Approval
      return (
        <span
          data-testid="msa-status-badge"
          className={`px-2 py-1 rounded-full text-xs font-medium ${tone}`}
        >
          {s}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            data-testid="msa-actions-dropdown"
          >
            ⋮
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {row.original.id ? (
            <DropdownMenuItem asChild data-testid="msa-view-details">
              <Link to={`/dashboard/msa/${row.original.id}`}>View Details</Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled data-testid="msa-view-details">
              View Details
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

type MsaTableProps = {
  rows?: MsaRow[];
  isLoading?: boolean;
  totalCount?: number;
  pagination?: PaginationState;
  setPagination?: React.Dispatch<React.SetStateAction<PaginationState>>;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  categoryFilter?: string;
  onCategoryFilterChange?: (category: string) => void;
  dateFilter?: string;
  onDateFilterChange?: (date: string) => void;
};

const MsaTable: React.FC<MsaTableProps> = ({
  rows = [],
  isLoading,
  totalCount,
  pagination: paginationProp,
  setPagination: setPaginationProp,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  dateFilter,
  onDateFilterChange,
}) => {
  const [search, setSearch] = React.useState("");
  const [localPagination, setLocalPagination] = React.useState<PaginationState>(
    {
      pageIndex: 0,
      pageSize: 10,
    },
  );
  const pagination = paginationProp ?? localPagination;
  const setPagination = setPaginationProp ?? setLocalPagination;
  const data = React.useMemo(() => rows ?? [], [rows]);

  const normalizeStatus = React.useCallback((value?: string) => {
    return (value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  }, []);

  const filteredRows = React.useMemo(() => {
    let result = data;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter((row) => {
        return (
          row.title.toLowerCase().includes(query) ||
          row.code.toLowerCase().includes(query)
        );
      });
    }

    if (statusFilter && statusFilter !== "all") {
      result = result.filter((row) => {
        return normalizeStatus(row.status) === normalizeStatus(statusFilter);
      });
    }

    if (categoryFilter && categoryFilter !== "all") {
      result = result.filter((row) => {
        return row.category?.toLowerCase() === categoryFilter.toLowerCase();
      });
    }

    if (dateFilter && dateFilter !== "all" && dateFilter !== "custom") {
      const now = new Date();
      result = result.filter((row) => {
        if (!row.published) return false;
        const publishedDate = new Date(row.published);

        if (dateFilter === "today") {
          return isWithinInterval(publishedDate, {
            start: startOfDay(now),
            end: endOfDay(now),
          });
        }
        if (dateFilter === "last7days") {
          return isWithinInterval(publishedDate, {
            start: startOfDay(subDays(now, 7)),
            end: endOfDay(now),
          });
        }
        if (dateFilter === "last30days") {
          return isWithinInterval(publishedDate, {
            start: startOfDay(subDays(now, 30)),
            end: endOfDay(now),
          });
        }
        return true;
      });
    }

    return result;
  }, [data, search, statusFilter, categoryFilter, dateFilter, normalizeStatus]);

  const handleFilterChange = (filterTitle: string, value: string) => {
    const title = filterTitle.toLowerCase();
    if (title === "status" && onStatusFilterChange) {
      onStatusFilterChange(value);
    } else if (title === "category" && onCategoryFilterChange) {
      onCategoryFilterChange(value);
    } else if (title === "date" && onDateFilterChange) {
      onDateFilterChange(value);
    }
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  return (
    <div className="space-y-4" data-testid="msa-table">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Master Service Agreement
          </span>
          <Input
            placeholder="Search contract"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            data-testid="msa-search-input"
            className="h-10 w-[260px]"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <DropdownFilters
            selectedValues={{
              Status: statusFilter || "all",
              Category: categoryFilter || "all",
              Date: dateFilter || "all",
            }}
            filters={[
              {
                title: "Date",
                showIcon: true,
                options: [
                  {
                    hasOptions: true,
                    value: "date",
                    label: "Date Created",
                    subOptions: [
                      { title: "All", value: "all" },
                      { title: "Today", value: "today" },
                      { title: "Last 7 Days", value: "last7days" },
                      { title: "Last 30 Days", value: "last30days" },
                      { title: "Custom", value: "custom" },
                    ],
                  },
                ],
              },
              {
                title: "Status",
                showIcon: true,
                options: [
                  { label: "All", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Draft", value: "draft" },
                  { label: "Expired", value: "expired" },
                  { label: "Terminated", value: "terminated" },
                  { label: "Suspended", value: "suspended" },
                  { label: "Pending Approval", value: "pending_approval" },
                ],
              },
              {
                title: "Category",
                options: [
                  { label: "All", value: "all" },
                  {
                    label: "Major Work Construction",
                    value: "major_work_construction",
                  },
                  {
                    label: "Minor Work Contruction",
                    value: "minor_work_contruction",
                  },
                  {
                    label: "Engineering & Consulting",
                    value: "engineering_consulting",
                  },
                  {
                    label: "Environmental Services",
                    value: "environmental_services",
                  },
                  {
                    label: "Master Supply Agreement",
                    value: "master_supply_agreement",
                  },
                  {
                    label: "Geo-Technical Services",
                    value: "geo_technical_services",
                  },
                  { label: "Others", value: "others" },
                ],
              },
            ]}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      <DataTable<MsaRow>
        data={filteredRows}
        columns={columns}
        options={{
          disableSelection: true,
          isLoading,
          totalCounts: totalCount ?? filteredRows.length,
          manualPagination: true,
          pagination,
          setPagination,
        }}
        classNames={{
          container: "border border-[#E5E7EB] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900",
          tHeader: "bg-[#F9FAFB] dark:bg-slate-800",
          tHeadRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tBody: "bg-white dark:bg-slate-900",
          tRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tHead: "px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400",
          tCell: "px-6 py-4 text-sm text-slate-700 dark:text-slate-200 align-top",
        }}
      />
    </div>
  );
};

export default MsaTable;
