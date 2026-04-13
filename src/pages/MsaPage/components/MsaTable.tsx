import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate } from "date-fns";

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
};

const columns: ColumnDef<MsaRow>[] = [
  {
    accessorKey: "title",
    header: "MSA",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-slate-900">{row.original.title}</span>
        <span className="text-xs text-slate-500">{row.original.code}</span>
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
            Published:{" "}
            {formatDate(new Date(row.original.published), "yyyy MMM dd")}
          </div>
        )}
        {row.original.endDate && (
          <div>
            End Date: {formatDate(new Date(row.original.endDate), "yyyy MMM dd")}
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
          ? "bg-green-100 text-green-700"
          : s === "Draft"
            ? "bg-slate-100 text-slate-700"
            : s === "Expired" || s === "Terminated" || s === "Suspended"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"; // Pending Approval
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
          <DropdownMenuItem asChild data-testid="msa-view-details">
            <Link to={`/dashboard/msa/${row.original.id}`}>View Details</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

const MsaTable: React.FC<{ rows?: MsaRow[] }> = ({ rows }) => {
  const [search, setSearch] = React.useState("");
  const data = React.useMemo(() => rows ?? [], [rows]);

  return (
    <div className="space-y-4" data-testid="msa-table">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">
            Master Service Agreement
          </span>
          <Input
            placeholder="Search contract"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="msa-search-input"
            className="h-10 w-[260px]"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10"
                data-testid="msa-date-filter"
              >
                Date <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>Newest</DropdownMenuItem>
              <DropdownMenuItem disabled>Oldest</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10"
                data-testid="msa-status-filter"
              >
                Status <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem data-testid="msa-status-active">
                Active
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Draft</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10"
                data-testid="msa-category-filter"
              >
                Category <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem data-testid="msa-category-software">
                Software
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Construction</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DataTable<MsaRow>
        data={data}
        columns={columns}
        options={{ disableSelection: true }}
      />
    </div>
  );
};

export default MsaTable;
