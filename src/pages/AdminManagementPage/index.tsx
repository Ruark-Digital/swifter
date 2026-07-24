import { Button } from "@/components/ui/button";
import { Users, MoreHorizontal } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRequest,
  deleteRequest,
  putRequest,
  postRequest,
} from "@/lib/axiosInstance";
import { format as formatDate, startOfDay, subDays, endOfDay } from "date-fns";
import { ApiList, ApiResponse, ApiResponseError } from "@/types";
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
import CreateAdminDialog from "./components/CreateAdminDialog";
import AdminDetailsSheet from "./components/AdminDetailsSheet";
import { DropdownFilters } from "@/components/layouts/SolicitationFilters";
import { SearchInput } from "@/components/layouts/SearchInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { IconMap } from "@/components/layouts/RoleBasedDashboard/components/StatsCard";
import { SuperAdminDashboardCount } from "@/hooks/useDashboardData";
import { Calendar } from "@/components/ui/calendar";
import { formatDateTZ } from "@/lib/utils";

// Admin type definition
type Admin = {
  _id: string;
  id?: string;
  adminId?: string;
  name: string;
  email: string;
  role: string;
  companyId?: string;
  company?: string;
  lastLoginAt?: string;
  lastLogin?: string;
  status: "pending" | "accepted" | "inactive";
  userId?: string;
  dateCreated?: string;
  createdAt: string;
  updatedAt: string;
  userActivity?: {
    numberOfUsersCreated: number;
  };
};

// Status badge component
const StatusBadge = ({ status }: { status: Admin["status"] }) => {
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
      {status}
    </Badge>
  );
};

// Empty state component
const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 h-full">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
        <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">
        No Admins Added Yet
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
        Manage your administrators easily by adding them here. Start by creating
        a new admin profile.
      </p>
      <CreateAdminDialog />
    </div>
  );
};

const AdminManagementPage = () => {
  const toast = useToastHandler();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isAdminDetailsOpen, setIsAdminDetailsOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Initialize filters from URL parameters
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (
      roleParam &&
      ["admin", "super_admin", "company_admin"].includes(roleParam)
    ) {
      setFilters((prev) => ({ ...prev, Role: roleParam }));
    }
  }, [searchParams]);
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

  // Reset pagination when search or filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearchQuery, filters]);

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

    setFilters((prev) => ({
      ...prev,
      [filterTitle]: value,
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
    }
    setIsDatePickerOpen(false);
  };

  // Handle date range cancellation
  const handleDateRangeCancel = () => {
    // Reset temp date range
    setTempDateRange({
      from: dateRange.startDate,
      to: dateRange.endDate,
    });
    setIsDatePickerOpen(false);
  };

  // Fetch admins dashboard statistics
  const { data: dashboardData } = useQuery<
    ApiResponse<SuperAdminDashboardCount>,
    ApiResponseError
  >({
    queryKey: ["dashboard-count"],
    queryFn: async () => await getRequest({ url: "/companies/dashboard" }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch admins list
  const { data: adminsData, isLoading } = useQuery<
    ApiResponse<ApiList<Admin>>,
    ApiResponseError
  >({
    queryKey: [
      "admins",
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearchQuery,
      filters,
      dateRange,
    ],
    queryFn: async () => {
      // Prepare filter parameters
      const params: Record<string, any> = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearchQuery || undefined,
      };

      // Add status filter if selected
      if (filters.Status) {
        params.status = filters.Status;
      }

      // Add role filter if selected
      if (filters.Role) {
        params.role = filters.Role;
      }

      // Add date range if selected
      const start = dateRange.startDate
        ? formatDate(dateRange.startDate, "yyyy-MM-dd")
        : undefined;
      const end = dateRange.endDate
        ? formatDate(dateRange.endDate, "yyyy-MM-dd")
        : undefined;
      if (start || end) {
        params.date = `${start ?? ""}-${end ?? ""}`;
      }

      return await getRequest({
        url: "/admins",
        config: { params },
      });
    },
  });

  // Delete admin mutation
  const { mutateAsync: deleteAdmin, isPending: isDeletingAdmin } = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    string
  >({
    mutationKey: ["deleteAdmin"],
    mutationFn: async (adminId) =>
      await deleteRequest({ url: `/admins/${adminId}` }),
    onSuccess: () => {
      toast.success("Success", "Admin deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: (error) => {
      console.log(error);
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message ?? "Failed to delete admin"
      );
    },
  });

  // Update admin status mutation
  const { mutateAsync: updateAdminStatus, isPending: isUpdatingAdminStatus } =
    useMutation<
      ApiResponse<any>,
      ApiResponseError,
      { adminId: string; status: "active" | "inactive" | "suspended" }
    >({
      mutationKey: ["updateAdminStatus"],
      mutationFn: async ({ adminId, status }) =>
        await putRequest({
          url: `/admins/${adminId}/status`,
          payload: { status },
        }),
      onSuccess: () => {
        toast.success("Success", "Admin status updated successfully");
        queryClient.invalidateQueries({ queryKey: ["admins"] });
        queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      },
      onError: (error) => {
        const err = error as ApiResponseError;
        toast.error(
          "Error",
          err?.response?.data?.message ?? "Failed to update admin status"
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

  // Handle admin deletion
  const handleDeleteAdmin = async (adminId: string) => {
    try {
      await deleteAdmin(adminId);
    } catch (error) {
      // Error is already handled in onError callback
    }
  };

  // Handle admin status update
  const handleUpdateAdminStatus = async (
    adminId: string,
    status: "active" | "inactive" | "suspended"
  ) => {
    try {
      await updateAdminStatus({ adminId, status });
    } catch (error) {
      // Error is already handled in onError callback
    }
  };

  // Handle sending reminder invite
  const handleSendReminderInvite = async (email: string) => {
    try {
      await sendReminderInvite(email);
      setIsReminderDialogOpen(false);
    } catch (error) {
      // Error is already handled in onError callback
    }
  };

  // Handle opening admin details
  const handleViewAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsAdminDetailsOpen(true);
  };

  // Extract data from API responses
  const adminStats = {
    allAdmins:
      (dashboardData?.data?.data.users.super_admin || 0) +
      (dashboardData?.data?.data.users.company_admin || 0),
    superAdmins: dashboardData?.data?.data.users?.super_admin || 0,
    companyAdmins: dashboardData?.data?.data.users?.company_admin || 0,
  };

  const admins = adminsData?.data?.data?.data || [];
  const totalAdmins = adminsData?.data?.data?.total || 0;

  // Filter data based on search query (for client-side filtering if needed)
  const filteredData = useMemo(() => {
    return admins;
  }, [admins]);

  // Define table columns
  const columns: ColumnDef<Admin>[] = [
    {
      accessorKey: "name",
      header: "Admins",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {row.original.name}
          </span>
          <span className="text-sm text-blue-500 dark:text-blue-400 underline underline-offset-2">
            {row.original.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.original.role.replace("_", " ")}
        </span>
      ),
    },
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.original.company}
        </span>
      ),
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.original.lastLogin
            ? formatDateTZ(row.original.lastLogin, "MMM dd, yyyy HH:mm")
            : "Never"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const displayStatus =
          status === "accepted"
            ? "Active"
            : status === "inactive"
            ? "Inactive"
            : "Pending";
        return (
          <StatusBadge
            status={
              displayStatus.toLowerCase() as "accepted" | "inactive" | "pending"
            }
          />
        );
      },
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
                onClick={() => handleViewAdmin(row.original)}
                className="p-3"
              >
                View Admin
              </DropdownMenuItem>
              {row.original.status === "pending" && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedAdmin(row.original);
                    setIsReminderDialogOpen(true);
                  }}
                  className="p-3"
                >
                  Send Reminder
                </DropdownMenuItem>
              )}

              {row.original.role === "admin" ? (
                <>
                  <DropdownMenuItem
                    onSelect={() => setIsSuspendDialogOpen(true)}
                    className="p-3 text-red-600 dark:text-red-400"
                  >
                    Suspend
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={() => setIsDeleteDialogOpen(true)}
                    className="p-3 text-red-600 dark:text-red-400"
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              ) : null}

            </DropdownMenuContent>
          </DropdownMenu>
          <ConfirmAlert
            text="Are you sure you want to delete this admin? This action cannot be undone."
            title="Delete Admin"
            type="delete"
            open={isDeleteDialogOpen}
            onPrimaryAction={() => handleDeleteAdmin(row.original._id)}
            isLoading={isDeletingAdmin}
          ></ConfirmAlert>

          <ConfirmAlert
            text="Are you sure you want to suspend this admin? This action cannot be undone."
            title="Suspend Admin"
            type="warning"
            open={isSuspendDialogOpen}
            onPrimaryAction={() =>
              handleUpdateAdminStatus(row.original._id, "inactive")
            }
            isLoading={isUpdatingAdminStatus}
          ></ConfirmAlert>
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
            Admin Management
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <CreateAdminDialog />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="All Admins"
          value={adminStats.allAdmins}
          icon={IconMap?.users as any}
          iconColor="text-gray-600"
          iconBgColor="bg-gray-100"
          onClick={() => {
            setFilters((prev) => ({ ...prev, Role: "" }));
            setPagination({ pageIndex: 0, pageSize: 10 });
          }}
        />
        <StatCard
          title="Super Admins"
          value={adminStats.superAdmins}
          icon={IconMap?.user as any}
          iconColor="text-gray-600"
          iconBgColor="bg-gray-100"
          onClick={() => {
            setFilters((prev) => ({ ...prev, Role: "super_admin" }));
            setPagination({ pageIndex: 0, pageSize: 10 });
          }}
        />
        <StatCard
          title="Company Admins"
          value={adminStats.companyAdmins}
          icon={IconMap?.user as any}
          iconColor="text-gray-600"
          iconBgColor="bg-gray-100"
          onClick={() => {
            setFilters((prev) => ({ ...prev, Role: "company_admin" }));
            setPagination({ pageIndex: 0, pageSize: 10 });
          }}
        />
      </div>

      {/* Search and Filter */}

      {/* Admins Table */}
      <DataTable
        data={filteredData}
        columns={columns}
        options={{
          manualPagination: true,
          setPagination: setPagination,
          pagination: pagination,
          totalCounts: totalAdmins,
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
                    Admins
                  </h2>
                </div>
                <SearchInput
                  placeholder="Admin"
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
                  {
                    title: "Role",
                    options: [
                      {
                        label: "Company Admin",
                        value: "company_admin",
                      },
                      {
                        label: "Super Admin",
                        value: "super_admin",
                      },
                    ],
                  },
                ]}
                onFilterChange={handleFilterChange}
                selectedValues={filters}
              />
            </div>
          </div>
        )}
      />

      {/* Admin Details Sheet */}
      <AdminDetailsSheet
        open={isAdminDetailsOpen}
        isUpdatingAdminStatus={isUpdatingAdminStatus}
        onOpenChange={setIsAdminDetailsOpen}
        adminId={selectedAdmin?.adminId || selectedAdmin?.id}
        onStatusUpdate={handleUpdateAdminStatus}
        onDelete={handleDeleteAdmin}
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

      {/* Send Reminder Dialog */}
      <ConfirmAlert
        text={`Send a reminder email to ${selectedAdmin?.name} (${selectedAdmin?.email}) about their pending invite?`}
        title="Send Reminder Invite"
        open={isReminderDialogOpen}
        type="alert"
        onClose={setIsReminderDialogOpen}
        onPrimaryAction={() => {
          if (selectedAdmin) {
            handleSendReminderInvite(selectedAdmin.email);
          }
        }}
        isLoading={isSendingReminder}
      />
    </div>
  );
};

export default AdminManagementPage;
