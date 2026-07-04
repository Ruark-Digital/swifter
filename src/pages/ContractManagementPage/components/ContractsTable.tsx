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
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@/store/authSlice";
import EditContract from "./EditContract";
import ContractLifecycleDialog from "./ContractLifecycleDialog";
import {
  type LifecycleAction,
  isEditableStatus,
  availableLifecycleActions,
} from "./contractLifecycle";

// Shared "which row's action menu is open" state, read via context instead
// of being threaded through the memoized column/cell definitions below.
// Context reads don't participate in useMemo's dependency array, so this
// still lets only one row's dropdown be open at a time — without forcing
// every row's ContractActionsCell to remount (and lose its editOpen/
// lifecycle dialog state) every time any menu opens or closes.
const OpenRowMenuContext = React.createContext<{
  openRowId: string | null;
  setOpenRowId: (id: string | null) => void;
}>({ openRowId: null, setOpenRowId: () => {} });

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
  createdAtRaw?: string;
  status:
    | "Active"
    | "Published"
    | "Draft"
    | "Expired"
    | "Terminated"
    | "Suspended"
    | "Completed"
    | "Cancelled"
    | "Pending Approval";
  category?: string;
  /** Creator `_id` — fallback for owner-based action gating when the BE
   *  `owner` boolean is absent. */
  ownerId?: string;
  /** BE-computed ownership for the current user (the `owner` field on the
   *  contract list payload). Preferred over id-matching. */
  isOwner?: boolean;
};

const ContractActionsCell: React.FC<{
  row: ContractRow;
}> = ({ row }) => {
  const { isManager } = useUserRole();
  const currentUserId = useUser()?._id;
  // The "only one row's menu open at a time" behavior is read from context
  // rather than threaded through the memoized column defs — that previously
  // forced every row's ContractActionsCell to remount on every menu open/
  // close, wiping the `editOpen`/`lifecycle` state below before the deferred
  // dialog-open callback ran, making Edit/Manage/Terminate silently no-op
  // (QA 260703 #162 investigation).
  const { openRowId, setOpenRowId } = React.useContext(OpenRowMenuContext);
  const menuOpen = openRowId === row.id;
  const setMenuOpen = React.useCallback(
    (open: boolean) => setOpenRowId(open ? row.id : null),
    [row.id, setOpenRowId],
  );
  const [editOpen, setEditOpen] = React.useState(false);
  const [lifecycle, setLifecycle] = React.useState<LifecycleAction | null>(null);

  // Prefer the BE-computed `owner` flag; fall back to id-matching only when it
  // is absent (e.g. MSA payloads that don't yet expose it).
  const isOwner =
    typeof row.isOwner === "boolean"
      ? row.isOwner
      : !!currentUserId && !!row.ownerId && currentUserId === row.ownerId;
  const lifecycleActions = availableLifecycleActions(row.status);
  const canEdit = isManager && isOwner && isEditableStatus(row.status);
  const canManage = isManager && !isOwner;
  const showTerminate = isManager && isOwner && lifecycleActions.includes("terminate");
  const showSuspend = isManager && isOwner && lifecycleActions.includes("suspend");
  const showComplete = isManager && isOwner && lifecycleActions.includes("complete");

  // Close the menu before opening a controlled dialog so the dropdown doesn't
  // linger behind it or fight the dialog for focus. Deferring the dialog's
  // open to the next frame avoids a Radix DismissableLayer race: if the
  // dialog mounts in the same tick the dropdown is closing, the dropdown's
  // own outside-pointer/close handling can be misattributed to the dialog,
  // making it appear to open and instantly close with no console error.
  const openLifecycle = (a: LifecycleAction) => {
    setMenuOpen(false);
    requestAnimationFrame(() => setLifecycle(a));
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" data-testid="project-actions-dropdown">
            ⋮
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              to={`/dashboard/contract-management/${row.id}`}
              data-testid="view-contract-detail"
            >
              View Contract
            </Link>
          </DropdownMenuItem>
          {canManage && (
            <DropdownMenuItem
              data-testid="manage-contract"
              onSelect={(e) => {
                e.preventDefault();
                openLifecycle("manage");
              }}
            >
              Manage Contract
            </DropdownMenuItem>
          )}
          {canEdit && (
            <DropdownMenuItem
              data-testid="edit-contract"
              onSelect={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                requestAnimationFrame(() => setEditOpen(true));
              }}
            >
              Edit Contract
            </DropdownMenuItem>
          )}
          {showComplete && (
            <DropdownMenuItem
              data-testid="complete-contract"
              onSelect={(e) => {
                e.preventDefault();
                openLifecycle("complete");
              }}
            >
              Complete Contract
            </DropdownMenuItem>
          )}
          {showSuspend && (
            <DropdownMenuItem
              data-testid="suspend-contract"
              onSelect={(e) => {
                e.preventDefault();
                openLifecycle("suspend");
              }}
            >
              Suspend Contract
            </DropdownMenuItem>
          )}
          {showTerminate && (
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              data-testid="terminate-contract"
              onSelect={(e) => {
                e.preventDefault();
                openLifecycle("terminate");
              }}
            >
              Terminate Contract
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditContract
        open={editOpen}
        onOpenChange={setEditOpen}
        contractId={row.id}
      />
      <ContractLifecycleDialog
        kind="contract"
        id={row.id}
        title={row.title}
        action={lifecycle}
        open={lifecycle !== null}
        onOpenChange={(o) => {
          if (!o) setLifecycle(null);
        }}
      />
    </>
  );
};

const columns: ColumnDef<ContractRow>[] = [
  {
    accessorKey: "title",
    header: "Contracts",
    cell: ({ row }) => (
      <div className="flex flex-col max-w-[320px] min-w-0">
        <a
          href={`/dashboard/contract-management/${row.original.id}`}
          data-testid="project-name-link"
          title={row.original.title}
          className="block truncate font-medium text-slate-900 dark:text-slate-100 underline-offset-2 hover:underline"
        >
          {row.original.title}
        </a>
        <span className="truncate text-xs text-slate-500 dark:text-slate-400">
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
            <span className="text-black dark:text-slate-100 font-bold">Published:</span>{" "}
            {row.original.published}
          </div>
        )}
        {row.original.endDate && (
          <div>
            <span className="text-black dark:text-slate-100 font-bold">End Date:</span>{" "}
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
        s === "Active" || s === "Published"
          ? "bg-green-100 text-green-700"
          : s === "Draft"
            ? "bg-slate-100 text-slate-700"
            : s === "Pending Approval"
              ? "bg-yellow-100 text-yellow-700"
              : s === "Completed"
                ? "bg-blue-100 text-blue-700"
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
    cell: () => null,
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

const applyDateFilter = (rows: ContractRow[], dateFilter: string): ContractRow[] => {
  if (!dateFilter || dateFilter === "all") return rows;
  const now = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOf(now);
  return rows.filter((row) => {
    if (!row.createdAtRaw) return true;
    const created = new Date(row.createdAtRaw);
    if (dateFilter === "today") return startOf(created).getTime() === today.getTime();
    if (dateFilter === "last7days") return created >= new Date(today.getTime() - 6 * 86400000);
    if (dateFilter === "last30days") return created >= new Date(today.getTime() - 29 * 86400000);
    return true;
  });
};

const ContractsTable: React.FC<ContractsTableProps> = ({
  rows = [],
  isLoading,
  totalCount,
  isReadOnly,
  disableActions,
  pagination: paginationProp,
  setPagination: setPaginationProp,
  statusFilter = "all",
  onStatusFilterChange,
}) => {
  const [search, setSearch] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState("all");
  const [openRowId, setOpenRowId] = React.useState<string | null>(null);
  const openRowMenuContextValue = React.useMemo(
    () => ({ openRowId, setOpenRowId }),
    [openRowId],
  );
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
    if (isReadOnly || disableActions) {
      return columns.filter((column) => column.id !== "actions");
    }

    return columns.map((column) => {
      if (column.id !== "actions") {
        return column;
      }

      return {
        ...column,
        cell: ({ row }: { row: { original: ContractRow } }) => (
          <ContractActionsCell row={row.original} />
        ),
      };
    });
  }, [isReadOnly, disableActions]);

  const filteredRows = React.useMemo(() => {
    let result = rows;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter((row) =>
        row.title.toLowerCase().includes(query) ||
        row.code.toLowerCase().includes(query),
      );
    }

    if (statusFilter && statusFilter !== "all") {
      const normalizedFilter = normalizeStatus(statusFilter);
      result = result.filter((row) => {
        const normalizedRowStatus = normalizeStatus(row.status);
        // "Active" contracts are labelled "Published" once live — treat the
        // "Active" filter as matching both so it returns real contracts.
        if (normalizedFilter === "active") {
          return (
            normalizedRowStatus === "active" ||
            normalizedRowStatus === "published"
          );
        }
        return normalizedRowStatus === normalizedFilter;
      });
    }

    result = applyDateFilter(result, dateFilter);

    return result;
  }, [rows, search, statusFilter, dateFilter, normalizeStatus]);

  const selectedFilterValues: Record<string, string> = {
    Status: statusFilter ?? "all",
    Date: dateFilter,
  };

  const handleFilterChange = (filterTitle: string, value: string) => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    if (filterTitle === "Status") {
      onStatusFilterChange?.(value);
    } else if (filterTitle === "Date") {
      setDateFilter(value);
    }
  };

  return (
    <div data-testid="contracts-table">
      <OpenRowMenuContext.Provider value={openRowMenuContextValue}>
      <DataTable<ContractRow>
        header={() => (
          <div className="flex flex-wrap items-center w-full justify-between gap-3 border-b border-[#E9E9EB] dark:border-slate-600 p-3 pt-0">
            <div className="flex flex-wrap items-center gap-3 w-full">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
                  className="h-10 w-full sm:w-[260px] min-w-0"
                  disabled={isReadOnly}
                />
              </div>
              <div
                className={
                  isReadOnly
                    ? "sm:ml-auto flex flex-wrap items-center gap-2 pointer-events-none opacity-60"
                    : "sm:ml-auto flex flex-wrap items-center gap-2"
                }
                aria-disabled={isReadOnly}
              >
                <DropdownFilters
                  filters={[
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
                  ]}
                  onFilterChange={handleFilterChange}
                  selectedValues={selectedFilterValues}
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
      </OpenRowMenuContext.Provider>
    </div>
  );
};

export default ContractsTable;
