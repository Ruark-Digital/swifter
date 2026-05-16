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
import EmptyState from "./EmptyState";
import { Link } from "react-router-dom";

export type ContractRow = {
  id: string;
  contractId: string;
  title: string;
  code: string;
  vendor: string;
  value?: string;
  owner: string;
  published?: string;
  endDate?: string;
  status:
    | "Active"
    | "Publish"
    | "Draft"
    | "Expired"
    | "Terminated"
    | "Suspended"
    | "Completed"
    | "Cancelled"
    | "Pending Approval";
  category?: string;
};

const columns: ColumnDef<ContractRow>[] = [
  {
    accessorKey: "title",
    header: "Contracts",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <a
          href={`/dashboard/contract-management/${row.original.id}`}
          data-testid="project-name-link"
          className="font-medium text-slate-900 underline-offset-2 hover:underline"
        >
          {row.original.title}
        </a>
        <span className="text-xs text-slate-500">
          {row.original.contractId}
        </span>
      </div>
    ),
  },
  { accessorKey: "vendor", header: "Vendor" },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ getValue }) => {
      const v = getValue<string | undefined>();
      return <span className="font-semibold text-slate-900">{v ?? "-"}</span>;
    },
  },
  { accessorKey: "owner", header: "Owner" },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="text-xs text-slate-500">
        {row.original.published && (
          <div>
            <span className="text-black font-bold">Published:</span>{" "}
            {row.original.published}
          </div>
        )}
        {row.original.endDate && (
          <div>
            <span className="text-black font-bold">End Date:</span>{" "}
            {row.original.endDate}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue<ContractRow["status"]>();
      const tone =
        s === "Active" || s === "Publish"
          ? "bg-green-100 text-green-700"
          : s === "Draft"
            ? "bg-slate-100 text-slate-700"
            : s === "Pending Approval"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700";
      return (
        <span
          data-testid="contract-status-badge"
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
            data-testid="project-actions-dropdown"
          >
            ⋮
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              to={`/dashboard/contract-management/${row.original.id}`}
              data-testid="view-contract-detail"
            >
              View Details
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

type ContractsTableProps = {
  rows?: ContractRow[];
  isLoading?: boolean;
  totalCount?: number;
  isReadOnly?: boolean;
  disableActions?: boolean;
  pagination?: PaginationState;
  setPagination?: React.Dispatch<React.SetStateAction<PaginationState>>;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
};

const ContractsTable: React.FC<ContractsTableProps> = ({
  rows = [],
  isLoading,
  totalCount,
  isReadOnly,
  disableActions,
  pagination: paginationProp,
  setPagination: setPaginationProp,
  statusFilter,
  onStatusFilterChange,
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

  const normalizeStatus = React.useCallback((value?: string) => {
    return (value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  }, []);

  const tableColumns = React.useMemo(() => {
    if (!isReadOnly && !disableActions) return columns;
    return columns.filter((column) => column.id !== "actions");
  }, [isReadOnly, disableActions]);

  const filteredRows = React.useMemo(() => {
    let result = rows;

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

    return result;
  }, [rows, search, statusFilter, normalizeStatus]);

  const handleFilterChange = (filters: any) => {
    const status = filters.find((f: any) => f.title === "Status")?.value;
    if (status && onStatusFilterChange) {
      onStatusFilterChange(status);
    }
  };

  return (
    <div data-testid="contracts-table">
      <DataTable<ContractRow>
        header={() => (
          <div className="flex items-center w-full justify-between border-b border-[#E9E9EB] dark:border-slate-600 p-3 pt-0">
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Contracts
                </span>
                <Input
                  placeholder="Search contract"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                  data-testid="search-input"
                  className="h-10 w-[260px]"
                  disabled={isReadOnly}
                />
              </div>
              <div
                className={
                  isReadOnly
                    ? "ml-auto flex items-center gap-2 pointer-events-none opacity-60"
                    : "ml-auto flex items-center gap-2"
                }
                aria-disabled={isReadOnly}
              >
                <DropdownFilters
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
                        { label: "Suspended", value: "suspended" },
                        { label: "Expired", value: "expired" },
                        { label: "Terminated", value: "terminated" },
                        {
                          label: "Pending Approval",
                          value: "pending_approval",
                        },
                      ],
                    },
                    {
                      title: "Category",
                      options: [
                        { label: "All", value: "all" },
                        { label: "Software", value: "software" },
                        { label: "Construction", value: "construction" },
                      ],
                    },
                  ]}
                  onFilterChange={handleFilterChange}
                />
              </div>
            </div>
          </div>
        )}
        emptyPlaceholder={
          <EmptyState isReadOnly={isReadOnly || disableActions} />
        }
        classNames={{
          container:
            "bg-white dark:bg-slate-950 rounded-xl px-3 border border-gray-300 dark:border-slate-600",
        }}
        data={filteredRows}
        columns={tableColumns}
        options={{
          disableSelection: true,
          isLoading,
          totalCounts: totalCount ?? filteredRows.length,
          pagination,
          setPagination,
        }}
      />
    </div>
  );
};

export default ContractsTable;
