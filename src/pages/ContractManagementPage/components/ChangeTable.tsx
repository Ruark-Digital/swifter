import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type {
  CellContext,
  ColumnDef,
  PaginationState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import ChangeDetailsSheet from "./ChangeDetailsSheet";
import ApproverChangeDetailsSheet from "./ApproverChangeDetailsSheet";
import type { ContractChangeDTO } from "../api/contractManagerApi";
import { formatChangeTypeLabel } from "../lib/contractChanges";

import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type ChangeTableProps = {
  contractId: string;
  /** Role-prefixed entity path, e.g. `/contract/vendor/contracts/{id}/changes`.
   *  Required for downstream sheets to build correct comment / approve URLs. */
  basePath?: string;
  rows?: ContractChangeDTO[];
  isLoading?: boolean;
  totalCount?: number;
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  variant?: "manager" | "approver";
  listInvalidateQueryKey?: readonly unknown[];
  statsInvalidateQueryKey?: readonly unknown[];
};

type ManagerActionsCellProps = CellContext<ContractChangeDTO, unknown> & {
  contractId: string;
  basePath?: string;
};

function ManagerActionsCell({
  row,
  table,
  contractId,
  basePath,
}: ManagerActionsCellProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const changeId = row.original.changeId || "";
  const meta = table.options.meta as
    | {
        listInvalidateQueryKey?: readonly unknown[];
        statsInvalidateQueryKey?: readonly unknown[];
      }
    | undefined;
  return (
    <>
      <ChangeDetailsSheet
        contractId={contractId}
        changeId={changeId}
        basePath={basePath}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        listInvalidateQueryKey={meta?.listInvalidateQueryKey}
        statsInvalidateQueryKey={meta?.statsInvalidateQueryKey}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            ⋮
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setSheetOpen(true)}>
            View Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

const ChangeTable: React.FC<ChangeTableProps> = ({
  contractId,
  basePath,
  rows = [],
  isLoading,
  totalCount,
  pagination,
  setPagination,
  variant = "manager",
  listInvalidateQueryKey,
  statsInvalidateQueryKey,
}) => {
  const [search, setSearch] = React.useState("");

  const approverColumns: ColumnDef<ContractChangeDTO>[] = React.useMemo(
    () => [
      {
        accessorKey: "changeId",
        header: "Change ID",
        cell: ({ getValue }) => (
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {getValue<string>() ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "title",
        header: "Change Title",
        cell: ({ getValue }) => (
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {getValue<string>() ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ getValue }) => {
          const type = getValue<ContractChangeDTO["type"] | undefined>();
          return <span>{type ? formatChangeTypeLabel(type) : "-"}</span>;
        },
      },
      {
        accessorKey: "value",
        header: "Value",
        cell: ({ getValue }) => {
          const val = getValue<number | undefined>();
          return val ? `$${(val / 1000000).toFixed(2)}M` : "-";
        },
      },
      {
        accessorKey: "submittedAt",
        header: "Submitted",
        cell: ({ getValue }) => {
          const date = getValue<string | undefined>();
          return date ? format(new Date(date), "dd MMM yyyy") : "-";
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue<string | undefined>();
          let className =
            "bg-slate-100 text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300";
          if (status === "approved")
            className =
              "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300";
          if (status === "pending")
            className =
              "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300";
          if (status === "rejected")
            className =
              "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300";

          return (
            <Badge className={`rounded-full px-3 py-1 font-normal ${className}`}>
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : "-"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const changeId = row.original.changeId || "";
          return (
            <ApproverChangeDetailsSheet
              contractId={contractId}
              changeId={changeId}
              basePath={basePath}
              trigger={
                <Button
                  variant="link"
                  className="text-green-600 dark:text-green-400 font-semibold p-0 h-auto hover:no-underline"
                >
                  View
                </Button>
              }
            />
          );
        },
      },
    ],
    [contractId, basePath],
  );

  const managerColumns: ColumnDef<ContractChangeDTO>[] = React.useMemo(
    () => [
      {
        accessorKey: "changeId",
        header: "Change ID",
        cell: ({ getValue }) => {
          const title = getValue<string | undefined>();
          return (
            <span className="font-medium text-slate-900 dark:text-slate-100">{title ?? "-"}</span>
          );
        },
      },
      {
        accessorKey: "title",
        header: "Change Title",
        cell: ({ getValue }) => {
          const title = getValue<string | undefined>();
          return (
            <span className="font-medium text-slate-900 dark:text-slate-100">{title ?? "-"}</span>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ getValue }) => {
          const type = getValue<ContractChangeDTO["type"] | undefined>();
          return <span>{type ? formatChangeTypeLabel(type) : "-"}</span>;
        },
      },
      {
        accessorKey: "urgency",
        header: "Urgency",
        cell: ({ getValue }) => {
          const urgency = getValue<ContractChangeDTO["urgency"] | undefined>();
          if (!urgency) return "-";
          return urgency.charAt(0).toUpperCase() + urgency.slice(1);
        },
      },
      {
        accessorKey: "proposalCategory",
        header: "Proposal Category",
        cell: ({ getValue }) => {
          const category = getValue<string | undefined>();
          return category ?? "-";
        },
      },
      {
        id: "files",
        header: "Files",
        cell: ({ row }) => {
          const count = row.original.files?.length ?? 0;
          return <span className="font-semibold text-slate-900 dark:text-slate-100">{count}</span>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: (ctx) => (
          <ManagerActionsCell
            {...ctx}
            contractId={contractId}
            basePath={basePath}
          />
        ),
      },
    ],
    [contractId, basePath],
  );

  const filteredRows = React.useMemo(() => {
    if (!search) return rows;
    const query = search.toLowerCase();
    return rows.filter((row) => {
      return (
        (row.title ?? "").toLowerCase().includes(query) ||
        (row.description ?? "").toLowerCase().includes(query) ||
        (row.type ?? "").toLowerCase().includes(query) ||
        (row.urgency ?? "").toLowerCase().includes(query) ||
        (row.proposalCategory ?? "").toLowerCase().includes(query)
      );
    });
  }, [rows, search]);

  return (
    <div className="space-y-4" data-testid="changes-table ">
      <DataTable<ContractChangeDTO>
        header={() => (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Changes
              </span>
              <Input
                placeholder="Search changes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-[260px]"
                data-testid="search-changes-input"
              />
            </div>
          </div>
        )}
        emptyPlaceholder={
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-sm text-slate-600 dark:text-slate-400">
            No changes found.
          </div>
        }
        data={filteredRows}
        classNames={{
          container:
            "bg-white dark:bg-slate-950 rounded-xl px-3 border border-gray-300 dark:border-slate-600",
          expandedCell: "px-5",
          tHeader: "bg-transparent dark:bg-slate-900",
          tHeadRow: "border-b border-slate-200 dark:border-slate-700",
          tHead:
            "px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400",
          tBody: "bg-white dark:bg-slate-950",
          tRow: "border-b border-slate-200 dark:border-slate-800",
          tCell:
            "px-3 py-4 text-sm text-slate-700 dark:text-slate-200 align-middle",
        }}
        columns={variant === "approver" ? approverColumns : managerColumns}
        options={{
          disableSelection: true,
          isLoading,
          totalCounts: totalCount ?? filteredRows.length,
          manualPagination: true,
          pagination,
          setPagination,
          meta: { listInvalidateQueryKey, statsInvalidateQueryKey },
        }}
      />
    </div>
  );
};

export default ChangeTable;
