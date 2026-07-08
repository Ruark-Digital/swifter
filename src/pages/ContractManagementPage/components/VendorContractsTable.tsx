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
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";

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
    | "Completed"
    | "Published"
    | "Draft"
    | "Pending Approval";
  isOwner?: boolean;
};

const columns: ColumnDef<VendorContractRow>[] = [
  {
    accessorKey: "title",
    header: "Contracts",
    cell: ({ row }) => (
      <div className="flex flex-col max-w-[320px] min-w-0">
        <a
          href={`/dashboard/contract-management/${row.original.id}`}
          data-testid="vendor-contract-name-link"
          title={row.original.title}
          className="block truncate font-medium text-slate-900 dark:text-slate-100 underline-offset-2 hover:underline"
        >
          {row.original.title}
        </a>
        <span className="truncate text-xs text-slate-500 dark:text-slate-400">{row.original.code}</span>
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
      return (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {v ?? "-"}
        </span>
      );
    },
  },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {row.original.published && (
          <div>
            Published:{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {row.original.published}
            </span>
          </div>
        )}
        {row.original.endDate && (
          <div>
            End Date:{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
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
            : s === "Pending Approval"
            ? "bg-yellow-100 text-yellow-700"
            : s === "Completed"
            ? "bg-blue-100 text-blue-700"
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

// Actions cell with its dropdown open-state lifted to the table level —
// an uncontrolled DropdownMenu per row keeps independent Radix state, so
// a menu left open doesn't close when another row's menu is opened.
const buildActionsColumn = (
  openMenuRowId: string | null,
  setOpenMenuRowId: (id: string | null) => void,
  enableTakeOver: boolean,
  onOpenTakeOver: (id: string) => void,
): ColumnDef<VendorContractRow> => ({
  id: "actions",
  header: "Actions",
  cell: ({ row }) => (
    <DropdownMenu
      open={openMenuRowId === row.original.id}
      onOpenChange={(open) => setOpenMenuRowId(open ? row.original.id : null)}
    >
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
        {enableTakeOver && row.original.isOwner === false && (
          <DropdownMenuItem
            data-testid="vendor-request-takeover"
            onClick={() => onOpenTakeOver(row.original.id)}
          >
            Request take-over
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  ),
});

type VendorContractsTableProps = {
  rows?: VendorContractRow[];
  isLoading?: boolean;
  totalCount?: number;
  isReadOnly?: boolean;
  pagination?: PaginationState;
  setPagination?: React.Dispatch<React.SetStateAction<PaginationState>>;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  enableTakeOver?: boolean;
  onRequestTakeOver?: (contractId: string) => void;
  isRequestingTakeOver?: boolean;
};

const VendorContractsTable: React.FC<VendorContractsTableProps> = ({
  rows = [],
  isLoading,
  totalCount,
  isReadOnly,
  pagination: paginationProp,
  setPagination: setPaginationProp,
  statusFilter,
  onStatusFilterChange,
  enableTakeOver,
  onRequestTakeOver,
  isRequestingTakeOver,
}) => {
  const [search, setSearch] = React.useState("");
  const [openMenuRowId, setOpenMenuRowId] = React.useState<string | null>(null);
  const [takeOverId, setTakeOverId] = React.useState<string | null>(null);
  const [localPagination, setLocalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const pagination = paginationProp ?? localPagination;
  const setPagination = setPaginationProp ?? setLocalPagination;

  // Close the take-over dialog once the parent's mutation settles (loading
  // flips back to false) instead of holding dialog-open state in the parent.
  const wasRequestingTakeOverRef = React.useRef(false);
  React.useEffect(() => {
    if (wasRequestingTakeOverRef.current && !isRequestingTakeOver) {
      setTakeOverId(null);
    }
    wasRequestingTakeOverRef.current = Boolean(isRequestingTakeOver);
  }, [isRequestingTakeOver]);

  const tableColumns = React.useMemo(() => {
    if (isReadOnly) return columns.filter((column) => column.id !== "actions");
    return columns.map((column) =>
      column.id === "actions"
        ? buildActionsColumn(
            openMenuRowId,
            setOpenMenuRowId,
            Boolean(enableTakeOver),
            setTakeOverId,
          )
        : column,
    );
  }, [isReadOnly, openMenuRowId, enableTakeOver]);

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
        if (statusFilter === "closed") {
          return ["Closed", "Expired", "Cancelled"].includes(row.status);
        }
        return row.status.toLowerCase() === statusFilter.toLowerCase();
      });
    }

    return result;
  }, [rows, search, statusFilter]);

  const handleFilterChange = (filters: any) => {
    const status = filters.find((f: any) => f.title === "Status")?.value;
    if (status && onStatusFilterChange) {
      onStatusFilterChange(status);
    }
  };

  return (
    <div data-testid="vendor-contracts-table">
      <DataTable<VendorContractRow>
        header={() => (
          <div className="flex items-center w-full justify-between border-b border-[#E9E9EB] dark:border-slate-600 p-3 pt-0">
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Contracts
                </span>
                <Input
                  placeholder="Search contract"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
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
                        { label: "All", value: "all" },
                        { label: "Active", value: "active" },
                        { label: "Suspended", value: "suspended" },
                        { label: "Closed", value: "closed" },
                        { label: "Terminated", value: "terminated" },
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
      <ConfirmAlert
        open={Boolean(takeOverId)}
        onClose={(o) => !o && setTakeOverId(null)}
        type="info"
        title="Request take-over"
        text="Request to take over this contract? A Contract Manager or Procurement Lead must approve before it becomes yours."
        primaryButtonText="Request"
        secondaryButtonText="Cancel"
        primaryButtonLoading={isRequestingTakeOver}
        onPrimaryAction={() => {
          if (takeOverId) onRequestTakeOver?.(takeOverId);
        }}
        onSecondaryAction={() => setTakeOverId(null)}
      />
    </div>
  );
};

export default VendorContractsTable;
