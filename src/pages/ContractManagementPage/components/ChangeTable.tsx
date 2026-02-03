import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import ChangeDetailsSheet from "./ChangeDetailsSheet";
import type { ContractChangeDTO } from "../api/contractManagerApi";
import { formatChangeTypeLabel } from "../lib/contractChanges";

const columns: ColumnDef<ContractChangeDTO>[] = [
  {
    accessorKey: "title",
    header: "Change Title",
    cell: ({ getValue }) => {
      const title = getValue<string | undefined>();
      return <span className="font-medium text-slate-900">{title ?? "-"}</span>;
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
      return <span className="font-semibold text-slate-900">{count}</span>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            ⋮
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <ChangeDetailsSheet
              trigger={
                <a href="#" data-testid="view-change-detail p-4">
                  View Details
                </a>
              }
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

type ChangeTableProps = {
  rows?: ContractChangeDTO[];
  isLoading?: boolean;
  totalCount?: number;
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
};

const ChangeTable: React.FC<ChangeTableProps> = ({
  rows = [],
  isLoading,
  totalCount,
  pagination,
  setPagination,
}) => {
  const [search, setSearch] = React.useState("");

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
              <span className="text-sm font-medium text-slate-700">
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
          <div className="rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
            No changes found.
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
        }}
      />
    </div>
  );
};

export default ChangeTable;
