import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, MoreHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, putRequest, postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
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
import CreateUserDialog from "./components/CreateUserDialog";
import EditUserDialog from "./components/EditUserDialog";
import UserDetailsSheet from "./components/UserDetailsSheet";
import UserStats from "./components/UserStats";
import { DropdownFilters } from "@/components/layouts/SolicitationFilters";
import { formatDateTZ } from "@/lib/utils";

// User type definition
type User = {
  _id: string;
  name: string;
  email: string;
  role: "Admin" | "Procurement Lead" | "Evaluator" | "Vendor";
  status: "active" | "accepted" | "suspended" | "inactive" | "pending" | "expired";
  lastActivity: string;
  createdAt: string;
  phone?: string;
  department?: string;
  userId?: string;
};

// API response types
export type UsersListResponse = {
  data: Omit<User, "name"> & { firstName: string }[];
  total: number;
  page: number;
  limit: number;
};

// Status badge component
const StatusBadge = ({ status }: { status: User["status"] }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
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

// Role badge component
const RoleBadge = ({ role }: { role: string }) => {
  return (
    <span className={`capitalize`}>
      {/* {getRoleIcon(role.name)} */}
      {role?.replace("_", " ") || "N/A"}
    </span>
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
        No Users Added Yet
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
        Manage your users easily by adding them here. Start by creating a new
        user profile.
      </p>
      <CreateUserDialog />
    </div>
  );
};

const UserManagementPage = () => {
  const toast = useToastHandler();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeactivateUserOpen, setIsDeactivateUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [isActivateUserOpen, setIsActivateUserOpen] = useState(false);
  const [isSuspendUserOpen, setIsSuspendUserOpen] = useState(false);
  const [isUnsuspendUserOpen, setIsUnsuspendUserOpen] = useState(false);

  // Initialize filters from URL parameters
  useEffect(() => {
    const statusParam = searchParams.get("status");
    const roleParam = searchParams.get("role");

    if (
      statusParam &&
      ["active", "inactive", "pending", "suspended"].includes(statusParam)
    ) {
      setStatusFilter(statusParam);
    }

    if (
      roleParam &&
      ["admin", "procurement_lead", "evaluator", "vendor"].includes(roleParam)
    ) {
      setRoleFilter(roleParam);
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
  }, [debouncedSearchQuery, statusFilter, roleFilter]);

  // Note: User dashboard statistics are now handled by the UserStats component

  // Fetch users list
  const { data: usersData, isLoading } = useQuery<
    ApiResponse<UsersListResponse>,
    ApiResponseError
  >({
    queryKey: [
      "users",
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearchQuery,
      statusFilter,
      roleFilter,
    ],
    queryFn: async () =>
      await getRequest({
        url: "/users",
        config: {
          params: {
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            search: debouncedSearchQuery || undefined,
            status: statusFilter || undefined,
            role: roleFilter ? roleFilter : undefined,
          },
        },
      }),
  });

  // Update user status mutation (since there's no delete endpoint, we'll use status update)
  const { mutateAsync: updateUserStatus, isPending: isDeactivatingUser } = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    { userId: string; status: string }
  >({
    mutationKey: ["updateUserStatus"],
    mutationFn: async ({ userId, status }) =>
      await putRequest({ url: `/users/${userId}/status`, payload: { status } }),
    onSuccess: () => {
      toast.success("Success", "User status updated successfully");
      setSelectedUserId(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      setSelectedUserId(null);
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message ?? "Failed to update user status"
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

  // Handle user status update (deactivate user)
  const handleDeactivateUser = async (userId: string) => {
    try {
      await updateUserStatus({ userId, status: "inactive" });
      setIsDeactivateUserOpen(false);
    } catch (error) {
      // Error is already handled in onError callback
    }
  };

  // Handle user status update (activate user)
  const handleActivateUser = async (userId: string) => {
    try {
      await updateUserStatus({ userId, status: "active" });
      setIsActivateUserOpen(false);
    } catch (error) {
      // Error is already handled in onError callback
    }
  };

  // Handle user status update (suspend user)
  const handleSuspendUser = async (userId: string) => {
    try {
      await updateUserStatus({ userId, status: "suspended" });
      setIsSuspendUserOpen(false);
    } catch (error) {
      // Error is already handled in onError callback
    }
  };

  // Handle user status update (unsuspend user -> active)
  const handleUnsuspendUser = async (userId: string) => {
    try {
      await updateUserStatus({ userId, status: "active" });
      setIsUnsuspendUserOpen(false);
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

  // Extract data from API responses
  const users = usersData?.data?.data?.data || [];
  const totalUsers = usersData?.data?.data?.total || 0;

  // Note: Dashboard statistics are now handled by the UserStats component

  // Handle filter changes from dropdown
  const handleFilterChange = (filterTitle: string, value: string) => {
    if (filterTitle === "Role") {
      setRoleFilter(value === "all" ? "" : value);
      // Update URL
      const params = new URLSearchParams(searchParams);
      if (value === "all" || !value) {
        params.delete("role");
      } else {
        params.set("role", value);
      }
      navigate(`/dashboard/users?${params.toString()}`, { replace: true });
    } else if (filterTitle === "Status") {
      setStatusFilter(value === "all" ? "" : value);
      // Update URL
      const params = new URLSearchParams(searchParams);
      if (value === "all" || !value) {
        params.delete("status");
      } else {
        params.set("status", value);
      }
      navigate(`/dashboard/users?${params.toString()}`, { replace: true });
    }
  };

  // Handle local filter changes from UserStats (without page navigation)
  const handleLocalFilterChange = (
    filterType: "status" | "role" | "all",
    filterValue: string
  ) => {
    if (filterType === "all") {
      setStatusFilter("");
      setRoleFilter("");
    } else if (filterType === "status") {
      setStatusFilter(filterValue);
      setRoleFilter(""); // Clear role filter when status is selected
    } else if (filterType === "role") {
      setRoleFilter(filterValue);
      setStatusFilter(""); // Clear status filter when role is selected
    }
  };

  // Get current active filter for UserStats
  const getActiveFilter = () => {
    if (statusFilter) {
      return { type: "status" as const, value: statusFilter };
    }
    if (roleFilter) {
      return { type: "role" as const, value: roleFilter };
    }
    return null;
  };

  // Use API data directly since filtering is now handled server-side
  const filteredData = users;

  // Define table columns
  const columns: ColumnDef<Omit<User, "name"> & { firstName: string }>[] = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {row.original.firstName}
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
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => (
        <span className="text-xs text-gray-700 dark:text-gray-300">
          {row.original.department || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "lastLoginAt",
      header: "Last Activity",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span className="text-gray-700 dark:text-gray-300">
            {row.original.lastActivity
              ? formatDateTZ(row.original.lastActivity, "MMM dd, yyyy pppp")
              : "Never"}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-2xl">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUserId(row.original?.userId ?? "");
                  setIsUserDetailsOpen(true);
                }}
                className="p-3"
              >
                View User
              </DropdownMenuItem>
              {row.original.status === "pending" && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedUser(row.original as any);
                    setIsReminderDialogOpen(true);
                  }}
                  className="p-3"
                >
                  Send Reminder
                </DropdownMenuItem>
              )}
              {row.original.status !== "pending" && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditUserId(row.original?.userId ?? "");
                      setIsEditUserOpen(true);
                    }}
                    className="p-3"
                  >
                    Edit User
                  </DropdownMenuItem>

                  {/* Suspend / Unsuspend */}
                  {row.original.status === "accepted" && (
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUserId(row.original?.userId ?? "");
                        setIsSuspendUserOpen(true);
                      }}
                      className="p-3 text-orange-600"
                    >
                      Suspend User
                    </DropdownMenuItem>
                  )}
                  {row.original.status === "suspended" && (
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUserId(row.original?.userId ?? "");
                        setIsUnsuspendUserOpen(true);
                      }}
                      className="p-3 text-green-600"
                    >
                      Unsuspend User
                    </DropdownMenuItem>
                  )}

                  {/* Deactivate / Activate */}
                  {row.original.status === "accepted" ? (
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUserId(row.original?.userId ?? "");
                        setIsDeactivateUserOpen(true);
                      }}
                      className="p-3 text-red-600 dark:text-red-40"
                    >
                      Deactivate User
                    </DropdownMenuItem>
                  ) : row.original.status === "expired" ? (
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUserId(row.original?.userId ?? "");
                        setIsActivateUserOpen(true);
                      }}
                      className="p-3 text-green-600"
                    >
                      Activate User
                    </DropdownMenuItem>
                  ) : null}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const roles = [
    { label: "Admin", value: "admin" },
    { label: "Procurement Lead", value: "procurement_lead" },
    { label: "Evaluator", value: "evaluator" },
    { label: "Vendor", value: "vendor" },
    { value: "contract_manager", label: "Contract Manager" },
    { value: "view_only", label: "View Only" },
    { value: "approver", label: "Approver" },
  ];

  return (
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Users
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <CreateUserDialog />
        </div>
      </div>

      {/* User Statistics */}
      <UserStats
        onFilterChange={handleLocalFilterChange}
        activeFilter={getActiveFilter()}
      />

      {/* Users Table */}
      <DataTable
        data={filteredData}
        columns={columns as any}
        header={() => (
          <div className="p-6 py-3 w-full border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  size={18}
                />
                <Input
                  placeholder="Search users..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <DropdownFilters
                  filters={[
                    {
                      title: "Role",
                      showIcon: true,
                      options: roles,
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
                  ]}
                  onFilterChange={handleFilterChange}
                  selectedValues={{
                    Role: roleFilter,
                    Status: statusFilter,
                  }}
                />
              </div>
            </div>
          </div>
        )}
        classNames={{
          container:
            "bg-white dark:bg-slate-950 rounded-xl px-3 border border-gray-300 dark:border-slate-600",
          tCell: "text-center",
          tHead: "text-center",
        }}
        options={{
          manualPagination: true,
          setPagination: setPagination,
          pagination: pagination,
          totalCounts: totalUsers,
          isLoading: isLoading,
        }}
        emptyPlaceholder={<EmptyState />}
      />

      {/* User Details Sheet */}
      <UserDetailsSheet
        open={isUserDetailsOpen}
        onOpenChange={setIsUserDetailsOpen}
        userId={selectedUserId || undefined}
        onEdit={(userId) => {
          setEditUserId(userId ?? "");
          setIsEditUserOpen(true);
        }}
        onStatusUpdate={() => {
          // Refetch users data to reflect status changes
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
        }}
        onDelete={() => {
          // Refetch users data to reflect deletion
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
          setSelectedUserId(null);
        }}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={isEditUserOpen}
        onOpenChange={setIsEditUserOpen}
        userId={editUserId || ""}
      />

      <ConfirmAlert
        open={isDeactivateUserOpen}
        onClose={setIsDeactivateUserOpen}
        text="Are you sure you want to deactivate this user? They will no longer be able to access the system."
        title="Deactivate User"
        isLoading={isDeactivatingUser}
        onPrimaryAction={() => handleDeactivateUser(selectedUserId ?? "")}
      />

      <ConfirmAlert
        open={isActivateUserOpen}
        onClose={setIsActivateUserOpen}
        text="Are you sure you want to activate this user? They will regain access to the system."
        title="Activate User"
        isLoading={isDeactivatingUser}
        onPrimaryAction={() => handleActivateUser(selectedUserId ?? "")}
      />

      <ConfirmAlert
        open={isSuspendUserOpen}
        onClose={setIsSuspendUserOpen}
        text="Are you sure you want to suspend this user? They will be temporarily blocked from accessing the system."
        title="Suspend User"
        isLoading={isDeactivatingUser}
        onPrimaryAction={() => handleSuspendUser(selectedUserId ?? "")}
      />

      <ConfirmAlert
        open={isUnsuspendUserOpen}
        onClose={setIsUnsuspendUserOpen}
        text="Are you sure you want to unsuspend this user? Their status will return to active."
        title="Unsuspend User"
        isLoading={isDeactivatingUser}
        onPrimaryAction={() => handleUnsuspendUser(selectedUserId ?? "")}
      />

      {/* Send Reminder Dialog */}
      <ConfirmAlert
        text={`Send a reminder email to ${selectedUser?.name} (${selectedUser?.email}) about their pending invite?`}
        title="Send Reminder Invite"
        open={isReminderDialogOpen}
        type="alert"
        onClose={setIsReminderDialogOpen}
        onPrimaryAction={() => {
          if (selectedUser) {
            handleSendReminderInvite(selectedUser.email);
          }
        }}
        isLoading={isSendingReminder}
      />
    </div>
  );
};

export default UserManagementPage;
