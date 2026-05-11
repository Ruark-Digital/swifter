import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, MoreHorizontal, Search, X, Loader2 } from "lucide-react";
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, deleteRequest, putRequest, postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import CreateVendorDialog from "./components/CreateVendorDialog";
import { StatCard } from "./components/StatCard";
import { DataTable } from "@/components/layouts/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
// import EditVendorDialog from "./components/EditVendorDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconMap } from "@/components/layouts/RoleBasedDashboard/components/StatsCard";
import { DropdownFilters } from "@/components/layouts/SolicitationFilters";
import { formatDateTZ } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";

// Dashboard statistics type (matching API response)
type VendorDashboard = {
  allVendor: number;
  activeVendor: number;
  inActiveVendor: number;
  suspendedVendor: number;
};

export interface InvitedEmail {
  _id:   string;
  email: string;
}


// Vendor type definition (matching API schema)
type Vendor = {
  _id: string;
  name: string;
  businessType: string;
  website: string;
  status: string;
  isSuspended: boolean;
  location: string;
  secondaryEmail: string;
  lastActive: string;
  invite: InvitedEmail;
  user: {
    _id: string;
    email: string;
    phone?: string;
    name: string;
    status: "pending" | "active" | "inactive";
  };
};

// API response types
type VendorsListResponse = {
  vendors: Vendor[];
  total: number;
  page: number;
  limit: number;
};

// Status badge component
const StatusBadge = ({ status }: { status: Vendor["status"] }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Suspended":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} border-0 p-2 px-4`}>
      {status}
    </Badge>
  );
};

// Empty state component
const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 h-full">
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
        <Users className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">
        No Vendors Added Yet
      </h3>
      <p className="text-gray-500 text-center mb-6 max-w-md">
        Manage your vendors easily by adding them here. Start by creating a new
        vendor profile.
      </p>
      <CreateVendorDialog />
    </div>
  );
};

// Error state component
const ErrorState = ({ error, onRetry }: { error: ApiResponseError; onRetry: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="h-12 w-12 text-red-400 mb-4">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Failed to load vendors
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
        {error?.response?.data?.message || "An error occurred while fetching vendor data. Please try again."}
      </p>
      <Button onClick={onRetry} variant="outline">
        Try Again
      </Button>
    </div>
  );
};

export const VendorManagementPage = () => {
  const navigate = useNavigate();
  const toast = useToastHandler();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [filters, setFilters] = useState({
    datePublished: "",
    status: "",
    plan: "",
  });
  const [activeStatCard, setActiveStatCard] = useState<string | null>(null);
  const [suspendedVendorId, setSuspendedVendorId] = useState<string | null>(
    null
  );
  const [isSuspendModel, setIsSuspendModel] = useState(false);
  const [isUnsuspendModel, setIsUnsuspendModel] = useState(false);
  // Add reminder dialog and selected vendor state
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  // Custom date range picker state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>();

  // Initialize filters from URL parameters
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && ['Active', 'Inactive', 'Pending', 'Suspended'].includes(statusParam)) {
      setFilters(prev => ({ ...prev, status: statusParam }));
      setActiveStatCard(statusParam);
    }
  }, [searchParams]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [
    debouncedSearchQuery,
    filters.datePublished,
    filters.status,
    filters.plan,
  ]);

  // Fetch vendors dashboard statistics
  const { data: dashboardData } = useQuery<
    ApiResponse<VendorDashboard>,
    ApiResponseError
  >({
    queryKey: ["vendorDashboard"],
    queryFn: async () =>
      await getRequest({ url: "/procurement/vendors/dashboard" }),
  });

  // Fetch vendors list
  const { data: vendorsData, isLoading, error: vendorsError, refetch: refetchVendors } = useQuery<
    ApiResponse<VendorsListResponse>,
    ApiResponseError
  >({
    queryKey: [
      "vendors",
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearchQuery,
      filters,
    ],
    retry: 2,
    retryDelay: 1000,
    queryFn: async () => {
      // Prepare filter parameters
      const params: Record<string, any> = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        name: debouncedSearchQuery || undefined,
      };

      // Add date filter if selected
      if (filters.datePublished && filters.datePublished !== "all") {
        const today = new Date();
        let startDate, endDate;

        switch (filters.datePublished) {
          case "today":
            startDate = startOfDay(today);
            endDate = endOfDay(today);
            break;
          case "yesterday":
            startDate = startOfDay(subDays(today, 1));
            endDate = endOfDay(subDays(today, 1));
            break;
          case "last7days":
            startDate = startOfDay(subDays(today, 6));
            endDate = endOfDay(today);
            break;
          case "last30days":
            startDate = startOfDay(subDays(today, 29));
            endDate = endOfDay(today);
            break;
          case "thisWeek":
            startDate = startOfWeek(today, { weekStartsOn: 1 });
            endDate = endOfWeek(today, { weekStartsOn: 1 });
            break;
          case "thisMonth":
            startDate = startOfMonth(today);
            endDate = endOfMonth(today);
            break;
          case "thisYear":
            startDate = startOfYear(today);
            endDate = endOfYear(today);
            break;
          default:
            // For custom date ranges, try to parse as date range format
            if (filters.datePublished.includes('-')) {
              // If it's already in start_date-end_date format, use it directly
              params.date = filters.datePublished;
            } else {
              // For other predefined options like "7_days", convert to proper date range
              switch (filters.datePublished) {
                case "today":
                  startDate = startOfDay(today);
                  endDate = endOfDay(today);
                  break;
                case "7_days":
                  startDate = startOfDay(subDays(today, 6));
                  endDate = endOfDay(today);
                  break;
                case "30_days":
                  startDate = startOfDay(subDays(today, 29));
                  endDate = endOfDay(today);
                  break;
                default:
                  // Fallback: use the original value if we can't parse it
                  params.date = filters.datePublished;
                  break;
              }
            }
            break;
        }

        // If we calculated a date range, format and add it to params
        if (startDate && endDate) {
          const formattedStartDate = format(startDate, "yyyy-MM-dd");
          const formattedEndDate = format(endDate, "yyyy-MM-dd");
          params.date = `${formattedStartDate}-${formattedEndDate}`;
        }
      }

      // Add status filter if selected
      if (filters.status && filters.status !== "all_status") {
        if (filters.status === "Suspended") {
          params.isSuspended = true;
        } else {
          params.status = filters.status;
          params.isSuspended = false;
        }
      }

      // Add plan filter if selected
      if (filters.plan && filters.plan !== "") {
        params.plan = filters.plan;
      }

      return await getRequest({
        url: "/procurement/vendors/",
        config: { params },
      });
    },
  });

  // Suspend vendor mutation
  const { mutateAsync: suspendVendor, isPending: isSuspendingVendor } =
    useMutation<ApiResponse<any>, ApiResponseError, string>({
      mutationKey: ["suspendVendor"],
      mutationFn: async (vendorId) =>
        await deleteRequest({
          url: `/procurement/vendors/${vendorId}/suspend`,
        }),
      onSuccess: () => {
        toast.success("Success", "Vendor suspended successfully");
        queryClient.invalidateQueries({ queryKey: ["vendors"] });
        queryClient.invalidateQueries({ queryKey: ["vendorDashboard"] });
        setIsSuspendModel(false);
      },
      onError: (error) => {
        console.log(error);
        const err = error as ApiResponseError;
        toast.error(
          "Error",
          err?.response?.data?.message ?? "Failed to suspend vendor"
        );
      },
    });

  // Unsuspend vendor mutation
  const { mutateAsync: unsuspendVendor, isPending: isUnsuspendingVendor } =
    useMutation<ApiResponse<any>, ApiResponseError, string>({
      mutationKey: ["unsuspendVendor"],
      mutationFn: async (vendorId) =>
        await putRequest({
          url: `/procurement/vendors/${vendorId}/unsuspend`,
          payload: {},
        }),
      onSuccess: () => {
        toast.success("Success", "Vendor unsuspend successfully");
        queryClient.invalidateQueries({ queryKey: ["vendors"] });
        queryClient.invalidateQueries({ queryKey: ["vendorDashboard"] });
        setIsUnsuspendModel(false);
      },
      onError: (error) => {
        console.log(error);
        const err = error as ApiResponseError;
        toast.error(
          "Error",
          err?.response?.data?.message ?? "Failed to unsuspend vendor"
        );
      },
    });

  // Send reminder invite mutation
  const { mutateAsync: sendReminderInvite, isPending: isSendingReminder } =
    useMutation<ApiResponse<any>, ApiResponseError, string>({
      mutationKey: ["sendReminderInvite"],
      mutationFn: async (email) =>
        await postRequest({
          url: `/onboarding/remind-invite?email=${encodeURIComponent(email)}`,
          payload: {},
        }),
      onSuccess: () => {
        toast.success("Success", "Reminder invite sent successfully");
      },
      onError: (error) => {
        console.log(error);
        const err = error as ApiResponseError;
        toast.error(
          "Error",
          err?.response?.data?.message ?? "Failed to send reminder invite"
        );
      },
    });

  // Handle sending reminder invite
  const handleSendReminderInvite = async (email: string) => {
    try {
      await sendReminderInvite(email);
      setIsReminderDialogOpen(false);
    } catch (error) {
      // Error handled in onError
    }
  };

  // Handle vendor suspension
  const handleSuspendVendor = async (vendorId: string) => {
    try {
      await suspendVendor(vendorId);
    } catch (error) {
      console.error("Failed to suspend vendor:", error);
    }
  };

  // Handle vendor un-suspension
  const handleUnsuspendVendor = async (vendorId: string) => {
    try {
      await unsuspendVendor(vendorId);
    } catch (error) {
      console.error("Failed to unsuspend vendor:", error);
    }
  };

  // Extract data from API responses (matching API response structure)
  const vendorStats = dashboardData?.data?.data || {
    allVendor: 0,
    activeVendor: 0,
    inActiveVendor: 0,
    suspendedVendor: 0,
  };

  const vendors = vendorsData?.data?.data?.vendors || [];
  const totalVendors = vendorsData?.data?.data?.total || 0;

  // Handle StatCard clicks for filtering
  const handleStatCardClick = (cardType: string) => {
    // Reset pagination when filter changes
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));

    // Set active card and update filters
    setActiveStatCard(cardType);

    switch (cardType) {
      case "all":
        setFilters((prev) => ({ ...prev, status: "" }));
        break;
      case "active":
        setFilters((prev) => ({ ...prev, status: "Active" }));
        break;
      case "inactive":
        setFilters((prev) => ({ ...prev, status: "Inactive" }));
        break;
      case "suspended":
        setFilters((prev) => ({ ...prev, status: "Suspended" }));
        break;
      default:
        setFilters((prev) => ({ ...prev, status: "" }));
        break;
    }
  };

  // Handle filter changes from dropdown
  const handleFilterChange = (
    filterType: string,
    value: string
    // label: string
  ) => {
    // Reset to first page when filters change
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));

    // Clear active stat card when using dropdown filters
    if (filterType === "Status") {
      setActiveStatCard(null);
    }

    // Update filters based on the filter type
    if (filterType === "Date") {
      if (value === "custom") {
        setIsDatePickerOpen(true);
        setTempDateRange(undefined);
      } else {
        setFilters((prev) => ({ ...prev, datePublished: value }));
      }
    } else if (filterType === "Status") {
      setFilters((prev) => ({ ...prev, status: value }));
    } else if (filterType === "Plan") {
      setFilters((prev) => ({ ...prev, plan: value }));
    }
  };

  // Confirm and cancel handlers for custom date range
  const handleDateRangeConfirm = () => {
    if (tempDateRange?.from && tempDateRange?.to) {
      const start = format(startOfDay(tempDateRange.from), "yyyy-MM-dd");
      const end = format(endOfDay(tempDateRange.to), "yyyy-MM-dd");
      setFilters((prev) => ({ ...prev, datePublished: `${start}-${end}` }));
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
    setIsDatePickerOpen(false);
  };

  const handleDateRangeCancel = () => {
    setIsDatePickerOpen(false);
    if (!filters.datePublished || filters.datePublished === "custom") {
      setFilters((prev) => ({ ...prev, datePublished: "all" }));
    }
  };

  // Use vendors data directly since API handles all filtering
  const filteredData = vendors;

  // Define table columns
  const columns: ColumnDef<Vendor>[] = [
    {
      accessorKey: "name",
      header: "Vendor Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name || "N/A"}</span>
          <span className="text-sm text-blue-500 underline underline-offset-2">
            {row.original.user?.email || row.original.invite?.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "businessType",
      header: "Business Type",
      cell: ({ row }) => (
        <span className="text-xs capitalize">{row.original.businessType || "N/A"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.isSuspended
          ? "Suspended"
          : row.original.status;
        return <StatusBadge status={status} />;
      },
    },
    {
      accessorKey: "lastActive",
      header: "Last Activity",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span className="">
            {row.original.lastActive
             ? formatDateTZ(row.original.lastActive, "MMM dd, yyyy, pppp")
              : "N/A"}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-2xl">
            <DropdownMenuItem
              onClick={() => navigate(`/dashboard/vendor/${row.original._id}`)}
              className="p-3"
            >
              View Vendor
            </DropdownMenuItem>
            {/** Send Reminder only for Pending vendors and not suspended */}
            {!row.original.isSuspended && row.original.status === "Pending" && (
              <DropdownMenuItem
                onClick={() => {
                  setSelectedVendor(row.original);
                  setIsReminderDialogOpen(true);
                }}
                className="p-3"
              >
                Send Reminder
              </DropdownMenuItem>
            )}
            {row.original.isSuspended ? (
              <DropdownMenuItem
                className="p-3 text-green-600"
                onClick={() => {
                  setSuspendedVendorId(row.original._id);
                  setIsUnsuspendModel(true);
                }}
              >
                Unsuspend Vendor
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="p-3 text-orange-600"
                onClick={() => {
                  setSuspendedVendorId(row.original._id);
                  setIsSuspendModel(true);
                }}
              >
                Suspend Vendor
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Vendors</h1>
        </div>
        <div className="flex items-center gap-3">
          <CreateVendorDialog />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="All Vendors"
          value={vendorStats.allVendor ?? 0}
          icon={IconMap?.users as any}
          iconColor="text-gray-600"
          iconBgColor="bg-gray-100"
          onClick={() => handleStatCardClick("all")}
          isActive={activeStatCard === "all"}
        />
        <StatCard
          title="Active Vendors"
          value={vendorStats.activeVendor ?? 0}
          icon={IconMap?.users as any}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          onClick={() => handleStatCardClick("active")}
          isActive={activeStatCard === "active"}
        />
        <StatCard
          title="Inactive Vendors"
          value={vendorStats.inActiveVendor ?? 0}
          icon={IconMap?.users as any}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
          onClick={() => handleStatCardClick("inactive")}
          isActive={activeStatCard === "inactive"}
        />
        <StatCard
          title="Suspended Vendors"
          value={vendorStats.suspendedVendor ?? 0}
          icon={IconMap?.users as any}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
          onClick={() => handleStatCardClick("suspended")}
          isActive={activeStatCard === "suspended"}
        />
      </div>

      {/* Main Content */}
      <DataTable
        data={filteredData}
        columns={columns}
        header={() => (
          <div className="flex items-center justify-between border-b border-[#E9E9EB] dark:border-gray-800 pb-3 w-full px-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <h2
                    className="text-base font-semibold text-[#0F0F0F] dark:text-gray-400"
                    style={{ fontFamily: "Quicksand" }}
                  >
                    Vendors
                  </h2>
                </div>
                <div className="relative">
                  {isLoading && debouncedSearchQuery ? (
                    <Loader2
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B6B6B] animate-spin"
                      strokeWidth={1.67}
                    />
                  ) : (
                    <Search
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B6B6B]"
                      strokeWidth={1.67}
                    />
                  )}
                  <Input
                    placeholder="Search Vendors by Name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSearchQuery('');
                        e.currentTarget.blur();
                      }
                    }}
                    className="pl-12 pr-12 py-3 w-[300px] h-12 border border-[#E5E7EB] rounded-lg text-sm text-[#6B6B6B] focus:border-[#2A4467] focus:ring-[#2A4467]"
                    style={{ fontFamily: "PushPenny" }}
                    aria-label="Search vendors by name"
                    type="search"
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B6B6B] hover:text-[#2A4467] transition-colors"
                      aria-label="Clear search"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Results Indicator */}
              {debouncedSearchQuery && (
                <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                  <span>
                    {isLoading ? (
                      "Searching..."
                    ) : (
                      `Found ${totalVendors || 0} vendor${(totalVendors || 0) !== 1 ? 's' : ''} with name "${debouncedSearchQuery}"`
                    )}
                  </span>
                  {!isLoading && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-[#2A4467] hover:underline"
                      type="button"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}

              <DropdownFilters
                filters={[
                  {
                    title: "Date",
                    showIcon: true,
                    options: [
                      {
                        hasOptions: true,
                        value: "date",
                        label: "Date Invited",
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
                        label: "All Status",
                        value: "all_status",
                      },
                      {
                        label: "Active",
                        value: "active",
                      },
                      {
                        label: "Pending",
                        value: "pending",
                      },
                      {
                        label: "Suspended",
                        value: "suspended",
                      }
                    ],
                  },
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
        emptyPlaceholder={
          vendorsError ? (
            <ErrorState error={vendorsError} onRetry={() => refetchVendors()} />
          ) : (
            <EmptyState />
          )
        }
        classNames={{
          container:
            "bg-white dark:bg-slate-950 rounded-xl px-3 border border-gray-300 dark:border-slate-600",
        }}
        options={{
          disableSelection: true,
          isLoading: isLoading,
          totalCounts: totalVendors,
          manualPagination: true,
          setPagination,
          pagination,
        }}
      />

      {/* Custom Date Range Dialog */}
      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden shadow-xl">
          <div className="border-b px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Select Date Range</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Choose start and end dates to filter vendors.
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
            <Button variant="outline" onClick={handleDateRangeCancel} className="transition-colors">
              Cancel
            </Button>
            <Button onClick={handleDateRangeConfirm} className="transition-transform hover:scale-[1.02]">
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <ConfirmAlert
        text={`Send a reminder email to ${selectedVendor?.name} (${selectedVendor?.user?.email || selectedVendor?.invite?.email}) about their pending invite?`}
        title="Send Reminder Invite"
        open={isReminderDialogOpen}
        type="alert"
        onClose={setIsReminderDialogOpen}
        onPrimaryAction={() => {
          const email = selectedVendor?.user?.email || selectedVendor?.invite?.email;
          if (email) {
            handleSendReminderInvite(email);
          } else {
            toast.error("Error", "No email found for this vendor");
          }
        }}
        isLoading={isSendingReminder}
      />

      <ConfirmAlert
        text="Are you sure you want to unsuspend this vendor?"
        title="Unsuspend Vendor"
        onPrimaryAction={() => handleUnsuspendVendor(suspendedVendorId ?? "")}
        onClose={() => {
          setSuspendedVendorId(null)
          setIsUnsuspendModel(false)
        }}
        open={isUnsuspendModel}
        isLoading={isUnsuspendingVendor}
      ></ConfirmAlert>

      <ConfirmAlert
        text="Are you sure you want to suspend this vendor?"
        title="Suspend Vendor"
        onPrimaryAction={() => handleSuspendVendor(suspendedVendorId ?? "")}
        onClose={() => {
          setSuspendedVendorId(null)
          setIsSuspendModel(false)
        }}
        open={isSuspendModel}
        isLoading={isSuspendingVendor}
      ></ConfirmAlert>
    </div>
  );
};

export default VendorManagementPage;
