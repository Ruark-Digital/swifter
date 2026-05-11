import { FileText } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { DataTable } from "@/components/layouts/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { formatDateTZ } from "@/lib/utils";

// System log entry type definition based on API response
type SystemLogEntry = {
  _id: string;
  actionType: string;
  performedBy: {
    _id: string;
    name: string;
  };
  targetAffected: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
};

// API response types
type SystemLogResponse = {
  total: number;
  page: number;
  limit: number;
  data: SystemLogEntry[];
};

// Action type badge component
const ActionTypeBadge = ({ actionType }: { actionType: string }) => {
  // const getActionTypeColor = (action: string) => {
  //   switch (action.toLowerCase()) {
  //     case "plan upgraded to enterprise":
  //       return "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/30";
  //     case "plan suspended":
  //       return "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/30";
  //     case "reactivated plan":
  //       return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/30";
  //     case "module disabled":
  //       return "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/30";
  //     case "company suspended":
  //       return "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/30";
  //     default:
  //       return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-800";
  //   }
  // };

  return <span className={` border-0 p-2 px-4`}>{actionType}</span>;
};

// Empty state component
const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 h-full">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
        <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">
        No System Logs Available
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
        System activity logs will appear here when actions are performed.
      </p>
    </div>
  );
};

const SystemLogPage = () => {
  const [searchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset pagination when search changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearchQuery]);

  // Fetch system logs
  const { data: systemLogsData, isLoading } = useQuery<
    ApiResponse<SystemLogResponse>,
    ApiResponseError
  >({
    queryKey: [
      "systemLogs",
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearchQuery,
    ],
    queryFn: async () =>
      await getRequest({
        url: "/admins/system-logs",
        config: {
          params: {
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            search: debouncedSearchQuery || undefined,
          },
        },
      }),
  });

  // Extract data from API responses with fallback mock data
  const systemLogs = systemLogsData?.data?.data?.data || [];
  const totalLogs = systemLogsData?.data?.data?.total || systemLogs.length;

  // Filter data based on search query (for client-side filtering if needed)
  const filteredData = useMemo(() => {
    return systemLogs;
  }, [systemLogs]);

  // Define table columns
  const columns: ColumnDef<SystemLogEntry>[] = [
    {
      accessorKey: "createdAt",
      header: "Date Created",
      cell: ({ row }) => {
        const formattedDate = formatDateTZ(row.original.createdAt, 'MM/dd/yyyy, h:mm a');
         return (
           <span className="text-sm text-gray-700 dark:text-gray-300">
             {formattedDate}
           </span>
         );
      },
    },
    {
      accessorKey: "actionType",
      header: "Action Type",
      cell: ({ row }) => (
        <ActionTypeBadge actionType={row.original.actionType} />
      ),
    },
    {
      accessorKey: "performedBy",
      header: "Performed By",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.original.performedBy.name}
        </span>
      ),
    },
    {
      accessorKey: "targetAffected",
      header: "Target/Affected",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.original.targetAffected.name}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            System Log
          </h1>
        </div>
      </div>

      {/* Search and Filter */}

      {/* System Logs Table */}
      <DataTable
        data={filteredData}
        columns={columns}
        classNames={{
          container: "border border-gray-200 dark:border-slate-600 rounded-lg",
          tHeadRow: "bg-gray-300",
          tCell: "text-center",
          tHead: "text-center",
        }}
        options={{
          manualPagination: true,
          setPagination: setPagination,
          pagination: pagination,
          totalCounts: totalLogs,
          isLoading: isLoading,
        }}
        emptyPlaceholder={<EmptyState />}
      />
    </div>
  );
};

export default SystemLogPage;
