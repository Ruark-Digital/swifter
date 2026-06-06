import React from "react";
import { format } from "date-fns";
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
import type { ContractClaimDTO } from "../api/contractManagerApi";
import ChangeDetailsSheet from "./ChangeDetailsSheet";

const formatImpact = (item: ContractClaimDTO) => {
  const hasTime = typeof item.time === "number" && Number.isFinite(item.time);
  const hasCost = typeof item.cost === "number" && Number.isFinite(item.cost);
  if (hasTime && hasCost)
    return `$${(item.cost || 0) / 1000000}M + ${item.time} days`;
  if (hasTime) return `${item.time} days`;
  if (hasCost) return `$${(item.cost || 0) / 1000000}M`;
  return "-";
};

function ClaimActionsCell({
  row,
  table,
}: CellContext<ContractClaimDTO, unknown>) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const meta = table.options.meta as
    | {
        contractId?: string;
        basePath?: string;
        listInvalidateQueryKey?: readonly unknown[];
        statsInvalidateQueryKey?: readonly unknown[];
        claimAssignUrlBuilder?: (claimId: string) => string;
      }
    | undefined;
  const contractId = meta?.contractId ?? "";
  const basePath = meta?.basePath ?? "";
  const claimId = row.original.claimId || row.original._id || "";
  const claimAssignUrl = meta?.claimAssignUrlBuilder?.(claimId);
  return (
    <>
      <ChangeDetailsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        changeId={claimId}
        contractId={contractId}
        basePath={basePath}
        listInvalidateQueryKey={meta?.listInvalidateQueryKey}
        statsInvalidateQueryKey={meta?.statsInvalidateQueryKey}
        claimAssignUrl={claimAssignUrl}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">⋮</Button>
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

const columns: ColumnDef<ContractClaimDTO>[] = [
  {
    id: "claimId",
    header: "Claim ID",
    cell: ({ row }) => {
      return row.original.claimId ?? row.original._id ?? "-";
    },
  },
  {
    accessorKey: "title",
    header: "Claim Title",
    cell: ({ getValue }) => {
      const title = getValue<string | undefined>();
      return <span className="font-medium text-slate-900 dark:text-slate-100">{title ?? "-"}</span>;
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ getValue }) => getValue<string | undefined>() ?? "-",
  },
  {
    id: "impact",
    header: "Impact",
    cell: ({ row }) => (
      <span className="font-semibold">{formatImpact(row.original)}</span>
    ),
  },
  {
    accessorKey: "createdAt",
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
      const status = getValue<ContractClaimDTO["status"] | undefined>();
      const label =
        status === "approved"
          ? "Approved"
          : status === "under review"
            ? "Under Review"
            : status === "rejected"
              ? "Rejected"
              : status === "dispute"
                ? "Dispute"
                : "-";
      const tone =
        label === "Approved"
          ? "bg-green-100 text-green-700"
          : label === "Under Review"
            ? "bg-yellow-100 text-yellow-700"
            : label === "Dispute"
              ? "bg-slate-100 text-slate-700"
              : label === "Rejected"
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-700";
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tone}`}>
          {label}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: (ctx) => <ClaimActionsCell {...ctx} />,
  },
];

type ClaimsTableProps = {
  contractId: string;
  basePath: string;
  rows?: ContractClaimDTO[];
  isLoading?: boolean;
  totalCount?: number;
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  listInvalidateQueryKey?: readonly unknown[];
  statsInvalidateQueryKey?: readonly unknown[];
  claimAssignUrlBuilder?: (claimId: string) => string;
};

const ClaimsTable: React.FC<ClaimsTableProps> = ({
  contractId,
  basePath,
  rows = [],
  isLoading,
  totalCount,
  pagination,
  setPagination,
  listInvalidateQueryKey,
  statsInvalidateQueryKey,
  claimAssignUrlBuilder,
}) => {
  const [search, setSearch] = React.useState("");

  const filteredRows = React.useMemo(() => {
    if (!search) return rows;
    const query = search.toLowerCase();
    return rows.filter((row) => {
      return (
        (row.claimId ?? "").toLowerCase().includes(query) ||
        (row.title ?? "").toLowerCase().includes(query) ||
        (row.type ?? "").toLowerCase().includes(query) ||
        (row.status ?? "").toLowerCase().includes(query) ||
        (row.description ?? "").toLowerCase().includes(query)
      );
    });
  }, [rows, search]);

  return (
    <div className="space-y-4" data-testid="claims-table">
      <DataTable<ContractClaimDTO>
        header={() => (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">
                Claims
              </span>
              <Input
                placeholder="Search changes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-[260px]"
                data-testid="search-claims-input"
              />
            </div>
          </div>
        )}
        emptyPlaceholder={
          <div className="rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
            No claims found.
          </div>
        }
        data={filteredRows}
        classNames={{
          container:
            "bg-white dark:bg-slate-950 rounded-xl px-3 border border-gray-300 dark:border-slate-600",
          expandedCell: "px-5",
        }}
        columns={columns}
        options={{
          disableSelection: true,
          isLoading,
          totalCounts: totalCount ?? filteredRows.length,
          manualPagination: true,
          pagination,
          setPagination,
          meta: {
            contractId,
            basePath,
            listInvalidateQueryKey,
            statsInvalidateQueryKey,
            claimAssignUrlBuilder,
          },
        }}
      />
    </div>
  );
};

export default ClaimsTable;

