import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import ChangeDetailsSheet from "./ChangeDetailsSheet";
import ProjectsHeader from "./ProjectsHeader";
import { Badge } from "@/components/ui/badge";

export type Project = {
  id: string;
  name: string;
  code?: string;
  budget?: string;
  totalSpend?: string;
  eac?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
};

type Props = {
  projects: Project[];
  detailsProjectId: string | null;
  detailsOpen: boolean;
  onDetailsProjectIdChange: (projectId: string | null) => void;
  onDetailsOpenChange: (open: boolean) => void;
};

const ProjectsTable: React.FC<Props> = ({
  projects,
  detailsProjectId,
  detailsOpen,
  onDetailsOpenChange,
  onDetailsProjectIdChange,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");

  const openDetails = React.useCallback(
    (projectId: string) => {
      onDetailsProjectIdChange(projectId);
      onDetailsOpenChange(true);
    },
    [onDetailsOpenChange, onDetailsProjectIdChange]
  );

  const columns = React.useMemo<ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Projects Name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <a
              href={`/dashboard/project-management/${row.original.id ?? ""}`}
              data-testid="project-name-link"
              className="font-medium text-slate-900 underline-offset-2 hover:underline"
            >
              {row.original.name ?? ""}
            </a>
            {row.original.code && (
              <span className="text-xs text-slate-500">{row.original.code}</span>
            )}
          </div>
        ),
      },
      { accessorKey: "budget", header: "Budget" },
      { accessorKey: "totalSpend", header: "Total Spend" },
      { accessorKey: "eac", header: "EAC" },
      {
        id: "date",
        header: "Date",
        cell: ({ row }) => (
          <div className="text-xs text-slate-500">
            {row.original.startDate && (
              <div>
                Start Date:{" "}
                <span className="font-bold">{row.original.startDate}</span>
              </div>
            )}
            {row.original.endDate && (
              <div>
                End Date:{" "}
                <span className=" font-bold">{row.original.endDate}</span>
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.status === "active"
                ? "bg-green-100 text-green-700 font-semibold capitalize px-4"
                : row.original.status === "completed"
                  ? "bg-blue-100 text-blue-700 font-semibold capitalize px-4"
                  : "bg-red-100 text-red-700 font-semibold capitalize px-4"
            }
          >
            {row.original.status?.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            data-testid="project-actions-dropdown"
            onClick={() => openDetails(row.original.id)}
          >
            ⋮
          </Button>
        ),
      },
    ],
    [openDetails]
  );

  const filtered = projects.filter((p) =>
    searchQuery
      ? p.name?.toLowerCase?.().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="space-y-4" data-testid="projects-table">
      <DataTable<Project>
        header={() => (
          <ProjectsHeader
            title="Projects"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            dateFilter={dateFilter}
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
            onDateFilterChange={setDateFilter}
            onStatusFilterChange={setStatusFilter}
            onCategoryFilterChange={setCategoryFilter}
          />
        )}
        classNames={{
          container:
            "bg-white dark:bg-slate-950 rounded-xl px-3 border border-gray-300 dark:border-slate-600",
          tHeadRow: "bg-gray-300",
        }}
        data={filtered}
        columns={columns}
        options={{ disableSelection: true }}
        emptyPlaceholder={
          <div className="p-10 text-center">
            <div data-testid="empty-state" className="text-slate-600">
              No projects found
            </div>
          </div>
        }
      />

      <ChangeDetailsSheet
        projectId={detailsProjectId ?? undefined}
        open={detailsOpen}
        onOpenChange={(open) => {
          onDetailsOpenChange(open);
          if (!open) onDetailsProjectIdChange(null);
        }}
      />
    </div>
  );
};

export default ProjectsTable;
