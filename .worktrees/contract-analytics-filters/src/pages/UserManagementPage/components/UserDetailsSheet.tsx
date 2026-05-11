import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteRequest, getRequest, putRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { PageLoader } from "@/components/ui/PageLoader";
import { formatDateTZ } from "@/lib/utils";


interface UserDetails {
  _id: string;
  companyId: string;
  name: string;
  email: string;
  role: string;
  lastLoginAt?: string;
  phone?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
  employeeId?: string;
  user_id: string;
  solicitationsCreated?: number;
  activeSolicitations?: number;
  closedSolicitations?: number;
  awardedSolicitations?: number;
  activeEvaluations?: number;
  completedEvaluations?: number;
  status: "pending" | "active" | "inactive" | "expired";
}



export interface UserActivityResponse {
  activity: Activity[];
}

export interface Data {
  activity: Activity[];
}

export interface Activity {
  count:  number;
  status: string;
  title?: string;
}


interface UserDetailsSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  userId?: string;
  children?: React.ReactNode;
  onStatusUpdate?: (userId: string, status: "active" | "inactive") => void;
  onDelete?: (userId: string) => void;
  onEdit?: (userId: string) => void;
}

const UserDetailsSheet: React.FC<UserDetailsSheetProps> = ({
  open,
  onOpenChange,
  userId,
  children,
  onStatusUpdate,
  onDelete,
  onEdit,
}) => {
  const queryClient = useQueryClient();
  const toast = useToastHandler();
  const [showSuspendAlert, setShowSuspendAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Fetch user details from API
  const {
    data: userDetailsResponse,
    isLoading: isLoadingUserDetails,
    error: userDetailsError,
  } = useQuery<ApiResponse<{ user: UserDetails }>, ApiResponseError>({
    queryKey: ["user-details", userId],
    queryFn: async () => await getRequest({ url: `/users/${userId}` }),
    enabled: !!userId && !!open,
  });

  const userData = userDetailsResponse?.data?.data?.user;

  // Fetch user activity from API
  const {
    data: userActivityResponse,
    isLoading: isLoadingUserActivity,
    error: userActivityError,
  } = useQuery<ApiResponse<UserActivityResponse>, ApiResponseError>({
    queryKey: ["user-activity", userId],
    queryFn: async () => await getRequest({ url: `/users/activity/${userId}` }),
    enabled: !!userId && !!open,
  });

  const userActivity: Activity[] = userActivityResponse?.data?.data?.activity ?? [];
  // Map of activity status to human-friendly labels
  const activityLabelMap: Record<string, string> = {
    solicitations_created: "Number of Solicitations created",
    active_solicitations: "Active Solicitations",
    closed_solicitations: "Closed Solicitations",
    awarded_solicitations: "Awarded Solicitations",
    active_evaluations: "Active Evaluation",
    completed_evaluations: "Completed Evaluations",
  };

  // Status update mutation
  const statusMutation = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    { userId: string; status: "active" | "inactive" }
  >({
    mutationFn: ({ userId, status }) =>
      putRequest({ url: `/users/${userId}/status`, payload: { status } }),
    onSuccess: (result, variables) => {
      toast.success(
        "Update User Status",
        result.data.message ?? "User status updated successfully"
      );
      if (onStatusUpdate) {
        onStatusUpdate(variables.userId, variables.status);
      }
      queryClient.invalidateQueries({ queryKey: ["user-details", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowSuspendAlert(false);
    },
    onError: (error) => {
      toast.error("Update User Status", error);
      setShowSuspendAlert(false);
    },
  });

  const deleteMutation = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    string
  >({
    mutationFn: (userId: string) => deleteRequest({ url: `/users/${userId}` }),
    onSuccess: (result) => {
      toast.success(
        "Delete User",
        result.data.message ?? "User deleted successfully"
      );
      if (onDelete && userData) {
        onDelete(userData._id);
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowDeleteAlert(false);
      onOpenChange?.(false);
    },
    onError: (error) => {
      toast.error("Delete User", error);
      setShowDeleteAlert(false);
    },
  });

  // Show loading state
  if (isLoadingUserDetails) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {children && <SheetTrigger asChild>{children}</SheetTrigger>}
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
          <SheetHeader className="px-6 py-4">
            <SheetTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Loading User Details...
            </SheetTitle>
          </SheetHeader>
          <PageLoader 
            showHeader={false}
            message="Loading user details..."
            className="px-6"
          />
        </SheetContent>
      </Sheet>
    );
  }

  // Show error state
  if (userDetailsError && !userData) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {children && <SheetTrigger asChild>{children}</SheetTrigger>}
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
          <SheetHeader className="px-6 py-4">
            <SheetTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Error Loading User Details
            </SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-center h-64">
            <p className="text-red-600 dark:text-red-400">
              Failed to load user details
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!userData) {
    return null;
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "company_admin":
        return "Company Admin";
      case "procurement":
        return "Procurement Lead";
      case "evaluator":
        return "Evaluator";
      case "contract_manager":
        return "Contract Manager";
      case "view_only":
        return "View Only";
      case "approver":
        return "Approver";
      case "super_admin":
        return "Super Admin";
      default:
        return "User";
    }
  };

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

  const handleStatusUpdate = (status: "active" | "inactive") => {
    if (userData) {
      statusMutation.mutate({ userId: userData._id, status });
    }
  };

  const handleDeleteUser = async () => {
    if (userData) {
      await deleteMutation.mutateAsync(userData._id);
    }
  };

  const formatDate = (dateString: string) => {
    return dateString ? formatDateTZ(dateString, "MMM d, yyyy, pppp") : "N/A";
  };

  const formatDateTime = (dateString: string) => dateString ? formatDateTZ(dateString, "MMM d, yyyy, pppp") : "N/A";
  

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        {children && <SheetTrigger asChild>{children}</SheetTrigger>}
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
          {userData ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  User Details
                </h2>
              </div>

              <div className="p-6">
                {/* User Header */}
                <div className="flex items-start space-x-4 mb-8">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold">
                      {userData.name
                        ?.split(" ")
                        ?.map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {userData.name}
                    </h3>
                    {/* <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {userData ? `${userData._id}` : "Loading..."}
                    </p> */}
                  </div>
                  <Badge
                    className={`${getStatusColor(
                      userData.status
                    )} border-0 px-3 py-1 text-xs`}
                  >
                    {userData.status === "active"
                      ? "Active"
                      : userData.status === "inactive"
                      ? "Suspended"
                      : "Pending"}
                  </Badge>
                </div>

                {/* Basic Information */}
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Basic Information
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Name
                        </label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                          {userData.name}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Email Address
                        </label>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 break-all">
                          {userData.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Role
                        </label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                          {getRoleDisplayName(userData.role)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Status
                        </label>
                        <div className="mt-1">
                          <Badge
                            className={`${getStatusColor(
                              userData.status
                            )} border-0 px-3 py-1 text-xs`}
                          >
                            {userData.status === "active"
                              ? "Active"
                              : userData.status === "inactive"
                              ? "Suspended"
                              : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Phone Number
                        </label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                          {userData.phone || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Employee ID
                        </label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                          {userData
                            ? `USR-${userData._id?.slice?.(-6).toUpperCase()}`
                            : "Loading..."}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Date Created
                        </label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                          {formatDate(userData.createdAt)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Last Activity
                        </label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                          {userData.lastLoginAt
                            ? formatDateTime(userData.lastLoginAt)
                            : "No recent activity"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Activity */}
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    User Activity
                  </h4>
                  {isLoadingUserActivity ? (
                    <PageLoader 
                      showHeader={false}
                      message="Loading activity..."
                      className="h-32"
                    />
                  ) : userActivityError ? (
                    <div className="text-center text-red-600 dark:text-red-400 py-8">
                      Failed to load user activity
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {userActivity.map((item) => (
                        <div key={item.status}>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {item.title ?? activityLabelMap[item.status] ?? item.status.replace(/_/g, " ")}
                          </label>
                          <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                            {item.count}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 flex items-center gap-3 mt-10">
                  <Button
                    variant="outline"
                    className="w-full justify-center text-sm font-medium"
                    onClick={() => onEdit?.(userData._id)}
                  >
                    Edit User
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-center text-sm font-medium"
                    onClick={() => setShowSuspendAlert(true)}
                    disabled={statusMutation.isPending}
                  >
                    {userData.status === "active"
                      ? "Suspend User"
                      : "Activate User"}
                  </Button>

                  <Button
                    variant="destructive"
                    className="w-full justify-center text-sm font-medium"
                    onClick={() => setShowDeleteAlert(true)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete User
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <PageLoader 
              showHeader={false}
              message="Loading user details..."
              className="h-64"
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Suspend/Activate Confirmation */}
      <ConfirmAlert
        open={showSuspendAlert}
        onClose={setShowSuspendAlert}
        title={`${userData?.status === "active" ? "Suspend" : "Activate"} User`}
        text={`Are you sure you want to ${
          userData?.status === "active" ? "suspend" : "activate"
        } ${userData?.name}? This action can be reversed later.`}
        type={userData?.status === "active" ? "warning" : "success"}
        isLoading={statusMutation.isPending}
        primaryButtonText={
          userData?.status === "active" ? "Suspend" : "Activate"
        }
        onPrimaryAction={() => {
          if (userData) {
            handleStatusUpdate(
              userData.status === "active" ? "inactive" : "active"
            );
          }
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmAlert
        open={showDeleteAlert}
        onClose={setShowDeleteAlert}
        title="Delete User"
        text={`Are you sure you want to delete ${userData?.name}? This action cannot be undone and will permanently remove all user data.`}
        type="delete"
        isLoading={deleteMutation.isPending}
        primaryButtonText="Delete"
        onPrimaryAction={handleDeleteUser}
      />
    </>
  )
}


export default UserDetailsSheet;
