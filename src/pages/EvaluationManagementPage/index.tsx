import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  differenceInDays,
  toDate,
} from "date-fns";
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CreateEvaluationDialog from "./components/CreateEvaluationDialog";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import { useToastHandler } from "@/hooks/useToaster";
import { StatCard } from "./components/StatCard";
import { useUserRole } from "@/hooks/useUserRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createExpandButton,
  DataTable,
  hasChildren,
} from "@/components/layouts/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  useEvaluationDashboard,
  useEvaluationsList,
  useMyEvaluationsList,
  useAssignedEvaluationsList,
  useManageEvaluation,
  type EvaluationApiResponse,
  type AssignedEvaluationApiResponse,
} from "./hooks/useEvaluationApi";
import { StatusBadge } from "./components/StatusBadge";
import { EmptyState } from "./components/EmptyState";
import { SearchInput } from "@/components/layouts/SearchInput";
import { DropdownFilters } from "@/components/layouts/SolicitationFilters";
import { normalizeEvaluationStatus } from "@/lib/evaluationStatusUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTZ } from "@/lib/utils";
import { useUser } from "@/store/authSlice";

// Evaluation type definition
type Evaluation = {
  id: string;
  name: string;
  solicitationId: string;
  type: string;
  deadline: string;
  deadlineRaw: string;
  daysLeft: number;
  status: string;
  owner: boolean;
  timezone: string;
  solId: string;
  completionDate?: string;
};

// Assigned Evaluation type definition
type AssignedEvaluation = {
  id: string;
  name: string;
  solicitationId: string;
  type: string;
  evaluationGroup: string;
  groupId: string;
  assignedDate: string;
  deadline: string;
  progress: number;
  status: string;
  // Include groups for expansion
  evaluationGroups?: AssignedEvaluationApiResponse["evaluationGroups"];
};

// Helper function to safely format dates with validation
const safeFormatDate = (
  dateInput: any,
  pattern: string,
  fallback: string = "N/A",
  timezone?: string
): string => {
  if (!dateInput) return fallback;

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return fallback;
  }

  const v = formatDateTZ(dateInput, pattern, timezone);
  return v;
};

// Helper function to calculate days left (negative values indicate overdue)
const calculateDaysLeft = (deadline: string): number => {
  if (!deadline) return 0;

  const deadlineDate = toDate(deadline);
  if (isNaN(deadlineDate.getTime())) return 0;

  const today = new Date();
  return differenceInDays(deadlineDate, today);
};

// Transform API data to component format
const transformEvaluationData = (
  apiData: { evaluations: EvaluationApiResponse[]; total: number } | undefined
): Evaluation[] => {
  if (!apiData || !Array.isArray(apiData.evaluations)) {
    return [];
  }

  return apiData.evaluations.map((item) => ({
    id: item._id,
    name: item.solicitationName,
    solicitationId: item._id,
    type: item.solicitationType,
    deadline: safeFormatDate(
      item.endDate,
      "MMMM dd, yyyy, KK:mm a",
      "N/A",
      item.timezone
    ),
    deadlineRaw: item.endDate,
    daysLeft: calculateDaysLeft(item.endDate),
    status: item.status as "Active" | "Pending" | "Completed",
    owner: item.owner,
    timezone: item.timezone,
    solId: item.solId,
    completionDate: item.completionDate,
  }));
};

// Transform API data to assigned evaluation format
const transformAssignedEvaluationData = (
  apiData: AssignedEvaluationApiResponse[] | undefined
): AssignedEvaluation[] => {
  if (!apiData || !Array.isArray(apiData)) {
    return [];
  }

  return apiData.map((item) => {
    // Determine status based on progress
    let status: "Active" | "Pending" | "Completed" = "Active";
    if (item.averageProgress === 100) {
      status = "Completed";
    } else if (item.averageProgress === 0) {
      status = "Pending";
    }

    return {
      id: item._id,
      solId: item.solicitationId,
      name: item.solicitationTitle || item.solicitationName,
      solicitationId: item.solicitationId,
      type: item.solicitationType,
      evaluationGroup: item.evaluationGroups?.[0]?.name || "No Group Assigned",
      groupId: item.evaluationGroups?.[0]?._id || "",
      assignedDate: safeFormatDate(
        item.evaluationGroups?.[0]?.assignedOn,
        "MMM dd, yyyy KK:mm a",
        "N/A"
      ),
      timezone: item.timezone,
      deadline: safeFormatDate(item.endDate, "MMM dd, yyyy KK:mm a", "N/A"),
      progress: Math.round(item.averageProgress || 0),
      status,
      // Preserve groups for expansion
      evaluationGroups: item.evaluationGroups || [],
    };
  });
};

export const EvaluationManagementPage = () => {
  const user = useUser();
  const navigate = useNavigate();
  const { isProcurement, isEvaluator, isCompanyAdmin } = useUserRole();
  const [searchParams] = useSearchParams();
  const manageEvaluationMutation = useManageEvaluation();
  const { success: successToast, error: errorToast } = useToastHandler();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [activeStatCard, setActiveStatCard] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Date range picker states - separate for each tab
  const [allEvaluationsDateRange, setAllEvaluationsDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({ startDate: undefined, endDate: undefined });
  const [myEvaluationsDateRange, setMyEvaluationsDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({ startDate: undefined, endDate: undefined });
  const [assignedEvaluationsDateRange, setAssignedEvaluationsDateRange] =
    useState<{
      startDate?: Date;
      endDate?: Date;
    }>({ startDate: undefined, endDate: undefined });

  const [allEvaluationsDateFilter, setAllEvaluationsDateFilter] =
    useState<string>("all");
  const [myEvaluationsDateFilter, setMyEvaluationsDateFilter] =
    useState<string>("all");
  const [assignedEvaluationsDateFilter, setAssignedEvaluationsDateFilter] =
    useState<string>("all");

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>();
  const [activeTab, setActiveTab] = useState<string>(
    isEvaluator
      ? "assigned_evaluation"
      : isCompanyAdmin
      ? "all_evaluations"
      : "all_evaluations"
  );

  // Initialize filters from URL parameters
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (
      statusParam &&
      ["active", "pending", "completed"].includes(
        normalizeEvaluationStatus(statusParam)
      )
    ) {
      setStatusFilter(statusParam);
      setActiveStatCard(statusParam);
    }
  }, [searchParams]);

  // API Queries
  const { data: dashboardStats } = useEvaluationDashboard();

  // Helper function to format date range for API
  const getDateParam = (
    dateFilter: string,
    dateRange: { startDate?: Date; endDate?: Date }
  ) => {
    if (!dateFilter || dateFilter === "all") return undefined;

    if (dateFilter === "custom" && dateRange.startDate && dateRange.endDate) {
      return `${format(dateRange.startDate, "yyyy/MM/dd")}-${format(
        dateRange.endDate,
        "yyyy/MM/dd"
      )}`;
    }

    if (dateFilter === "today") {
      const today = format(new Date(), "yyyy/MM/dd");
      return `${today}-${today}`;
    }

    if (dateFilter === "last7days") {
      const endDate = format(new Date(), "yyyy/MM/dd");
      const startDate = format(subDays(new Date(), 7), "yyyy/MM/dd");
      return `${startDate}-${endDate}`;
    }

    if (dateFilter === "last30days") {
      const endDate = format(new Date(), "yyyy/MM/dd");
      const startDate = format(subDays(new Date(), 30), "yyyy/MM/dd");
      return `${startDate}-${endDate}`;
    }

    return undefined;
  };

  // Tab-specific date param getters
  const getAllEvaluationsDateParam = () =>
    getDateParam(allEvaluationsDateFilter, allEvaluationsDateRange);
  const getMyEvaluationsDateParam = () =>
    getDateParam(myEvaluationsDateFilter, myEvaluationsDateRange);
  const getAssignedEvaluationsDateParam = () =>
    getDateParam(assignedEvaluationsDateFilter, assignedEvaluationsDateRange);

  const { data: evaluationsResponse, isLoading: isEvaluationsLoading } =
    useEvaluationsList(
      {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        name: debouncedSearchQuery || undefined,
        status: statusFilter || undefined,
        date: getAllEvaluationsDateParam(),
      },
      user?._id
    );

  const { data: myEvaluationsResponse, isLoading: isMyEvaluationsLoading } =
    useMyEvaluationsList(
      {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        name: debouncedSearchQuery || undefined,
        status: statusFilter || undefined,
        date: getMyEvaluationsDateParam(),
      },
      user?._id
    );

  // Removed useEvaluatorMyEvaluations as it's redundant with useAssignedEvaluationsList

  const {
    data: assignedEvaluationsResponse,
    isLoading: isAssignedEvaluationsLoading,
  } = useAssignedEvaluationsList(
    {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      status: statusFilter || undefined,
      date: getAssignedEvaluationsDateParam(),
    },
    user?._id
  );

  // Transform API data
  const evaluationData = useMemo(() => {
    if (!evaluationsResponse?.data) return [];
    return transformEvaluationData(evaluationsResponse.data);
  }, [evaluationsResponse]);

  const myEvaluationData = useMemo(() => {
    // if (isEvaluator) {
    //   if (!assignedEvaluationsResponse?.data) return [];
    //   return transformAssignedEvaluationData(assignedEvaluationsResponse.data.data);
    // }
    if (!myEvaluationsResponse?.data) return [];
    return transformEvaluationData(myEvaluationsResponse.data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEvaluationsResponse, assignedEvaluationsResponse, isEvaluator]);

  // Statistics with fallback to default values
  const evaluationStats = useMemo(() => {
    if (dashboardStats) {
      return {
        allEvaluations: dashboardStats.total || 0,
        activeEvaluations: dashboardStats.active || 0,
        pendingEvaluations: dashboardStats.pending || 0,
        completedEvaluations: dashboardStats.completed || 0,
      };
    }
    // Fallback values
    return {
      allEvaluations: 0,
      activeEvaluations: 0,
      pendingEvaluations: 0,
      completedEvaluations: 0,
    };
  }, [dashboardStats]);

  // Handle stat card click for filtering
  const handleStatCardClick = (cardType: string) => {
    setActiveStatCard(cardType);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));

    switch (cardType) {
      case "all":
        setStatusFilter("");
        break;
      case "active":
        setStatusFilter("active");
        break;
      case "pending":
        setStatusFilter("pending");
        break;
      case "completed":
        setStatusFilter("completed");
        break;
      default:
        setStatusFilter("");
    }
  };

  // Handle manage evaluation
  const handleManageEvaluation = async (evaluationId: string) => {
    try {
      await manageEvaluationMutation.mutateAsync(evaluationId);
      successToast("Evaluation management taken over successfully!", "success");
    } catch (error) {
      errorToast("Failed to take over evaluation management");
    }
  };

  // Clear active stat card when search is used
  useEffect(() => {
    if (searchQuery) {
      setActiveStatCard("");
    }
  }, [searchQuery]);

  // Debounced search effect - only trigger API calls after 3+ characters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 3 || searchQuery.length === 0) {
        setDebouncedSearchQuery(searchQuery);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [statusFilter]);

  // Get current tab's date filter state and setters
  const getCurrentTabDateState = () => {
    switch (activeTab) {
      case "all_evaluations":
        return {
          dateFilter: allEvaluationsDateFilter,
          setDateFilter: setAllEvaluationsDateFilter,
          dateRange: allEvaluationsDateRange,
          setDateRange: setAllEvaluationsDateRange,
        };
      case "my_evaluations":
        return {
          dateFilter: myEvaluationsDateFilter,
          setDateFilter: setMyEvaluationsDateFilter,
          dateRange: myEvaluationsDateRange,
          setDateRange: setMyEvaluationsDateRange,
        };
      case "assigned_evaluation":
        return {
          dateFilter: assignedEvaluationsDateFilter,
          setDateFilter: setAssignedEvaluationsDateFilter,
          dateRange: assignedEvaluationsDateRange,
          setDateRange: setAssignedEvaluationsDateRange,
        };
      default:
        return {
          dateFilter: allEvaluationsDateFilter,
          setDateFilter: setAllEvaluationsDateFilter,
          dateRange: allEvaluationsDateRange,
          setDateRange: setAllEvaluationsDateRange,
        };
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    const { setDateFilter, setDateRange } = getCurrentTabDateState();
    setDateFilter("all");
    setDateRange({ startDate: undefined, endDate: undefined });
    setPagination({ pageIndex: 0, pageSize: 10 });
  };

  // Date filter handlers
  const handleDateFilterChange = (value: string) => {
    const { setDateFilter, setDateRange } = getCurrentTabDateState();
    setDateFilter(value);
    setPagination({ pageIndex: 0, pageSize: 10 });

    if (value === "today") {
      const today = new Date();
      setDateRange({ startDate: today, endDate: today });
    } else if (value === "last7days") {
      const endDate = new Date();
      const startDate = subDays(endDate, 7);
      setDateRange({ startDate, endDate });
    } else if (value === "last30days") {
      const endDate = new Date();
      const startDate = subDays(endDate, 30);
      setDateRange({ startDate, endDate });
    } else if (value === "custom") {
      setIsDatePickerOpen(true);
      setTempDateRange(undefined);
    } else {
      setDateRange({ startDate: undefined, endDate: undefined });
    }
  };

  const handleDateRangeConfirm = () => {
    const { setDateRange } = getCurrentTabDateState();
    if (tempDateRange?.from && tempDateRange?.to) {
      setDateRange({
        startDate: startOfDay(tempDateRange.from),
        endDate: endOfDay(tempDateRange.to),
      });
      setPagination({ pageIndex: 0, pageSize: 10 });
    }
    setIsDatePickerOpen(false);
  };

  const handleDateRangeCancel = () => {
    const { dateRange, setDateFilter } = getCurrentTabDateState();
    setIsDatePickerOpen(false);
    if (!dateRange.startDate || !dateRange.endDate) {
      setDateFilter("all");
    }
  };

  // Tab change handler
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const assignedEvaluationData = useMemo(() => {
    if (!assignedEvaluationsResponse?.data.data) return [];
    return transformAssignedEvaluationData(
      assignedEvaluationsResponse.data.data
    );
  }, [assignedEvaluationsResponse]);

  // Define table columns
  const columns: ColumnDef<Evaluation>[] = [
    {
      accessorKey: "name",
      header: "Solicitation Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {row.original.solId} • {row.original.type}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "deadline",
      header: "Date",
      cell: ({ row }) => {
        const isCompleted = row.original.status === "completed";
        const completionDate = row.original.completionDate;
        const deadlineRaw = row.original.deadlineRaw;

        let secondary: JSX.Element;

        if (isCompleted && completionDate && deadlineRaw) {
          const formattedDeadline = format(
            deadlineRaw,
            "yyyy-MM-dd'T'HH:mm:ss"
          );
          const formattedCompletionDate = format(
            completionDate,
            "yyyy-MM-dd'T'HH:mm:ss"
          );

          const end = new Date(formattedDeadline);
          const completed = new Date(formattedCompletionDate);

          // console.log(row.original.name, {
          //   formattedCompletionDate,
          //   formattedDeadline,
          //   end: end.toString(),
          //   completed: completed.toString(),
          // });

          if (!isNaN(end.getTime()) && !isNaN(completed.getTime())) {
            const delta = differenceInDays(end, completed);
            if (delta === 0) {
              secondary = (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Completed on time
                </span>
              );
            } else if (delta > 0) {
              secondary = (
                <span className="text-sm text-green-600 font-medium">
                  Completed {delta} days early
                </span>
              );
            } else {
              secondary = (
                <span className="text-sm text-red-600 font-medium">
                  Completed {Math.abs(delta)} days late
                </span>
              );
            }
          } else {
            secondary = (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Completed
              </span>
            );
          }
        } else {
          secondary = (
            <span
              className={
                row.original.daysLeft < 0
                  ? "text-sm text-red-600 font-medium"
                  : "text-sm text-gray-500 dark:text-gray-400 font-medium"
              }
            >
              Days Left: {row.original.daysLeft} days
            </span>
          );
        }

        return (
          <div className="flex flex-col">
            <span className="text-sm">Deadline: {row.original.deadline}</span>
            {secondary}
          </div>
        );
      },
    },
    {
      accessorKey: "timezone",
      header: "Timezone",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-800"
            onClick={() => navigate(`/dashboard/evaluation/${row.original.id}`)}
          >
            View
          </Button>
          {!row.original.owner && (
            <ConfirmAlert
              type="info"
              title="Take Over Evaluation"
              text={`Are you sure you want to take over the evaluation for "${row.original.name}"? This will make you the manager of this evaluation.`}
              primaryButtonText="Take Over"
              secondaryButtonText="Cancel"
              onPrimaryAction={() => handleManageEvaluation(row.original.id)}
              isLoading={manageEvaluationMutation.isPending}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-800"
                >
                  Manage
                </Button>
              }
            />
          )}
        </div>
      ),
    },
  ];

  const myEvaluationColumns: ColumnDef<Evaluation>[] = [
    {
      accessorKey: "name",
      header: "Solicitation Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {row.original.solId} • {row.original.type}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "deadline",
      header: "Date",
      cell: ({ row }) => {
        const isCompleted = row.original.status === "completed";
        const completionDate = row.original.completionDate;
        const deadlineRaw = row.original.deadlineRaw;

        let secondary: JSX.Element;

        if (isCompleted && completionDate && deadlineRaw) {
          const formattedDeadline = format(
            deadlineRaw,
            "yyyy-MM-dd'T'HH:mm:ss"
          );
          const formattedCompletionDate = format(
            completionDate,
            "yyyy-MM-dd'T'HH:mm:ss"
          );

          const end = new Date(formattedDeadline);
          const completed = new Date(formattedCompletionDate);

          if (!isNaN(end.getTime()) && !isNaN(completed.getTime())) {
            const delta = differenceInDays(end, completed);
            if (delta === 0) {
              secondary = (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Completed on time
                </span>
              );
            } else if (delta > 0) {
              secondary = (
                <span className="text-sm text-green-600 font-medium">
                  Completed {delta} days early
                </span>
              );
            } else {
              secondary = (
                <span className="text-sm text-red-600 font-medium">
                  Completed {Math.abs(delta)} days late
                </span>
              );
            }
          } else {
            secondary = (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Completed
              </span>
            );
          }
        } else {
          secondary = (
            <span className="text-sm text-red-600 font-medium">
              Days Left: {row.original.daysLeft} days
            </span>
          );
        }

        return (
          <div className="flex flex-col">
            <span className="text-sm">Deadline: {row.original.deadline}</span>
            {secondary}
          </div>
        );
      },
    },
    {
      accessorKey: "timezone",
      header: "Timezone",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-800"
            onClick={() => navigate(`/dashboard/evaluation/${row.original.id}`)}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  // Define assigned evaluation table columns
  const assignedEvaluationColumns: ColumnDef<AssignedEvaluation>[] = [
    {
      accessorKey: "name",
      header: "Solicitation Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {row.original.name}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {row.original.solicitationId} • {row.original.type}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "evaluationGroups",
      header: "Evaluation Group",
      cell: ({ row }) => {
        const groups = row.original.evaluationGroups || [];
        const names = Array.isArray(groups)
          ? groups.map((g) => g?.name).filter(Boolean)
          : [];
        const text = names.length
          ? names.join(", ")
          : row.original.evaluationGroup || "No Group Assigned";
        return (
          <div
            className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-[280px]"
            title={text}
          >
            {text}
          </div>
        );
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span className="text-blue-600 dark:text-blue-400">
            Assigned: {row.original.assignedDate}
          </span>
          <span className="text-blue-600 dark:text-blue-400">
            Deadline: {row.original.deadline}
          </span>
        </div>
      ),
    },
     {
      accessorKey: "timezone",
      header: "Timezone",
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => (
        <span className="font-medium">
          {Number(row.original.progress).toFixed(0)}%
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => createExpandButton(row),
    },
  ];

  return (
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold dark:text-gray-100 text-gray-800 mb-1">
            Evaluations
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {isProcurement && <CreateEvaluationDialog />}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="All Evaluations"
          value={evaluationStats.allEvaluations ?? 0}
          icon={FileText}
          iconColor="text-gray-600"
          iconBgColor="bg-gray-100"
          onClick={() => handleStatCardClick("all")}
          isActive={activeStatCard === "all"}
        />
        <StatCard
          title="Active Evaluations"
          value={evaluationStats.activeEvaluations}
          icon={FileText}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          onClick={() => handleStatCardClick("active")}
          isActive={activeStatCard === "active"}
        />
        <StatCard
          title="Pending Evaluations"
          value={evaluationStats.pendingEvaluations}
          icon={FileText}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
          onClick={() => handleStatCardClick("pending")}
          isActive={activeStatCard === "pending"}
        />
        <StatCard
          title="Completed Evaluations"
          value={evaluationStats.completedEvaluations}
          icon={FileText}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          onClick={() => handleStatCardClick("completed")}
          isActive={activeStatCard === "completed"}
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full bg-transparent"
      >
        <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 !bg-transparent p-0 w-full justify-start">
          {(isProcurement || isCompanyAdmin) && (
            <TabsTrigger
              value="all_evaluations"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              All Evaluations
            </TabsTrigger>
          )}
          {isProcurement && (
            <TabsTrigger
              value="my_evaluations"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              My Evaluations
            </TabsTrigger>
          )}
          {!isCompanyAdmin && (
            <TabsTrigger
              value="assigned_evaluation"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Assigned Evaluations
            </TabsTrigger>
          )}
        </TabsList>

        {(isProcurement || isCompanyAdmin) && (
          <TabsContent value="all_evaluations">
            {/* Search and Filter Section */}
            <div className="mt-6">
              <DataTable
                header={() => (
                  <Header
                    title="All Evaluations"
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    debouncedSearchQuery={debouncedSearchQuery}
                    dateFilter={allEvaluationsDateFilter}
                    statusFilter={statusFilter}
                    onDateFilterChange={handleDateFilterChange}
                    onStatusFilterChange={setStatusFilter}
                    onClearFilters={handleClearFilters}
                    totalCount={evaluationsResponse?.data?.total || 0}
                    tabType="all_evaluations"
                  />
                )}
                emptyPlaceholder={<EmptyState />}
                classNames={{
                  container:
                    "bg-white dark:bg-slate-950 rounded-xl px-3 border border-gray-300 dark:border-slate-600",
                  // tCell: "text-center",
                  // tHead: "text-center",
                }}
                data={evaluationData}
                columns={columns}
                options={{
                  disableSelection: true,
                  isLoading: isEvaluationsLoading,
                  totalCounts: evaluationsResponse?.data?.total || 0,
                  manualPagination: true,
                  setPagination,
                  pagination,
                }}
              />
            </div>
          </TabsContent>
        )}

        {isProcurement && (
          <TabsContent value="my_evaluations" className="mt-6">
            <DataTable
              header={() => (
                <Header
                  title="My Evaluations"
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  debouncedSearchQuery={debouncedSearchQuery}
                  dateFilter={myEvaluationsDateFilter}
                  statusFilter={statusFilter}
                  onDateFilterChange={handleDateFilterChange}
                  onStatusFilterChange={setStatusFilter}
                  onClearFilters={handleClearFilters}
                  totalCount={myEvaluationsResponse?.data?.total || 0}
                  tabType="my_evaluations"
                />
              )}
              emptyPlaceholder={<EmptyState />}
              classNames={{
                container:
                  "bg-white dark:bg-slate-950 rounded-xl px-3 border border-gray-300 dark:border-slate-600",
                // tCell: "text-center",
                // tHead: "text-center",
              }}
              data={myEvaluationData as any}
              columns={myEvaluationColumns as any}
              options={{
                disableSelection: true,
                isLoading: isMyEvaluationsLoading,
                totalCounts: myEvaluationsResponse?.data?.total || 0,
                manualPagination: true,
                setPagination,
                pagination,
              }}
            />
          </TabsContent>
        )}

        {!isCompanyAdmin && (
          <TabsContent value="assigned_evaluation" className="mt-6">
            <DataTable
              emptyPlaceholder={<EmptyState />}
              header={() => (
                <Header
                  title="Assigned Evaluations"
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  debouncedSearchQuery={debouncedSearchQuery}
                  dateFilter={assignedEvaluationsDateFilter}
                  statusFilter={statusFilter}
                  onDateFilterChange={handleDateFilterChange}
                  onStatusFilterChange={setStatusFilter}
                  onClearFilters={handleClearFilters}
                  totalCount={assignedEvaluationData.length}
                  tabType="assigned_evaluation"
                />
              )}
              classNames={{
                container:
                  "bg-white dark:bg-slate-950 rounded-xl px-3 border border-gray-300 dark:border-slate-600",
                expandedCell: "px-5",
                // tCell: "text-center",
                // tHead: "text-center",
              }}
              data={assignedEvaluationData}
              columns={assignedEvaluationColumns}
              options={{
                disableSelection: true,
                isLoading: isAssignedEvaluationsLoading,
                totalCounts: 0,
                manualPagination: true,
                setPagination,
                pagination,
                enableExpanding: true,
                // getSubRows: (originalRow) => getSubRows(originalRow, "evaluationGroups"),
                getRowCanExpand: (row) =>
                  hasChildren(row.original, "evaluationGroups"),
                renderSubComponent: ({ row }) => {
                  const evaluationGroups = row.original.evaluationGroups || [];
                  return (
                    <AssignedSubRows
                      {...{
                        headers: ["name", "status", "assigned On", "action"],
                        body: evaluationGroups.map((group) => ({
                          ...group,
                          status:
                            group?.status?.toLowerCase?.() === "release"
                              ? "Released"
                              : "Withheld",
                          "assigned On": format(
                            group.assignedOn,
                            "dd MMMM yyyy"
                          ),
                          action: (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-800 font-medium "
                              onClick={() =>
                                navigate(
                                  `/dashboard/evaluation/assigned/${row.original.id}/${group._id}`
                                )
                              }
                            >
                              View
                            </Button>
                          ),
                        })),
                      }}
                    />
                  );
                },
              }}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Custom Date Range Picker Dialog */}
      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden shadow-xl">
          <div className="border-b px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Select Date Range
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Choose a start and end date to filter evaluations.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-5">
            <Calendar
              mode="range"
              selected={tempDateRange}
              onSelect={setTempDateRange}
              numberOfMonths={2}
              className="rounded-md border bg-background"
              classNames={{
                day_button:
                  "relative flex size-9 items-center justify-center whitespace-nowrap rounded-md p-0 text-foreground group-data-selected:bg-primary group-data-selected:text-primary-foreground group-[[data-selected]:not(.range-middle)]:ring-2 group-[[data-selected]:not(.range-middle)]:ring-primary/40 hover:not-in-data-selected:bg-accent hover:not-in-data-selected:text-foreground",
                range_start: "range-start rounded-e-none",
                range_end: "range-end rounded-s-none",
                range_middle:
                  "range-middle group-data-selected:bg-primary/10 group-data-selected:text-foreground",
              }}
            />
          </div>
          <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
            <Button
              variant="outline"
              onClick={handleDateRangeCancel}
              className="transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDateRangeConfirm}
              className="transition-transform hover:scale-[1.02]"
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EvaluationManagementPage;

type HeaderProps = {
  title: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  debouncedSearchQuery: string;
  dateFilter: string;
  statusFilter: string;
  onDateFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onClearFilters: () => void;
  totalCount?: number;
  tabType?: "all_evaluations" | "my_evaluations" | "assigned_evaluation";
};

const Header = ({
  title,
  searchQuery,
  setSearchQuery,
  debouncedSearchQuery,
  dateFilter,
  statusFilter,
  onDateFilterChange,
  onStatusFilterChange,
  totalCount,
  tabType,
}: HeaderProps) => {
  return (
    <div className="flex items-center w-full justify-between border-b border-[#E9E9EB] dark:border-slate-600 p-3 pt-0">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <h2
              className="text-base font-semibold text-gray-600 dark:text-gray-400"
              style={{ fontFamily: "Quicksand" }}
            >
              {title}
            </h2>
            {debouncedSearchQuery && totalCount !== undefined && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Found {totalCount} evaluations with name '{debouncedSearchQuery}
                '
              </span>
            )}
          </div>
          <SearchInput
            placeholder="Evaluations by Name"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>

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
                    {
                      title: "All",
                      value: "all",
                    },
                    {
                      title: "Today",
                      value: "today",
                    },
                    {
                      title: "Last 7 Days",
                      value: "last7days",
                    },
                    {
                      title: "Last 30 Days",
                      value: "last30days",
                    },
                    {
                      title: "Custom",
                      value: "custom",
                    },
                  ],
                },
              ],
            },
            {
              title: "Status",
              showIcon: true,
              options: [
                {
                  label: "Active",
                  value: "active",
                },
                {
                  label: "Completed",
                  value: "completed",
                },
                {
                  label: "Pending",
                  value: "pending",
                },
                ...(tabType !== "assigned_evaluation"
                  ? [
                      {
                        label: "Draft",
                        value: "draft",
                      },
                    ]
                  : []),
              ],
            },
          ]}
          onFilterChange={(filterTitle, value) => {
            if (filterTitle === "Date") {
              onDateFilterChange(value);
            } else if (filterTitle === "Status") {
              onStatusFilterChange(value);
            }
          }}
          selectedValues={{
            Date: dateFilter,
            Status: statusFilter,
          }}
        />
      </div>
    </div>
  );
};

type AssignedSubRowsProps = {
  headers: string[];
  body: AssignedEvaluationApiResponse["evaluationGroups"];
};

const AssignedSubRows = ({ headers, body }: AssignedSubRowsProps) => {
  return (
    <Table>
      <TableHeader>
        {headers.map((header) => {
          return (
            <TableHead className={"h-10 bg-gray-200 capitalize"} key={header}>
              {header}
            </TableHead>
          );
        })}
      </TableHeader>
      <TableBody>
        {body.map((item) => {
          return (
            <TableRow
              className="bg-white dark:bg-slate-950 px-3 border-b border-gray-50"
              key={item._id}
            >
              {headers.map((header) => {
                return (
                  <TableCell key={header} className="border-gray-50">
                    {
                      item[
                        header as keyof AssignedEvaluationApiResponse["evaluationGroups"][0]
                      ]
                    }
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
