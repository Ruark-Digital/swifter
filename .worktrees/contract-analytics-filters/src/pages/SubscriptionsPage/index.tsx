import { Button } from "@/components/ui/button";
import { MoreHorizontal, Building } from "lucide-react";
import { format, startOfDay, subDays, endOfDay } from "date-fns";
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError,  } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { StatCard } from "./components/StatCard";
import { DataTable } from "@/components/layouts/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownFilters } from "@/components/layouts/SolicitationFilters";
import { SearchInput } from "@/components/layouts/SearchInput";
import { IconMap } from "@/components/layouts/RoleBasedDashboard/components/StatsCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { formatDateTZ } from "@/lib/utils";

// Dashboard statistics type
export interface SubscriptionDashboard {
  total: number;
  active: number;
  expired: number;
  suspended: number;
}

// Subscription type definition based on API schema
type Subscription = {
  id: string;
  companyId: string;
  company?: string; // This will be populated from company data
  plan: string;
  usersUsed: number;
  maxUsers: number;
  users: string;
  expiryDate: string;
  status: "active" | "expired" | "suspended";
  createdAt: string;
  updatedAt: string;
};

// API response types
type SubscriptionsListResponse = {
  data: Subscription[];
  total: number;
  page: number;
  limit: number;
};

// Status badge component
const StatusBadge = ({ status }: { status: Subscription["status"] }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "suspended":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getDisplayStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Badge className={`${getStatusColor(status)} border-0 p-2 px-4`}>
      {getDisplayStatus(status)}
    </Badge>
  );
};

// Empty state component
const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 h-full">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
        <Building className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">
        No Companies Yet
      </h3>
    </div>
  );
};

const SubscriptionsPage = () => {
  const navigate = useNavigate();
  const toast = useToastHandler();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    status?: string;
    plan?: string;
    datePublished?: string;
  }>({});

  // Initialize filters from URL parameters
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && ['active', 'expired', 'suspended'].includes(statusParam)) {
      setFilters(prev => ({ ...prev, status: statusParam }));
    }
  }, [searchParams]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Date range picker states
  const [dateRange, setDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});

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

  // Reset pagination when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (filterTitle: string, value: string) => {
    // Handle date filter specially
    if (filterTitle === "Date") {
      const now = new Date();
      let startDate: Date | undefined;
      let endDate: Date | undefined = now;

      switch (value) {
        case "today":
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case "7_days":
          startDate = subDays(now, 7);
          break;
        case "30_days":
          startDate = subDays(now, 30);
          break;
        case "all":
          startDate = undefined;
          endDate = undefined;
          break;
        case "custom":
          // Open the date range picker dialog
          setIsDatePickerOpen(true);
          // Initialize temp date range with current values
          setTempDateRange({
            from: dateRange.startDate,
            to: dateRange.endDate,
          });
          break;
      }

      // Only update date range if not custom (custom will update after dialog confirmation)
      if (value !== "custom") {
        setDateRange({ startDate, endDate });
      }
    }

    // Update filters
    const filterKey =
      filterTitle.toLowerCase() === "date"
        ? "datePublished"
        : filterTitle.toLowerCase();
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  // Handle date range selection
  const handleDateRangeSelect = (
    range: { from?: Date; to?: Date } | undefined
  ) => {
    if (range) {
      setTempDateRange(range);
    }
  };

  // Handle date range confirmation
  const handleDateRangeConfirm = () => {
    if (tempDateRange.from || tempDateRange.to) {
      setDateRange({
        startDate: tempDateRange.from,
        endDate: tempDateRange.to,
      });

      // Update filters with custom date range
      setFilters((prev) => ({
        ...prev,
        datePublished: "custom",
      }));
    }
    setIsDatePickerOpen(false);
  };

  // Handle date range cancellation
  const handleDateRangeCancel = () => {
    setIsDatePickerOpen(false);
  };

  // Fetch subscriptions dashboard statistics
  const { data: dashboardData } = useQuery<
    ApiResponse<SubscriptionDashboard>,
    ApiResponseError
  >({
    queryKey: ["subscriptionDashboard"],
    queryFn: async () =>
      await getRequest({ url: "/subscriptions/analytics/status" }),
  });

  // Fetch subscriptions list
  const { data: subscriptionsData, isLoading } = useQuery<
    ApiResponse<SubscriptionsListResponse>,
    ApiResponseError
  >({
    queryKey: [
      "subscriptions",
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearchQuery,
      filters,
      dateRange,
    ],
    queryFn: async () => {
      // Prepare date parameters
      let dateParams = {};
      if (
        filters.datePublished === "custom" &&
        (dateRange.startDate || dateRange.endDate)
      ) {
        if (dateRange.startDate) {
          dateParams = {
            ...dateParams,
            startDate: format(dateRange.startDate, "yyyy-MM-dd"),
          };
        }
        if (dateRange.endDate) {
          dateParams = {
            ...dateParams,
            endDate: format(dateRange.endDate, "yyyy-MM-dd"),
          };
        }
      } else if (filters.datePublished) {
        dateParams = { datePublished: filters.datePublished };
      }

      return await getRequest({
        url: "/subscriptions",
        config: {
          params: {
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            search: debouncedSearchQuery || undefined,
            status: filters.status || undefined,
            plan: filters.plan || undefined,
            ...dateParams,
          },
        },
      });
    },
  });

  // Mutation for changing subscription plan

  // Mutation for renewing subscription
  const renewMutation = useMutation<
    ApiResponse<Subscription>,
    ApiResponseError,
    { id: string; durationInDays: number }
  >({
    mutationFn: async ({ id, durationInDays }) =>
      await postRequest({
        url: `/subscriptions/${id}/renew`,
        payload: { durationInDays },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success(
        "Subscription Renewed",
        "Subscription renewed successfully"
      );
    },
    onError: (error) => {
      toast.error("Renewal Failed", error);
    },
  });

  // Mutation for suspending/reactivating subscription (using status update)
  const updateStatusMutation = useMutation<
    ApiResponse<Subscription>,
    ApiResponseError,
    { id: string; status: string }
  >({
    mutationFn: async ({ id, status }) =>
      await postRequest({
        url: `/subscriptions/${id}/status`,
        payload: { status },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      const action =
        variables.status === "active" ? "reactivated" : "suspended";
      toast.success("Status Updated", `Subscription ${action} successfully`);
    },
    onError: (error) => {
      toast.error("Status Update Failed", error);
    },
  });

  // Extract data from API responses
  const subscriptionStats = dashboardData?.data?.data
    ? {
        allSubscriptions: dashboardData.data.data.total || 0,
        activeSubscriptions: dashboardData.data.data.active || 0,
        expiredSubscriptions: dashboardData.data.data.expired || 0,
      }
    : {
        allSubscriptions: 0,
        activeSubscriptions: 0,
        expiredSubscriptions: 0,
      };

  const subscriptions = subscriptionsData?.data?.data?.data || [];
  const totalSubscriptions = subscriptionsData?.data?.data?.total || 0;

  // Helper functions for actions
  // const handleViewCompany = (companyId: string) => {
  //   navigate(`/dashboard/companies/${companyId}`);
  // };

  const handleSuspendSubscription = (subscriptionId: string) => {
    updateStatusMutation.mutate({ id: subscriptionId, status: "suspended" });
  };

  const handleReactivateSubscription = (subscriptionId: string) => {
    updateStatusMutation.mutate({ id: subscriptionId, status: "active" });
  };

  const handleRenewSubscription = (subscriptionId: string) => {
    // Default to 30 days renewal
    renewMutation.mutate({ id: subscriptionId, durationInDays: 30 });
  };

  const formatDateString = (dateString: string) => {
    try {
      const formatted = formatDateTZ(dateString, "MMM dd, yyyy, pppp");
      return formatted === "N/A" ? "Never" : formatted;
    } catch {
      return "Never";
    }
  };

  // Fetch subscription plans
  // const { data: plansData } = useQuery<
  //   ApiResponse<ApiList<SubscriptionPlan>>,
  //   ApiResponseError
  // >({
  //   queryKey: ["subscriptionPlans-9"],
  //   queryFn: async () => await getRequest({ url: "/subscriptions/plans" }),
  //   // retryOnMount: false,
  //   // refetchOnMount: false,
  //   // staleTime: 30 * 60 * 1000, // 30 minutes
  // });

  // const formatUsers = (usersUsed: number, maxUsers: number) => {
  //   if (maxUsers === -1) return "Unlimited";
  //   return `${usersUsed}`;
  // };

  // Filter data based on search query (for client-side filtering if needed)
  const filteredData = useMemo(() => {
    return subscriptions;
  }, [subscriptions]);

  // Define table columns
  const columns: ColumnDef<Subscription>[] = [
    {
      accessorKey: "companyName",
      header: "Company Name",
      cell: ({ row }) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {row.original.company || `Company ${row.original.companyId}`}
        </span>
      ),
    },
    {
      accessorKey: "plan",
      header: "Plan",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.original.plan}
        </span>
      ),
    },
    {
      accessorKey: "users",
      header: "Users (Used/Max)",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.original.users}
        </span>
      ),
    },
    {
      accessorKey: "expiryDate",
      header: "Expiry Date",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatDateString(row.original.expiryDate)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const subscription = row.original;
        const isActive = subscription.status === "active";
        const isSuspended = subscription.status === "suspended";
        const isExpired = subscription.status === "expired";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl">
              <DropdownMenuItem
                className="p-3 cursor-pointer"
                onClick={() =>
                  navigate(`/dashboard/subscription/${subscription.id}`)
                }
              >
                View Company
              </DropdownMenuItem>

              {/* <DropdownMenuItem
                className="p-3 cursor-pointer"
                onClick={() => handleChangePlan(subscription.id)}
              >
                Change Plan
              </DropdownMenuItem> */}

              {isActive && (
                <ConfirmAlert
                  type="warning"
                  title="Suspend Subscription"
                  text={`Are you sure you want to suspend this subscription? The company will lose access to the platform.`}
                  primaryButtonText="Suspend"
                  secondaryButtonText="Cancel"
                  showSecondaryButton={true}
                  isLoading={updateStatusMutation.isPending}
                  onPrimaryAction={() =>
                    handleSuspendSubscription(subscription.id)
                  }
                  trigger={
                    <DropdownMenuItem
                      className="p-3 cursor-pointer w-full"
                      onSelect={(e) => e.preventDefault()}
                    >
                      Suspend Subscription
                    </DropdownMenuItem>
                  }
                />
              )}

              {(isExpired || isSuspended) && (
                <ConfirmAlert
                  type="success"
                  title="Renew Subscription"
                  text={`Are you sure you want to renew this subscription for 30 days?`}
                  primaryButtonText="Renew"
                  secondaryButtonText="Cancel"
                  showSecondaryButton={true}
                  isLoading={renewMutation.isPending}
                  onPrimaryAction={() =>
                    handleRenewSubscription(subscription.id)
                  }
                  trigger={
                    <DropdownMenuItem
                      className="p-3 cursor-pointer text-green-600 dark:text-green-400"
                      onSelect={(e) => e.preventDefault()}
                    >
                      Renew
                    </DropdownMenuItem>
                  }
                />
              )}

              {isSuspended && (
                <ConfirmAlert
                  type="success"
                  title="Reactivate Subscription"
                  text={`Are you sure you want to reactivate this subscription? The company will regain access to the platform.`}
                  primaryButtonText="Reactivate"
                  secondaryButtonText="Cancel"
                  showSecondaryButton={true}
                  isLoading={updateStatusMutation.isPending}
                  onPrimaryAction={() =>
                    handleReactivateSubscription(subscription.id)
                  }
                  trigger={
                    <DropdownMenuItem
                      className="p-3 cursor-pointer text-blue-600 dark:text-blue-400"
                      onSelect={(e) => e.preventDefault()}
                    >
                      Reactivate
                    </DropdownMenuItem>
                  }
                />
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Subscriptions
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* <Button variant="outline" className="flex items-center gap-2">
            <Share2 size={16} />
            Export
          </Button> */}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="All Subscriptions"
          value={subscriptionStats.allSubscriptions}
          icon={IconMap?.creditCard as any}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          onClick={() => {
            setFilters(prev => ({ ...prev, status: undefined }));
          }}
        />
        <StatCard
          title="Active Subscriptions"
          value={subscriptionStats.activeSubscriptions}
          icon={IconMap?.creditCard as any}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          onClick={() => {
            setFilters(prev => ({ ...prev, status: 'active' }));
          }}
        />
        <StatCard
          title="Expired Subscriptions"
          value={subscriptionStats.expiredSubscriptions}
          icon={IconMap?.creditCard as any}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
          onClick={() => {
            setFilters(prev => ({ ...prev, status: 'expired' }));
          }}
        />
      </div>

      {/* Subscriptions Table */}
      <DataTable
        data={filteredData}
        columns={columns}
        options={{
          manualPagination: true,
          setPagination: setPagination,
          pagination: pagination,
          totalCounts: totalSubscriptions,
          isLoading: isLoading,
        }}
        emptyPlaceholder={<EmptyState />}
        classNames={{
          container:
            "bg-white dark:bg-slate-950 rounded-xl px-3  border border-gray-300 dark:border-slate-600",
          tCell: "text-center",
          tHead: "text-center",
        }}
        header={() => (
          <div className="flex items-center w-full justify-between border-b border-[#E9E9EB] dark:border-slate-600 p-3 pt-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <h2
                    className="text-base font-semibold text-gray-600 dark:text-gray-400"
                    style={{ fontFamily: "Quicksand" }}
                  >
                    Subscriptions
                  </h2>
                </div>
                <SearchInput
                  placeholder="Subscription"
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
                        label: "Date Published",
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
                            value: "7_days",
                          },
                          {
                            title: "Last 30 Days",
                            value: "30_days",
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
                        label: "Suspended",
                        value: "suspended",
                      },
                      {
                        label: "Pending",
                        value: "pending",
                      },
                    ],
                  },
                  // {
                  //   title: "Plan",
                  //   options: plansData?.data.data.data?.map(
                  //       (plan: SubscriptionPlan) => ({
                  //         label: plan.name,
                  //         value: plan.name,
                  //       })
                  //     ) || [],
                  // },
                ]}
                onFilterChange={handleFilterChange}
                selectedValues={{
                  Date: filters.datePublished || "",
                  Status: filters.status || "",
                  Plan: filters.plan || "",
                }}
              />
            </div>
          </div>
        )}
      />

      {/* Date Range Picker Dialog */}
      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              Select Date Range
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Calendar
              mode="range"
              required={false}
              selected={{
                from: tempDateRange.from,
                to: tempDateRange.to,
              }}
              onSelect={handleDateRangeSelect}
              className="rounded-md border"
              numberOfMonths={2}
            />

            <div className="mt-4">
              <div className="text-sm mb-4">
                <div className="font-medium">Selected Range:</div>
                <div className="text-gray-500 dark:text-gray-400">
                  {tempDateRange.from ? (
                    tempDateRange.to ? (
                      <>
                        {formatDateTZ(tempDateRange.from, "PPP")} -{" "}
                        {formatDateTZ(tempDateRange.to, "PPP")}
                      </>
                    ) : (
                      formatDateTZ(tempDateRange.from, "PPP")
                    )
                  ) : (
                    "No date selected"
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDateRangeCancel}>
              Cancel
            </Button>
            <Button onClick={handleDateRangeConfirm}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionsPage;
