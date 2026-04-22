import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { DataTable } from "@/components/layouts/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ChangePlanDialog } from "./components/ChangePlanDialog";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import { useToastHandler } from "@/hooks/useToaster";
import { useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { formatDateTZ } from "@/lib/utils";

// Subscription type definition
export interface Subscription {
  _id: string;
  companyId: CompanyID;
  __v: number;
  createdAt: string;
  maxUsers: number;
  plan: Plan;
  status: string;
  updatedAt: string;
  expiryDate: string;
  usersUsed: number;
}

export interface CompanyID {
  _id: string;
  name: string;
}

export interface Plan {
  _id: string;
  name: string;
  features: any[];
  maxUsers: number;
  price: number;
}

// Action log type definition based on API schema
type ActionLog = {
  action: string;
  createdAt: string;
  performedBy: {
    name: string;
  };
};

// Action log columns definition
const actionLogColumns: ColumnDef<ActionLog>[] = [
  {
    accessorKey: "createdAt",
    header: "Date & Time",
    cell: ({ row }) => {
      const dateValue = row.getValue("createdAt") as string;
      return (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {formatDateTZ(dateValue, "yyyy-MM-dd HH:mm:ss")}
        </span>
      );
    },
  },
  {
    accessorKey: "action",
    header: "Action Taken",
    cell: ({ row }) => (
      <span className="text-sm text-gray-900 dark:text-gray-100">
        {row.getValue("action")}
      </span>
    ),
  },
  {
    accessorKey: "performedBy",
    header: "Performed By",
    cell: ({ row }) => {
      const performedBy = row.getValue("performedBy") as { name: string };
      return (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {performedBy?.name || "Unknown"}
        </span>
      );
    },
  },
];

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
    <Badge
      className={`${getStatusColor(
        status
      )} border-0 px-3 py-1 text-sm font-medium`}
    >
      {getDisplayStatus(status)}
    </Badge>
  );
};

const SubscriptionDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const toast = useToastHandler();
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false);

  // Fetch subscription details
  const { data: subscriptionData, isLoading } = useQuery<
    ApiResponse<Subscription>,
    ApiResponseError
  >({
    queryKey: ["subscription", id],
    queryFn: async () => await getRequest({ url: `/subscriptions/${id}` }),
    enabled: !!id,
  });

  // Fetch subscription logs
  const { data: subscriptionLogsData, isLoading: isLogsLoading } = useQuery<
    ApiResponse<ActionLog[]>,
    ApiResponseError
  >({
    queryKey: ["subscription-logs"],
    queryFn: async () => await getRequest({ url: `/subscriptions/logs` }),
  });

  // Mutation for suspending/reactivating subscription
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
      queryClient.invalidateQueries({ queryKey: ["subscription", id] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      const action = variables.status === "active" ? "reactivated" : "suspended";
      toast.success("Status Updated", `Subscription ${action} successfully`);
      setIsSuspendDialogOpen(false);
      setIsReactivateDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Status Update Failed", error);
      setIsSuspendDialogOpen(false);
      setIsReactivateDialogOpen(false);
    },
  });

  const subscription = subscriptionData?.data?.data;

  const formatDate = (dateString: string) => {
    try {
      const v = formatDateTZ(dateString, "MMMM dd, yyyy");
      return v === "N/A" ? dateString : v;
    } catch {
      return dateString;
    }
  };

  const handleSuspendSubscription = () => {
    if (subscription) {
      updateStatusMutation.mutate({ id: subscription._id, status: "suspended" });
    }
  };

  const handleReactivateSubscription = () => {
    if (subscription) {
      updateStatusMutation.mutate({ id: subscription._id, status: "active" });
    }
  };

  if (isLoading) {
    return (
      <PageLoader 
        title="Subscription Details" 
        message="Loading subscription details..."
        className="p-6 min-h-full"
      />
    );
  }

  if (!subscription) {
    return (
      <div className="p-6 min-h-full">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Subscription Not Found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            The subscription you're looking for doesn't exist or has been
            removed.
          </p>
          <Button onClick={() => navigate("/dashboard/subscription")}>
            Back to Subscriptions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <button
          onClick={() => navigate("/dashboard/subscription")}
          className="hover:text-gray-700 dark:hover:text-gray-300"
        >
          Subscriptions
        </button>
        <span>→</span>
        <span className="text-gray-900 dark:text-gray-100">
          {subscription?.companyId.name}
        </span>
        <span>→</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">
          Subscription Details
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5">
            {subscription?.companyId.name}
          </h1>
          <ChangePlanDialog
            subscriptionId={subscription._id}
            currentPlan={{
              _id: subscription.plan._id,
              name: subscription.plan.name,
            }}
          >
            <Button
              variant="outline"
              className="bg-gray-100 dark:bg-gray-800 mr-3"
            >
              Change Plan
            </Button>
          </ChangePlanDialog>
          {subscription.status === "suspended" ? (
            <ConfirmAlert
              title="Reactivate Subscription"
              text={`Are you sure you want to reactivate this subscription? The company will regain access to the platform.`}
              primaryButtonText="Reactivate"
              secondaryButtonText="Cancel"
              type="info"
              open={isReactivateDialogOpen}
              onClose={setIsReactivateDialogOpen}
              onPrimaryAction={handleReactivateSubscription}
              isLoading={updateStatusMutation.isPending}
              trigger={
                <Button 
                  className="text-white"
                  onClick={() => setIsReactivateDialogOpen(true)}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? "Processing..." : "Reactivate Plan"}
                </Button>
              }
            />
          ) : (
            <ConfirmAlert
              title="Suspend Subscription"
              text={`Are you sure you want to suspend this subscription? The company will lose access to the platform.`}
              primaryButtonText="Suspend"
              secondaryButtonText="Cancel"
              type="warning"
              open={isSuspendDialogOpen}
              onClose={setIsSuspendDialogOpen}
              onPrimaryAction={handleSuspendSubscription}
              isLoading={updateStatusMutation.isPending}
              trigger={
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => setIsSuspendDialogOpen(true)}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? "Processing..." : "Suspend Plan"}
                </Button>
              }
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={subscription.status} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 bg-transparent p-0 w-full justify-start">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="action-log"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Action Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Main Content */}
          <div className="space-y-10">
            {/* Subscription Details Card */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Subscription Details
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                      Company Name
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {subscription.companyId?.name || "AIG Pro"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                      Plan Type
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {subscription.plan.name || "Not Specified"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                      Expiry Date
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(subscription.expiryDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                      Billing Cycle
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {"Annually"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                    Modules Enabled
                  </p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {subscription.plan.features.join(',') || "All Access"}
                  </p>
                </div>
              </div>
            </div>

            {/* Usage Info Card */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Usage Info
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                      Users (Used/Maxed)
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {subscription.maxUsers ||
                        `${subscription.usersUsed}/${subscription.maxUsers}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                      Module Access
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      All Access
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="action-log" className="mt-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Action Log
          </h2>
          <DataTable
            data={subscriptionLogsData?.data?.data || []}
            columns={actionLogColumns}
            options={{
              disablePagination: true,
              disableSelection: true,
              isLoading: isLogsLoading,
              totalCounts: subscriptionLogsData?.data?.data?.length || 0,
              manualPagination: false,
              setPagination: () => {},
              pagination: { pageIndex: 0, pageSize: 10 },
            }}
            classNames={{
              table: "border-separate border-spacing-0",
              tHeader: "bg-gray-200",
              tHeadRow: "border-b border-gray-200 dark:border-gray-700",
              tHead:
                "text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 bg-transparent",
              tRow: "border-b border-gray-100 dark:border-gray-800 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50",
              tCell: "py-4 px-4",
              container:
                "overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg",
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionDetailPage;
