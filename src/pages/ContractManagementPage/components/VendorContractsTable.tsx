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
import VendorEmptyState from "./VendorEmptyState";
import { Link } from "react-router-dom";

export type VendorContractRow = {
  id: string;
  contractId: string;
  title: string;
  code: string;
  company: string;
  contractRelationship: string;
  value?: string;
  published?: string;
  endDate?: string;
  status:
    | "Active"
    | "Suspended"
    | "Closed"
    | "Pending_Review"
    | "Terminated"
    | "Expired"
    | "Cancelled"
    | "Published"
    | "Draft";
};

const columns: ColumnDef<VendorContractRow>[] = [
  {
    accessorKey: "title",
    header: "Contracts",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <a
          href={`/dashboard/contract-management/${row.original.id}`}
          data-testid="vendor-contract-name-link"
          className="font-medium text-slate-900 underline-offset-2 hover:underline"
        >
          {row.original.title}
        </a>
        <span className="text-xs text-slate-500">{row.original.code}</span>
      </div>
    ),
  },
  { accessorKey: "company", header: "Company" },
  { accessorKey: "contractRelationship", header: "Contract Relationship" },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ getValue }) => {
      const v = getValue<string | undefined>();
      return <span className="font-semibold text-slate-900">{v ?? "-"}</span>;
    },
  },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="text-xs text-slate-500">
        {row.original.published && (
          <div>
            Published:{" "}
            <span className="font-semibold text-slate-900">
              {row.original.published}
            </span>
          </div>
        )}
        {row.original.endDate && (
          <div>
            End Date:{" "}
            <span className="font-semibold text-slate-900">
              {row.original.endDate}
            </span>
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue<VendorContractRow["status"]>();
      const tone =
        s === "Active" || s === "Published"
          ? "bg-green-100 text-green-700"
          : s === "Draft"
            ? "bg-gray-100 text-gray-700"
            : s === "Pending_Review"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700";
      return (
        <span
          data-testid="vendor-contract-status-badge"
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
            data-testid="vendor-contract-actions-dropdown"
          >
            ⋮
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              to={`/dashboard/contract-management/${row.original.id}`}
              data-testid="vendor-view-contract-detail"
            >
              View Details
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

type VendorContractsTableProps = {
  rows?: VendorContractRow[];
  isLoading?: boolean;
  totalCount?: number;
  isReadOnly?: boolean;
};

const VendorContractsTable: React.FC<VendorContractsTableProps> = ({
  rows = [],
  isLoading,
  totalCount,
  isReadOnly,
}) => {
  const [search, setSearch] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const tableColumns = React.useMemo(() => {
    if (!isReadOnly) return columns;
    return columns.filter((column) => column.id !== "actions");
  }, [isReadOnly]);

  const filteredRows = React.useMemo(() => {
    if (!search) return rows;
    const query = search.toLowerCase();
    return rows.filter((row) => {
      return (
        row.title.toLowerCase().includes(query) ||
        row.code.toLowerCase().includes(query)
      );
    });
  }, [rows, search]);

  console.log({ filteredRows })

  return (
    <div data-testid="vendor-contracts-table">
      <DataTable<VendorContractRow>
        header={() => (
          <div className="flex items-center w-full justify-between border-b border-[#E9E9EB] dark:border-slate-600 p-3 pt-0">
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Contracts
                </span>
                <Input
                  placeholder="Search contract"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="vendor-search-input"
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
                        { label: "Active", value: "active" },
                        { label: "Suspended", value: "suspended" },
                        { label: "Closed", value: "closed" },
                        { label: "Terminated", value: "terminated" },
                      ],
                    },
                    {
                      title: "Category",
                      options: [
                        { label: "Software", value: "software" },
                        { label: "Construction", value: "construction" },
                      ],
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        )}
        emptyPlaceholder={<VendorEmptyState />}
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
          manualPagination: true,
          pagination,
          setPagination,
        }}
      />
    </div>
  );
};

export default VendorContractsTable;
