import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteRequest, getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { PageLoader } from "@/components/ui/PageLoader";
import EditUserDialog from "./EditUserDialog";

interface AdminDetails {
  details?: {
    company?: string;
    lastLoginAt?: string;
    lastLogin?: string;
    status: "pending" | "active" | "inactive" | "suspended";
    userId?: string;
    dateCreated?: string;
    createdAt: string;
    updatedAt: string;
    _id: string;
    email: string;
    companyId: string;
    name: string;
    role: { _id: string, name: string };
  };
  createdUsers?: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
  }>;
}

interface AdminDetailsSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  adminId?: string;
  admin?: AdminDetails | null;
  children?: React.ReactNode;
  onStatusUpdate?: (adminId: string, status: "active" | "inactive" | "suspended") => void;
  onDelete?: (adminId: string) => void;
  isUpdatingAdminStatus?: boolean;
}

const AdminDetailsSheet: React.FC<AdminDetailsSheetProps> = ({
  open,
  onOpenChange,
  adminId,
  children,
  onStatusUpdate,
  onDelete,
  isUpdatingAdminStatus
}) => {
  // All hooks must be called before any conditional logic
  const toast = useToastHandler();
  const queryClient = useQueryClient();
  
  // Fetch admin details from API
  const {
    data: adminDetailsResponse,
    isLoading: isLoadingAdminDetails,
    error: adminDetailsError,
  } = useQuery<ApiResponse<AdminDetails>, ApiResponseError>({
    queryKey: ["admin-details", adminId],
    queryFn: async () => await getRequest({ url: `/admins/${adminId}` }),
    enabled: !!adminId && !!open,
  });
  
  // Use fetched data or fallback to passed admin prop
  const adminData = adminDetailsResponse?.data?.data?.details;
  const [_, setIsActive] = useState(adminData?.status === "active");
  
  const deleteMutation = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    string
  >({
    mutationFn: (adminId: string) =>
      deleteRequest({ url: `/delete/${adminId}` }),
    onSuccess: (result) => {
      toast.success(
        "Delete Admin",
        result.data.message ?? "Admin deleted successfully"
      );
      if (onDelete && adminData) {
        onDelete(adminData._id);
      }
      onOpenChange?.(false);
    },
    onError: (error) => {
      toast.error("Delete Admin", error);
    },
  });

  // Early return after all hooks
  if (!adminData && !isLoadingAdminDetails) {
    return null;
  }
  
  // Show loading state
  if (isLoadingAdminDetails) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {children && <SheetTrigger asChild>{children}</SheetTrigger>}
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
          <PageLoader 
            title="Admin Details"
            message="Loading admin details..."
            className="p-6"
          />
        </SheetContent>
      </Sheet>
    );
  }
  
  // Show error state
  if (adminDetailsError && !adminData) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {children && <SheetTrigger asChild>{children}</SheetTrigger>}
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
          <SheetHeader className="px-6 py-4">
            <SheetTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Error Loading Admin Details
            </SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-center h-64">
            <p className="text-red-600 dark:text-red-400">Failed to load admin details</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  if (!adminData) {
    return null;
  }

  // Map role for display
  const displayRole =
    adminData.role.name === "company_admin"
      ? "Company Admin"
      : adminData.role.name === "super_admin"
      ? "Super Admin"
      : adminData.role.name;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "Active":
        return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/30";
      case "inactive":
      case "Inactive":
      case "Suspended":
        return "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/30";
      case "pending":
      case "Pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/30";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-800";
    }
  };

  const handleActivateUser = () => {
    if (onStatusUpdate && adminData) {
      onStatusUpdate(adminData._id || adminData._id!, "active");
      setIsActive(true);
    }
  };

  const handleSuspendUser = () => {
    if (onStatusUpdate && adminData) {
      onStatusUpdate(adminData._id || adminData._id!, "suspended");
      setIsActive(false);
    }
  };

  const handleDeleteUser = async () => {
    if (adminData) {
      await deleteMutation.mutateAsync(adminData._id || adminData._id!);
    }
  };

  const handleUserUpdate = (adminId: string) => {
    // Invalidate queries to refresh data after user update
    queryClient.invalidateQueries({ queryKey: ["dashboard-count"] });
    queryClient.invalidateQueries({ queryKey: ["admins"] });
    queryClient.invalidateQueries({ queryKey: ["admin-details", adminId] });
    onOpenChange?.(false)
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-auto">
        {/* Header */}
        <SheetHeader className="px-6 py-4 ">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Company Admin Details
            </SheetTitle>
      
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Admin Header */}
          <div className="px-6 py-6 ">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {adminData.name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {adminData.userId || adminData._id || adminData._id}
                  </p>
                </div>
              </div>
              <Badge
                className={`${getStatusColor(
                  adminData.status
                )} border-0 px-3 py-1`}
              >
                {adminData.status === "active"
                  ? "Active"
                  : adminData.status === "inactive"
                  ? "Inactive"
                  : "Pending"}
              </Badge>
            </div>
          </div>

          {/* Basic Information */}
          <div className="px-6 py-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Basic Information
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                  Name
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {adminData.name}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                  Email Address
                </label>
                <p className="text-sm text-blue-600 dark:text-blue-400 underline underline-offset-2">
                  {adminData.email}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                  Role
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {displayRole}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                  Status
                </label>
                <Badge
                  className={`${getStatusColor(
                    adminData.status
                  )} border-0 px-3 py-1`}
                >
                  {adminData.status === "active"
                    ? "Active"
                    : adminData.status === "inactive"
                    ? "Inactive"
                    : adminData.status === "suspended"
                    ? "Suspended"
                    : "Pending"}
                </Badge>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                  Company
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {adminData.company || "-"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                  User ID
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {adminData.userId || adminData._id}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                  Date Created
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {adminData.dateCreated ||
                    (adminData.createdAt
                      ? new Date(adminData.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "-")}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                  Last Activity
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {adminData.lastLogin ||
                    (adminData.lastLoginAt
                      ? new Date(adminData.lastLoginAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "Never")}
                </p>
              </div>
            </div>
          </div>

          {/* User Activity */}
          <div className="px-6 py-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              User Activity
            </h2>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                Number of users created
              </label>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {adminDetailsResponse?.data?.data?.createdUsers?.length || 0}
              </p>
            </div>
          </div>
          
          {/* Created Users List */}
          {/* {adminDetailsResponse?.data?.data?.createdUsers && adminDetailsResponse?.data?.data?.createdUsers.length > 0 && (
            <div className="px-6 py-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Created Users
              </h2>
              <div className="space-y-3">
                {adminDetailsResponse?.data?.data?.createdUsers.slice(0, 5).map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email} • {user.role}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(user.status)} border-0 px-2 py-1 text-xs`}>
                      {user.status}
                    </Badge>
                  </div>
                ))}
                {adminDetailsResponse?.data?.data?.createdUsers.length > 5 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    +{adminDetailsResponse?.data?.data?.createdUsers.length - 5} more users
                  </p>
                )}
              </div>
            </div>
          )} */}

          {/* Action Buttons */}
          <div className="px-6 py-6">
            <div className="flex space-x-3">
              <EditUserDialog
                admin={adminData}
                onUserUpdate={handleUserUpdate}
              >
                <Button
                  variant="outline"
                  className="flex-1"
                >
                  Edit User
                </Button>
              </EditUserDialog>
              {adminData.status === "active" ? (
                <ConfirmAlert
                  title="Suspend Admin"
                  text="Are you sure you want to suspend this admin? They will lose access to the system."
                  type="warning"
                  onPrimaryAction={handleSuspendUser}
                  isLoading={isUpdatingAdminStatus}
                  trigger={
                    <Button
                      variant="outline"
                      className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/20"
                    >
                      Suspend User
                    </Button>
                  }
                ></ConfirmAlert>
              ) : (
                <ConfirmAlert
                  title="Activate Admin"
                  text="Are you sure you want to activate this admin? They will regain access to the system."
                  type="success"
                  onPrimaryAction={handleActivateUser}
                  isLoading={isUpdatingAdminStatus}
                  trigger={
                    <Button
                      variant="outline"
                      className="flex-1 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
                    >
                      Activate User
                    </Button>
                  }
                ></ConfirmAlert>
              )}
              <ConfirmAlert
                title="Delete Admin"
                text="Are you sure you want to delete this admin? This action cannot be undone."
                type="delete"
                onPrimaryAction={handleDeleteUser}
                isLoading={deleteMutation.isPending}
                  primaryButtonText={
                    deleteMutation.isPending ? "Deleting..." : "Yes"
                  }
                  trigger={
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={deleteMutation.isPending || isLoadingAdminDetails}
                    >
                      Delete User
                    </Button>
                  }
                ></ConfirmAlert>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdminDetailsSheet;
