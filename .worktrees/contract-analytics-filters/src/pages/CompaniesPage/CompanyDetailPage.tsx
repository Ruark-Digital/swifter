import { useParams, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForge, Forge, Forger, usePersist } from "@/lib/forge";
import { ModuleToggle } from "@/components/layouts/FormInputs/ModuleToggle";
import { DataTable } from "@/components/layouts/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, putRequest, deleteRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import EditCompanyDialog from "./components/EditCompanyDialog";
import React, { useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { formatDateTZ } from "@/lib/utils";

// Schema for module form validation
const moduleSchema = yup.object().shape({
  solicitationsManagement: yup.boolean(),
  evaluationsManagement: yup.boolean(),
  vendorManagement: yup.boolean(),
  contractManagement: yup.boolean(),
  reportsAnalytics: yup.boolean(),
  generalUpdatesNotifications: yup.boolean(),
  myActions: yup.boolean(),
  vendorsQA: yup.boolean(),
  addendumManagement: yup.boolean(),
  isAi: yup.boolean(),
});

type ModuleFormValues = yup.InferType<typeof moduleSchema>;

// Admin data type
type CompanyAdmin = {
  _id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  status: "active" | "inactive";
};

// Company details type based on API documentation
type CompanyDetails = {
  _id: string;
  name: string;
  industry?: string;
  sizeCategory: string;
  status: "active" | "inactive" | "suspended";
  maxUsers: number;
  admins: CompanyAdmin[];
  domain?: string;
  subscription?: {
    _id: string;
    companyId: string;
    plan: {
      _id: string;
      name: string;
      description: string;
      price: number;
    };
    status: "active" | "expired" | "canceled" | "pending";
    startDate: string;
    expiryDate: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Keeping these for backward compatibility
  planName?: string;
  duration?: number;
  subscriptionExpiry?: string;
  subscriptionStatus?: string;
};

// Company status update payload
type CompanyStatusUpdate = {
  status: "active" | "inactive" | "suspended";
};

// Module settings update payload
type ModuleSettings = {
  solicitationManagement: boolean;
  evaluationsManagement: boolean;
  vendorManagement: boolean;
  reportsAnalytics: boolean;
  contractManagement: boolean;
  generalUpdatesNotifications: boolean;
  myActions: boolean;
  vendorsQA: boolean;
  addendumManagement: boolean;
  isAi: boolean;
};

// Portal Settings type based on API documentation
type PortalSettings = {
  _id: string;
  companyId: string;
  solicitationManagement: boolean;
  evaluationsManagement: boolean;
  vendorManagement: boolean;
  contractManagement: boolean;
  reportsAnalytics: boolean;
  generalUpdatesNotifications: boolean;
  myActions: boolean;
  vendorsQA: boolean;
  addendumManagement: boolean;
  isAi?: boolean;
  createdAt: string;
  updatedAt: string;
};

const CompanyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToastHandler();
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Admin management handlers
  const [adminToRemove, setAdminToRemove] = useState<string | null>(null);
  const [showRemoveAdminDialog, setShowRemoveAdminDialog] = useState(false);

  const { mutateAsync: deleteAdmin, isPending: isDeletingAdmin } = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    string
  >({
    mutationFn: async (adminId) => {
      return await deleteRequest({ url: `/delete/${adminId}` });
    },
    onSuccess: () => {
      toast.success("Admin Removal", "Admin removed successfully");
      queryClient.invalidateQueries({ queryKey: ["companyAdmins", id] });
    },
    onError: (error) => {
      toast.error(
        "Admin Removal",
        error.response?.data?.message || "Failed to remove admin"
      );
    },
  });

  // Fetch company details from API
  const {
    data: companyResponse,
    isLoading: isLoadingCompany,
    error: companyError,
  } = useQuery<ApiResponse<CompanyDetails>, ApiResponseError>({
    queryKey: ["company", id],
    queryFn: async () => await getRequest({ url: `/companies/${id}` }),
    enabled: !!id,
  });

  const companyData = companyResponse?.data?.data;
  // Ensure adminData is always an array, even if companyData.admins is undefined
  // Fetch company admins from API
  const {
    data: adminsResponse,
    isLoading: isLoadingAdmins,
    error: adminsError,
  } = useQuery<ApiResponse<{ data: CompanyAdmin[] }>, ApiResponseError>({
    queryKey: ["companyAdmins", id],
    queryFn: async () => await getRequest({ url: `/admins?companyId=${id}` }),
    enabled: !!id,
  });

  const adminData = adminsResponse?.data?.data?.data || companyData?.admins || [];

  // Company status update mutation
  const { mutateAsync: updateCompanyStatus, isPending: isUpdatingStatus } =
    useMutation<
      ApiResponse<CompanyDetails>,
      ApiResponseError,
      CompanyStatusUpdate
    >({
      mutationFn: async (payload) =>
        await putRequest({ url: `/companies/${id}/status`, payload }),
      onSuccess: () => {
        toast.success("Company Status", "Company status updated successfully");
        queryClient.invalidateQueries({ queryKey: ["company", id] });
        queryClient.invalidateQueries({ queryKey: ["companies"] });
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to update company status"
        );
      },
    });

  // Fetch portal settings from API
  const { data: portalSettingsResponse, isLoading: isLoadingPortalSettings } =
    useQuery<ApiResponse<PortalSettings>, ApiResponseError>({
      queryKey: ["portalSettings", id],
      queryFn: async () =>
        await getRequest({ url: `/admins/portal-settings/${id}` }),
      enabled: !!id,
    });

  const portalSettingsData = portalSettingsResponse?.data?.data;

  // Portal settings update mutation
  const {
    mutateAsync: updatePortalSettings,
    isPending: isUpdatingPortalSettings,
  } = useMutation<
    ApiResponse<PortalSettings>,
    ApiResponseError,
    ModuleSettings
  >({
    mutationFn: async (payload) =>
      await putRequest({ url: `/admins/portal-settings/${id}`, payload }),
    onSuccess: () => {
      toast.success("Module Settings", "Module settings updated successfully");
      queryClient.invalidateQueries({ queryKey: ["portalSettings", id] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update module settings"
      );
    },
  });

  // Initialize form with portal settings data or default values
  const { control, reset, handleSubmit } = useForge<ModuleFormValues>({
    resolver: yupResolver(moduleSchema),
    defaultValues: {
      solicitationsManagement:
        portalSettingsData?.solicitationManagement ?? true,
      evaluationsManagement: portalSettingsData?.evaluationsManagement ?? true,
      contractManagement: portalSettingsData?.contractManagement ?? true,
      reportsAnalytics: portalSettingsData?.reportsAnalytics ?? true,
      generalUpdatesNotifications:
        portalSettingsData?.generalUpdatesNotifications ?? true,
      myActions: portalSettingsData?.myActions ?? true,
      vendorsQA: portalSettingsData?.vendorsQA ?? true,
      addendumManagement: portalSettingsData?.addendumManagement ?? false,
      isAi: portalSettingsData?.isAi ?? false,
    },
  });


  // Reset form when portal settings data changes
  React.useEffect(() => {
    if (portalSettingsData) {
      reset({
        solicitationsManagement: portalSettingsData.solicitationManagement,
        evaluationsManagement: portalSettingsData.evaluationsManagement,
        vendorManagement: portalSettingsData.vendorManagement,
        reportsAnalytics: portalSettingsData.reportsAnalytics,
        generalUpdatesNotifications:
          portalSettingsData.generalUpdatesNotifications,
        contractManagement: portalSettingsData.contractManagement,
        myActions: portalSettingsData.myActions,
        vendorsQA: portalSettingsData.vendorsQA,
        addendumManagement: portalSettingsData.addendumManagement,
        isAi: portalSettingsData.isAi ?? false,
      });
    }
  }, [portalSettingsData, reset]);

  // Auto-submit when any module toggle changes (without touching forge)
  usePersist<ModuleFormValues>({
    control,
    handler: (_, { name, type }) => {
      if (
        type === "change" &&
        [
          "solicitationsManagement",
          "evaluationsManagement",
          "vendorManagement",
          "reportsAnalytics",
          "generalUpdatesNotifications",
          "myActions",
          "vendorsQA",
          "addendumManagement",
          "contractManagement",
          "isAi",
        ].includes(name ?? "")
      ) {
        handleSubmit(handleModuleSubmit)();
      }
    },
  });

  // Handle loading state
  if (isLoadingCompany || isLoadingPortalSettings || isLoadingAdmins) {
    return (
      <PageLoader
        title="Company Details"
        message="Loading company details..."
        className="p-6 min-h-full"
      />
    );
  }

  // Handle error state
  if (companyError || !companyData || adminsError) {
    return (
      <div className="p-6 min-h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {companyError?.response?.data?.message ||
              adminsError?.response?.data?.message ||
              "Failed to load company details"}
          </p>
          <Button
            onClick={() => navigate("/dashboard/companies")}
            variant="outline"
          >
            Back to Companies
          </Button>
        </div>
      </div>
    );
  }

  const handleModuleSubmit = async (data: ModuleFormValues) => {
    try {
      await updatePortalSettings({
        solicitationManagement: data.solicitationsManagement || false,
        evaluationsManagement: data.evaluationsManagement || false,
        contractManagement: data.contractManagement || false,
        vendorManagement: data.vendorManagement || false,
        reportsAnalytics: data.reportsAnalytics || false,
        generalUpdatesNotifications: data.generalUpdatesNotifications || false,
        myActions: data.myActions || false,
        vendorsQA: data.vendorsQA || false,
        addendumManagement: data.addendumManagement || false,
        isAi: data.isAi || false,
      });
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  // const handleStatusToggle = () => {
  //   setShowConfirmDialog(true);
  // };

  const handleConfirmStatusChange = async () => {
    if (!companyData) return;

    let newStatus: "active" | "inactive" | "suspended";

    // Toggle between active and inactive/suspended states
    if (companyData.status === "active") {
      newStatus = "inactive";
    } else if (companyData.status === "suspended") {
      newStatus = "active";
    } else {
      newStatus = "active";
    }

    try {
      await updateCompanyStatus({ status: newStatus });
      setShowConfirmDialog(false);
    } catch (error) {
      // Error is handled in the mutation
      setShowConfirmDialog(false);
    }
  };
  

  // Format date helper
  const formatDate = (dateString: string) => {
    return !dateString ? "N/A" : formatDateTZ(dateString, "MMMM d, yyyy, pppp");
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive":
      case "expired":
      case "canceled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "suspended":
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const handleRemoveAdmin = (adminId: string) => {
    setAdminToRemove(adminId);
    setShowRemoveAdminDialog(true);
  };

  const confirmRemoveAdmin = async () => {
    if (adminToRemove) {
      try {
        await deleteAdmin(adminToRemove);
        setShowRemoveAdminDialog(false);
      } catch (error) {
        // Error is handled in the mutation
      }
    }
  };

  // Admin table columns
  const adminColumns: ColumnDef<CompanyAdmin>[] = [
    {
      accessorKey: "name",
      header: "Name",
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
          {row.original.role}
        </span>
      ),
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatDate(row.original.lastLogin)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
            row.original.status
          )}`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          onClick={() => handleRemoveAdmin(row.original._id)}
          className="p-3 dark:text-red-400"
          variant="destructive"
          isLoading={isDeletingAdmin && adminToRemove === row.original._id}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 min-h-full">
      {/* Remove Admin Confirmation Dialog */}
      <ConfirmAlert
        title="Remove Admin"
        text="Are you sure you want to remove this admin? This action cannot be undone."
        type="delete"
        open={showRemoveAdminDialog}
        onClose={(open) => setShowRemoveAdminDialog(open)}
        onPrimaryAction={confirmRemoveAdmin}
        isLoading={isDeletingAdmin}
        primaryButtonText="Remove"
        secondaryButtonText="Cancel"
      />
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate("/dashboard/companies")}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
        >
          Companies
        </button>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <button
          onClick={() => navigate("/dashboard/companies")}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
        >
          {companyData.name}
        </button>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">
          Company Details
        </span>
      </div>

      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {companyData.name}
          </h1>
          <EditCompanyDialog company={companyData}>
            <Button variant="outline" size={"lg"} className="px-4 py-2 mr-3">
              Edit Company
            </Button>
          </EditCompanyDialog>
          <ConfirmAlert
            title={
              companyData.status === "active"
                ? "Suspend Company"
                : "Activate Company"
            }
            text={
              companyData.status === "active"
                ? `Are you sure you want to suspend ${companyData.name}? This will deactivate the company and restrict access.`
                : `Are you sure you want to activate ${companyData.name}? This will restore full access to the company.`
            }
            type={companyData.status === "active" ? "delete" : "info"}
            primaryButtonText={
              companyData.status === "active" ? "Suspend" : "Activate"
            }
            secondaryButtonText="Cancel"
            onPrimaryAction={handleConfirmStatusChange}
            open={showConfirmDialog}
            onSecondaryAction={() => setShowConfirmDialog(false)}
            onClose={setShowConfirmDialog}
            isLoading={isUpdatingStatus}
            trigger={
              companyData.status !== "active" ? (
                <Button
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white"
                >
                  {isUpdatingStatus ? "Activating..." : "Activate Company"}
                </Button>
              ) : (
                <Button
                  disabled={isUpdatingStatus}
                  variant="destructive"
                  className="px-4 py-2"
                >
                  {isUpdatingStatus ? "Suspending..." : "Suspend Company"}
                </Button>
              )
            }
          />
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={`${getStatusColor(
              companyData.status
            )} border-0 px-3 py-1`}
          >
            {companyData.status}
          </Badge>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="!bg-transparent">
        <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-700 !bg-transparent p-0 w-full justify-start mb-3">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="modules"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Modules
          </TabsTrigger>
          <TabsTrigger
            value="admin"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Admin Management
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Subscription Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Company Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Company Name
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {companyData.name}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Created by
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {companyData.createdBy || "Not Specified"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Date Created
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {companyData.createdAt
                    ? formatDateTZ(companyData.createdAt, "MMMM d, yyyy")
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Company Contact
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {companyData.admins?.[0]?.email || "Not specified"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Plan
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {companyData.subscription?.plan?.name ||
                    companyData.planName ||
                    "Not specified"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Last Modified
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {formatDate(companyData.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="modules">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Enabled Modules
          </h3>

          <Forge
            {...{
              control,
              onSubmit: handleModuleSubmit,
              className: "max-w-md",
            }}
          >
            <div className="space-y-0">
              <Forger
                name="solicitationsManagement"
                label="Solicitation Management"
                component={ModuleToggle}
                disabled={isUpdatingPortalSettings}
              />

              <Forger
                name="evaluationsManagement"
                label="Evaluations Management"
                component={ModuleToggle}
                disabled={isUpdatingPortalSettings}
              />

              <Forger
                name="contractManagement"
                label="Contract Management"
                component={ModuleToggle}
                disabled={isUpdatingPortalSettings}
              />

              <Forger
                name="vendorManagement"
                label="Vendor Management"
                component={ModuleToggle}
                disabled={isUpdatingPortalSettings}
              />

              <Forger
                name="reportsAnalytics"
                label="Reports & Analytics"
                component={ModuleToggle}
                disabled={isUpdatingPortalSettings}
              />

              <Forger
                name="generalUpdatesNotifications"
                label="General Updates & Notifications"
                component={ModuleToggle}
                disabled={isUpdatingPortalSettings}
              />

              <Forger
                name="myActions"
                label="My Actions"
                component={ModuleToggle}
                disabled={isUpdatingPortalSettings}
              />

              <Forger
                name="vendorsQA"
                label="Vendors Q & A"
                component={ModuleToggle}
                disabled={isUpdatingPortalSettings}
              />

              <Forger
                name="addendumManagement"
                label="Addendum Management"
                component={ModuleToggle}
                disabled={isUpdatingPortalSettings}
              />

              <Forger
                name="isAi"
                label="AI Assistant"
                component={ModuleToggle}
                disabled={isUpdatingPortalSettings}
              />
            </div>
          </Forge>
        </TabsContent>

        <TabsContent value="admin">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Company Admins
            </h3>
          </div>

          <DataTable
            data={adminData}
            columns={adminColumns}
            options={{
              disablePagination: true,
              disableSelection: true,
              isLoading: isLoadingAdmins,
              totalCounts: adminData.length,
              manualPagination: false,
              setPagination: () => {},
              pagination: { pageIndex: 0, pageSize: 10 },
            }}
            classNames={{
              container: "bg-white dark:bg-slate-950 rounded-xl px-3",
            }}
            emptyPlaceholder={
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No admins found
                </p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="subscription">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Subscription Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-5">
            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                  Plan Type
                </label>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {companyData.subscription?.plan?.name ||
                    companyData.planName ||
                    "Not specified"}{" "}
                  Plan
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                  Max Users
                </label>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 font-quicksand">
                  {(adminData || []).length}/{companyData.maxUsers}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                  Subscription Status
                </label>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {companyData.subscription?.status ||
                    companyData.subscriptionStatus ||
                    "Not specified"}
                </p>
              </div>
              {companyData.subscription?.expiryDate ||
              companyData.subscriptionExpiry ? (
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                    Expiry Date
                  </label>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {formatDateTZ(
                      new Date(
                        companyData.subscription?.expiryDate ||
                          companyData.subscriptionExpiry ||
                          ""
                      ),
                      "MMMM d, yyyy"
                    )}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
    </div>
  );
};

export default CompanyDetailPage;
