import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import type { Group, EvaluatorElement } from "../SolicitationDetailPage";

type EvaluatorsGroupSubTableProps = {
  group: Group;
  columns: ColumnDef<EvaluatorElement>[];
  isLoading?: boolean;
};

export const EvaluatorsGroupSubTable: React.FC<EvaluatorsGroupSubTableProps> = ({
  group,
  columns,
  isLoading,
}) => {
  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between py-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">
            {group.groupName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {group.totalEvaluators} evaluators • {group.completedEvaluators} completed
          </span>
        </div>
        {typeof group.groupCompletionRate === "number" && (
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Completion: {Number(group.groupCompletionRate).toFixed(0)}%
          </span>
        )}
      </div>

      <DataTable
        data={group.evaluators || []}
        columns={columns}
        classNames={{
          container:
            "bg-transparent border-0 rounded-none",
        }}
        options={{
          disableSelection: true,
          disablePagination: true,
          isLoading: !!isLoading,
          totalCounts: group.evaluators?.length || 0,
          manualPagination: false,
          setPagination: () => {},
          pagination: { pageIndex: 0, pageSize: 10 },
        }}
        emptyPlaceholder={
          <div className="py-4 px-2 text-sm text-gray-500 dark:text-gray-400">
            No evaluators in this group.
          </div>
        }
      />
    </div>
  );
};

export default EvaluatorsGroupSubTable;