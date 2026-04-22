import { Button } from "@/components/ui/button";
import { Building, MoreHorizontal } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, putRequest } from "@/lib/axiosInstance";
import {
  ApiResponse,
  ApiResponseError,
  ApiList,
  SubscriptionPlan,
} from "@/types";
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
import CreateCompanyDialog from "./components/CreateCompanyDialog";
// import EditCompanyDialog from "./components/EditCompanyDialog";
import { SearchInput } from "@/components/layouts/SearchInput";
import { DropdownFilters } from "@/components/layouts/SolicitationFilters";
import { format as formatDate, startOfDay, subDays, endOfDay } from "date-fns";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { IconMap } from "@/components/layouts/RoleBasedDashboard/components/StatsCard";
import { Calendar } from "@/components/ui/calendar";
import { formatDateTZ } from "@/lib/utils";

// Dashboard statistics type - Note: /companies/dashboard endpoint not found in API docs
// This might need to be implemented or derived from companies list
export interface CompanyDashboard {
  company: CompanyRes;
  users: User[];
}

export interface CompanyRes {
  allCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
}

export interface User {
  count: number;
  roleName: string;
}

type Admin = { name: string; email: string; _id: string };

// Company type definition - Updated to match API documentation
export type Company = {
  _id: string;
  name: string;
  industry?: string;
  sizeCategory: string;
  status: "active" | "inactive";
  maxUsers: number;
  admins: Admin[];
  domain?: string;
  planName?: string;
  duration?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  subscriptionExpiry: string;
  subscriptionStatus: string;
};

// API response types - Updated to match API documentation
type CompaniesListResponse = {
  total: number;
  page: number;
  limit: number;
  data: Company[];
};

// Status badge component
const StatusBadge = ({ status }: { status: Company["status"] }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} border-0 p-2 px-4`}>
      {status === "active" ? "Active" : "Inactive"}
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
        No Companies Added Yet
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
        Manage your companies easily by adding them here. Start by creating a
        new company profile.
      </p>
      <CreateCompanyDialog />
    </div>
  );
};

/**
 * Companies management page.
 * Manages company listing, filtering, and status updates.
 * Date filtering derives start and end dates from presets (e.g., today, 7_days, 30_days)
 * and passes a range to the API for server-side filtering.
 *
 * @returns JSX element rendering the companies management UI
 * @example
 * // Render the Companies page
 * <CompaniesPage />
 */
const CompaniesPage = () => {
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

  // Initialize filters from URL parameters
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setFilters((prev) => ({ ...prev, status: statusParam }));
    }
  }, [searchParams]);

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

  // Fetch companies dashboard statistics
  // Note: /companies/dashboard endpoint not found in API docs
  // Consider implementing this endpoint or calculating stats from companies list
  const { data: dashboardData } = useQuery<
    ApiResponse<CompanyDashboard>,
    ApiResponseError
  >({
    queryKey: ["companyDashboard"],
    queryFn: async () => await getRequest({ url: "/companies/dashboard" }),
    // enabled: false, // Disabled until endpoint is implemented
  });

  // Fetch subscription plans
  const { data: plansData } = useQuery<
    ApiResponse<ApiList<SubscriptionPlan>>,
    ApiResponseError
  >({
    queryKey: ["subscriptionPlans-9"],
    queryFn: async () => await getRequest({ url: "/subscriptions/plans" }),
    // retryOnMount: false,
    // refetchOnMount: false,
    // staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch companies list
  const { data: companiesData, isLoading } = useQuery<
    ApiResponse<CompaniesListResponse>,
    ApiResponseError
  >({
    queryKey: [
      "companies",
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
            startDate: formatDate(dateRange.startDate, "yyyy-MM-dd"),
          };
        }
        if (dateRange.endDate) {
          dateParams = {
            ...dateParams,
            endDate: formatDate(dateRange.endDate, "yyyy-MM-dd"),
          };
        }
      } else if (filters.datePublished) {
        // Derive start/end dates from the selected preset and pass as a date range
        const now = new Date();
        let startDate: Date | undefined = dateRange.startDate;
        let endDate: Date | undefined = dateRange.endDate;

        // If dateRange hasn't been set yet, compute from preset value
        if (!startDate || !endDate) {
          switch (filters.datePublished) {
            case "today":
              startDate = startOfDay(now);
              endDate = endOfDay(now);
              break;
            case "7_days":
              startDate = subDays(now, 7);
              endDate = now;
              break;
            case "30_days":
              startDate = subDays(now, 30);
              endDate = now;
              break;
            case "all":
              startDate = undefined;
              endDate = undefined;
              break;
            default:
              break;
          }
        }

        // Only include date filter when both boundaries exist
        if (startDate && endDate) {
          dateParams = {
            date: `${formatDate(startDate, "yyyy/MM/dd")}-${formatDate(
              endDate,
              "yyyy/MM/dd"
            )}`,
          };
        } else {
          dateParams = {};
        }
      }

      return await getRequest({
        url: "/companies",
        config: {
          params: {
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            name: debouncedSearchQuery || undefined,
            status: filters.status || undefined,
            plan: filters.plan || undefined,
            ...dateParams,
          },
        },
      });
    },
  });

  // Update company status mutation
  const { mutateAsync: updateCompanyStatus } = useMutation<
    ApiResponse<Company>,
    ApiResponseError,
    { companyId: string; status: "active" | "inactive" }
  >({
    mutationKey: ["updateCompanyStatus"],
    mutationFn: async ({ companyId, status }) =>
      await putRequest({
        url: `/companies/${companyId}/status`,
        payload: { status },
      }),
    onSuccess: (_, variables) => {
      const action = variables.status === "active" ? "activated" : "suspended";
      toast.success("Success", `Company ${action} successfully`);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companyDashboard"] });
    },
    onError: (error) => {
      console.log(error);
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message ?? "Failed to update company status"
      );
    },
  });

  // Handle company status update
  const handleUpdateCompanyStatus = async (
    companyId: string,
    status: "active" | "inactive"
  ) => {
    try {
      await updateCompanyStatus({ companyId, status });
    } catch (error) {
      // Error is already handled in onError callback
    }
  };

  // Extract data from API responses
  const companyStats = dashboardData?.data?.data.company || {
    allCompanies: 0,
    activeCompanies: 0,
    suspendedCompanies: 0,
  };

  const companies = companiesData?.data?.data?.data || []; // Updated path per API docs
  const totalCompanies = companiesData?.data?.data?.total || 0;

  // Filter data based on search query (for client-side filtering if needed)
  const filteredData = useMemo(() => {
    return companies;
  }, [companies]);

  // Define table columns
  const columns: ColumnDef<Company>[] = [
    {
      accessorKey: "name",
      header: "Company Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {row.original.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "planName",
      header: "Plan",
      cell: ({ row }) => (
        <span className="text-xs text-gray-700 dark:text-gray-300">
          {row.getValue("planName")}
        </span>
      ),
    },
    {
      accessorKey: "maxUsers",
      header: "Users",
      cell: ({ row }) => (
        <span className="text-xs text-gray-700 dark:text-gray-300">
          {row.getValue("maxUsers")}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date Created",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span className="text-gray-700 dark:text-gray-300">
            {row.getValue("createdAt")
              ? formatDateTZ(row.getValue("createdAt"), "MMM dd, yyyy, KK:mm a")
              : null}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "admins",
      header: "Admins",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span className="text-gray-700 dark:text-gray-300">
            {row.getValue("admins") ? (
              <>
                <span className="font-medium text-gray-900 dark:text-gray-100 block">
                  {row.getValue<Admin[]>("admins")?.[0]?.name}
                </span>

                <span className="text-sm text-blue-500 dark:text-blue-400 underline underline-offset-2">
                  {row.getValue<Admin[]>("admins")?.[0]?.email}
                </span>
              </>
            ) : null}
          </span>
        </div>
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
      cell: ({ row }) => (
        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-2xl">
              <DropdownMenuItem
                onClick={() =>
                  navigate(`/dashboard/company/${row.original._id}`)
                }
                className="p-3"
              >
                View Company
              </DropdownMenuItem>
              {/* <EditCompanyDialog externalDialog company={row.original}>
                <DropdownMenuItem className="p-3">
                  Edit Company
                </DropdownMenuItem>
              </EditCompanyDialog> */}
              {row.original.status === "active" ? (
                <DialogTrigger asChild>
                  <DropdownMenuItem className="p-3 text-orange-600 dark:text-orange-400">
                    Suspend Company
                  </DropdownMenuItem>
                </DialogTrigger>
              ) : (
                <DialogTrigger asChild>
                  <DropdownMenuItem className="p-3 text-green-600 dark:text-green-400">
                    Activate Company
                  </DropdownMenuItem>
                </DialogTrigger>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <ConfirmAlert
            text={`Are you sure you want to ${
              row.original.status === "active" ? "suspend" : "activate"
            } this company? This will deactivate the company and restrict access.`}
            title={
              row.original.status === "active"
                ? "Suspend Company"
                : "Activate Company"
            }
            type={row.original.status === "active" ? "error" : "info"}
            onPrimaryAction={() =>
              handleUpdateCompanyStatus(
                row.original._id,
                row.original.status === "active" ? "inactive" : "active"
              )
            }
            hideDialog
          />
        </Dialog>
      ),
    },
  ];

  return (
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Companies
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <CreateCompanyDialog />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="All Companies"
          value={companyStats.allCompanies}
          icon={IconMap["building-clock"] as any}
          iconColor="text-gray-600"
          iconBgColor="bg-gray-100"
          onClick={() => {
            setFilters((prev) => ({ ...prev, status: "" }));
            setPagination({ pageIndex: 0, pageSize: 10 });
          }}
        />
        <StatCard
          title="Active Companies"
          value={companyStats.activeCompanies}
          icon={IconMap["building-clock"] as any}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          onClick={() => {
            setFilters((prev) => ({ ...prev, status: "active" }));
            setPagination({ pageIndex: 0, pageSize: 10 });
          }}
        />
        <StatCard
          title="Suspended Companies"
          value={companyStats.suspendedCompanies}
          icon={IconMap["building-clock"] as any}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
          onClick={() => {
            setFilters((prev) => ({ ...prev, status: "inactive" }));
            setPagination({ pageIndex: 0, pageSize: 10 });
          }}
        />
        {/* <StatCard
          title="Pending Companies"
          value={companyStats.pendingCompanies}
          icon={IconMap["building-clock"] as any}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        /> */}
      </div>

      {/* Companies Table */}
      <DataTable
        data={filteredData}
        columns={columns}
        options={{
          manualPagination: true,
          setPagination: setPagination,
          pagination: pagination,
          totalCounts: totalCompanies,
          isLoading: isLoading,
        }}
        emptyPlaceholder={<EmptyState />}
        classNames={{
          container:
            "bg-white dark:bg-slate-950 rounded-xl px-3 border border-gray-300 dark:border-slate-600",
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
                    Companies
                  </h2>
                </div>
                <SearchInput
                  placeholder="Company Name"
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
                        label: "Inactive",
                        value: "inactive",
                      },
                    ],
                  },
                  {
                    title: "Plan",
                    options:
                      plansData?.data.data.data?.map(
                        (plan: SubscriptionPlan) => ({
                          label: plan.name,
                          value: plan._id,
                        })
                      ) || [],
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

export default CompaniesPage;
