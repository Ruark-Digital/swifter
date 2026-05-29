import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/layouts/DataTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useUserRole } from "@/hooks/useUserRole";
import { useToastHandler } from "@/hooks/useToaster";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { cn, formatSecurityType } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { Check, Search, Share2, X } from "lucide-react";
import type { ApiResponseError } from "@/types";
import type { ContractComplianceDTO } from "@/pages/ContractManagementPage/api/contractManagerApi";
import ComplianceDetailsSheet from "@/pages/ContractManagementPage/components/ComplianceDetailsSheet";
import SubmitPolicyDialog from "@/pages/ContractManagementPage/components/SubmitPolicyDialog";
import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";
import { LabelItem } from "../components/LabelItem";
import { Status, StatusBadge } from "../components/StatusBadge";

type Props = {
  contractId: string;
  isActive?: boolean;
  contract?: ContractComplianceDTO;
  actionsDisabled?: boolean;
};

type PolicyRow = {
  id: string;
  policyId: string;
  policyName: string;
  limit: string;
  status: string;
};

type SecurityRow = {
  id: string;
  securityId: string;
  securityType: string;
  amount: string;
  dueDate: string;
  dueIn: string;
  status: string;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatCurrencyCompact = (value?: string | number) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  return `$${num.toLocaleString("en-US")}`;
};

const getStatusTone = (status?: string) => {
  const normalized = status?.toLowerCase();
  if (normalized === "approved" || normalized === "submitted") {
    return "bg-[#EAF7EE] text-[#43A047] dark:bg-green-900/30 dark:text-green-300";
  }
  if (normalized === "pending" || normalized === "pending submission") {
    return "bg-[#FFF8E1] text-[#F4B400] dark:bg-yellow-900/30 dark:text-yellow-300";
  }
  if (normalized === "rejected")
    return "bg-[#FEECEC] text-[#E53935] dark:bg-red-900/30 dark:text-red-300";
  if (normalized === "closed")
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
};

const Compliance: React.FC<Props> = ({ contractId, isActive, actionsDisabled }) => {
  const {
    isVendor,
    isProjectManager,
    isApprover,
    isManager,
    isAdmin,
    isViewOnly,
    userRole,
  } =
    useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<unknown>(null);
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"policy" | "security">("policy");
  const queryClient = useQueryClient();

  const basePath = React.useMemo(() => {
    if (isVendor || isProjectManager)
      return `/contract/vendor/msa-contracts/${contractId}/compliance`;
    if (isApprover)
      return `/contract/approver/msa-contracts/${contractId}/compliance`;
    if (isManager)
      return `/contract/manager/msa-contracts/${contractId}/compliance`;
    if (isAdmin || isViewOnly)
      return `/contract/user/msa-contracts/${contractId}/compliance`;
    return `/contract/user/msa-contracts/${contractId}/compliance`;
  }, [
    contractId,
    isAdmin,
    isApprover,
    isManager,
    isProjectManager,
    isVendor,
    isViewOnly,
  ]);

  const queryKey = useUserQueryKey(["msa-compliance", contractId, basePath]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getRequest({ url: basePath });
      return response.data as { data?: ContractComplianceDTO };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  React.useEffect(() => {
    toastErrorRef.current = toastHandler.error;
  }, [toastHandler.error]);

  React.useEffect(() => {
    if (!error) return;
    if (lastErrorRef.current === error) return;
    lastErrorRef.current = error;
    toastErrorRef.current("MSA Compliance", error as ApiResponseError);
  }, [error]);

  const complianceData = data?.data;

  const policyRows = React.useMemo<PolicyRow[]>(
    () =>
      (complianceData?.policy ?? []).map((policy) => ({
        id: policy._id || "",
        policyId: policy.policyId || policy._id || "-",
        policyName: policy.policyName || "-",
        limit: formatCurrencyCompact(policy.value),
        status: policy.status || "Pending",
      })),
    [complianceData?.policy],
  );

  const securityRows = React.useMemo<SecurityRow[]>(
    () =>
      (complianceData?.security ?? []).map((security) => {
        const dueDate = security.dueDate
          ? format(new Date(security.dueDate), "dd MMM yyyy")
          : "-";
        let dueIn = "-";
        if (security.dueDate) {
          const days = differenceInDays(
            new Date(security.dueDate),
            new Date(),
          );
          if (days > 0) dueIn = `${days} days`;
          else if (days === 0) dueIn = "Today";
          else dueIn = "Overdue";
        }
        return {
          id: security._id || security.securityTypeId || "",
          securityId: security.securityTypeId || security._id || "-",
          securityType: formatSecurityType(security.securityType),
          amount: formatCurrencyCompact(security.amount),
          dueDate,
          dueIn,
          status: security.status || "Pending",
        };
      }),
    [complianceData?.security],
  );

  const filteredPolicyRows = React.useMemo(() => {
    if (!search.trim()) return policyRows;
    const q = search.toLowerCase();
    return policyRows.filter(
      (row) =>
        row.policyId.toLowerCase().includes(q) ||
        row.policyName.toLowerCase().includes(q),
    );
  }, [policyRows, search]);

  const filteredSecurityRows = React.useMemo(() => {
    if (!search.trim()) return securityRows;
    const q = search.toLowerCase();
    return securityRows.filter(
      (row) =>
        row.securityId.toLowerCase().includes(q) ||
        row.securityType.toLowerCase().includes(q),
    );
  }, [search, securityRows]);

  const policyColumns = React.useMemo<ColumnDef<PolicyRow>[]>(
    () => [
      { accessorKey: "policyId", header: "Policy ID" },
      { accessorKey: "policyName", header: "Policy Name" },
      { accessorKey: "limit", header: "Limit" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <Badge
            variant="secondary"
            className={cn(
              "font-semibold rounded-full px-4 py-1 border-none",
              getStatusTone(getValue<string>()),
            )}
          >
            {getValue<string>()}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          return (
            <ComplianceDetailsSheet
              type="policy"
              id={row.original.id}
              contractId={contractId}
              basePath={basePath}
              actionsDisabled={actionsDisabled}
              trigger={
                <Button
                  variant="link"
                  className="text-[#43A047] font-semibold p-0 h-auto"
                >
                  View
                </Button>
              }
            />
          );
        },
      },
    ],
    [basePath, contractId, actionsDisabled],
  );

  const securityColumns = React.useMemo<ColumnDef<SecurityRow>[]>(
    () => [
      { accessorKey: "securityId", header: "Security ID" },
      { accessorKey: "securityType", header: "Security Type" },
      { accessorKey: "amount", header: "Amount" },
      {
        accessorKey: "dueDate",
        header: "Date",
        cell: ({ row }) => (
          <div className="flex flex-col text-sm">
            <div>
              <span className="text-slate-500 dark:text-slate-400 mr-1">
                Due Date:
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {row.original.dueDate}
              </span>
            </div>
            {row.original.dueIn && row.original.dueIn !== "-" && (
              <div>
                <span className="text-slate-500 dark:text-slate-400 mr-1">
                  Due in:
                </span>
                <span className="text-slate-900 dark:text-slate-100">
                  {row.original.dueIn}
                </span>
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <Badge
            variant="secondary"
            className={cn(
              "font-semibold rounded-full px-4 py-1 border-none",
              getStatusTone(getValue<string>()),
            )}
          >
            {getValue<string>()}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          return (
            <ComplianceDetailsSheet
              type="security"
              id={row.original.id}
              contractId={contractId}
              basePath={basePath}
              actionsDisabled={actionsDisabled}
              trigger={
                <Button
                  variant="link"
                  className="text-[#43A047] font-semibold p-0 h-auto"
                >
                  View
                </Button>
              }
            />
          );
        },
      },
    ],
    [basePath, contractId, actionsDisabled],
  );

  const isContractManager = userRole === "contract_manager";
  const isVendorOrProjectManager = isVendor || isProjectManager;

  const securityTypeCount = complianceData?.details?.securityType?.length || 0;

  const getCategoryStatus = React.useCallback(
    (type: "policy" | "security") => {
      if (type === "policy") {
        const status = complianceData?.details?.policyStatus?.status;
        if (status) return status;
        return complianceData?.details?.insuranceStatus;
      }

      const raw = complianceData?.details?.securityStatus as unknown;
      if (typeof raw === "string") return raw;
      if (raw && typeof raw === "object" && "status" in raw) {
        return (raw as { status?: string }).status;
      }
      return undefined;
    },
    [complianceData?.details],
  );

  const hasFiles = React.useMemo(() => {
    const details = complianceData?.details;
    if (!details) return false;
    if (activeTab === "policy") {
      return (
        (details.policyStatus?.files?.length ?? details.files?.length ?? 0) > 0
      );
    }
    const raw = details.securityStatus as unknown;
    if (raw && typeof raw === "object" && "files" in raw) {
      return ((raw as { files?: unknown[] }).files?.length ?? 0) > 0;
    }
    return (details.files?.length ?? 0) > 0;
  }, [activeTab, complianceData?.details]);

  const insuranceStatus = String(getCategoryStatus("policy") || "pending");
  const securityStatus = String(getCategoryStatus("security") || "pending");

  const canSubmitActiveCategory = React.useMemo(() => {
    if (!isVendorOrProjectManager) return false;
    const status = String(getCategoryStatus(activeTab) || "").toLowerCase();
    if (!status) return !hasFiles;
    return status === "pending" || status === "rejected";
  }, [activeTab, getCategoryStatus, hasFiles, isVendorOrProjectManager]);

  const canManagerActOnActive = React.useMemo(() => {
    if (!isContractManager) return false;
    if (!hasFiles) return false;
    const status = String(getCategoryStatus(activeTab) || "").toLowerCase();
    if (!status) return false;
    return (
      status === "submitted" ||
      status === "pending approval" ||
      status === "pending_approval" ||
      status === "awaiting approval"
    );
  }, [activeTab, getCategoryStatus, hasFiles, isContractManager]);

  const approveMutation = useMutation({
    mutationFn: async (action: "approved" | "rejected") => {
      const endpoint = `/contract/manager/msa-contracts/${contractId}/compliance/${activeTab}/approve`;
      const comment =
        action === "approved"
          ? `Approved all ${activeTab} items via bulk action`
          : `Rejected all ${activeTab} items via bulk action`;
      const res = await postRequest({ url: endpoint, payload: { action, comment } });
      return res.data as { message?: string };
    },
    onSuccess: (res, action) => {
      toastHandler.success("Success", res?.message ?? `Compliance ${action}`);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: ApiResponseError) => {
      toastHandler.error("Failed to update compliance status", err);
    },
  });

  const handleApprove = () => approveMutation.mutate("approved");
  const handleReject = () => approveMutation.mutate("rejected");

  return (
    <TabsContent value="compliance" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-slate-900 dark:text-slate-100">
          Compliance & Security Details
        </h3>
        <div className="flex items-center gap-3">
          {canManagerActOnActive && (
            <>
              <Button
                variant="outline"
                className="h-12 rounded-xl border-red-200 px-5 text-base font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleReject}
                disabled={approveMutation.isPending || !!actionsDisabled}
              >
                <X className="mr-2 h-5 w-5" />
                Reject
              </Button>
              <Button
                className="h-12 rounded-xl bg-green-600 px-5 text-base font-semibold text-white hover:bg-green-700"
                onClick={handleApprove}
                disabled={approveMutation.isPending || !!actionsDisabled}
              >
                <Check className="mr-2 h-5 w-5" />
                Approve
              </Button>
            </>
          )}

          {isVendorOrProjectManager && canSubmitActiveCategory && (
            <SubmitPolicyDialog
              type={activeTab}
              contractId={contractId}
              basePath={basePath}
              title={`Submit ${activeTab === "policy" ? "Policies" : "Security"}`}
              trigger={
                <Button
                  className="h-12 rounded-xl bg-[#2A4467] px-5 text-base font-semibold text-white hover:bg-[#1f3552]"
                  disabled={!!actionsDisabled}
                >
                  Submit {activeTab === "policy" ? "Policies" : "Security"}
                </Button>
              }
            />
          )}

          <ExportReportSheet contractId={contractId} contractType="MsaContract">
            <Button
              variant="outline"
              className="h-12 rounded-xl border-[#E5E7EB] dark:border-slate-700 px-5 text-base font-semibold text-[#0F0F0F] dark:text-slate-100 dark:bg-transparent"
            >
              <Share2 className="mr-2 h-5 w-5" />
              Export Report
            </Button>
          </ExportReportSheet>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280] dark:text-slate-400">
          Loading compliance data...
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
        <LabelItem
          label="Insurance Coverage"
          value={
            complianceData?.details?.coverage
              ? `${complianceData.details.coverage} Coverages`
              : "-"
          }
        />

        <LabelItem
          label="Insurance Expiry Date"
          value={formatDate(complianceData?.details?.expDate)}
        />
       
        <LabelItem
          label="Insurance Status"
          children={<StatusBadge status={insuranceStatus as Status} />}
        />

        <LabelItem
          label="Contract Security"
          value={complianceData?.details?.security ? "Yes" : "No"}
        />
       
       <LabelItem
          label="Security Type"
          value={securityTypeCount || "-"}
        />

        <LabelItem
          label="Security Status"
          children={<StatusBadge status={securityStatus as Status} />}
        />
      </div>

      <div className="space-y-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "policy" | "security")}
        >
          <TabsList className="bg-[#F3F4F6] dark:bg-slate-800 rounded-full p-1 h-auto">
            <TabsTrigger
              value="policy"
              className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-[#2A4467] data-[state=active]:text-white data-[state=active]:shadow-none text-[#6B6B6B] dark:text-slate-200"
            >
              Insurance Coverage
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-[#2A4467] data-[state=active]:text-white data-[state=active]:shadow-none text-[#6B6B6B] dark:text-slate-200"
            >
              Contract Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="policy" className="mt-0">
            <div className="overflow-hidden rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-4 border-b border-[#E9E9EB] dark:border-slate-700 px-6 py-4">
                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Policy
                </div>
                <div className="relative w-[320px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#6B6B6B] dark:text-slate-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search"
                    className="h-12 rounded-lg border border-[#E5E7EB] dark:border-slate-700 pl-9 text-sm text-[#0F0F0F] dark:text-slate-100 placeholder:text-[#6B6B6B] dark:placeholder:text-slate-400 bg-white dark:bg-slate-950"
                  />
                </div>
              </div>
              <DataTable<PolicyRow>
                data={filteredPolicyRows}
                columns={policyColumns}
                options={{ disableSelection: true, disablePagination: true }}
                classNames={{
                  container: "[&>div:last-child]:hidden",
                  table: "border-spacing-y-0",
                  tHeader: "bg-[#F9FAFB] dark:bg-slate-900",
                  tHeadRow: "border-b border-[#E5E7EB] dark:border-slate-700",
                  tBody: "bg-white dark:bg-slate-900",
                  tRow: "border-b border-[#E5E7EB] dark:border-slate-700",
                  tHead:
                    "px-6 py-3 text-sm font-semibold text-[#2A4467] dark:text-slate-200",
                  tCell:
                    "px-6 py-4 text-sm text-slate-700 dark:text-slate-200 align-top",
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <div className="overflow-hidden rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-4 border-b border-[#E9E9EB] dark:border-slate-700 px-6 py-4">
                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Security
                </div>
                <div className="relative w-[320px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#6B6B6B] dark:text-slate-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search"
                    className="h-12 rounded-lg border border-[#E5E7EB] dark:border-slate-700 pl-9 text-sm text-[#0F0F0F] dark:text-slate-100 placeholder:text-[#6B6B6B] dark:placeholder:text-slate-400 bg-white dark:bg-slate-950"
                  />
                </div>
              </div>
              <DataTable<SecurityRow>
                data={filteredSecurityRows}
                columns={securityColumns}
                options={{ disableSelection: true, disablePagination: true }}
                classNames={{
                  container: "[&>div:last-child]:hidden",
                  table: "border-spacing-y-0",
                  tHeader: "bg-[#F9FAFB] dark:bg-slate-900",
                  tHeadRow: "border-b border-[#E5E7EB] dark:border-slate-700",
                  tBody: "bg-white dark:bg-slate-900",
                  tRow: "border-b border-[#E5E7EB] dark:border-slate-700",
                  tHead:
                    "px-6 py-3 text-sm font-semibold text-[#2A4467] dark:text-slate-200",
                  tCell:
                    "px-6 py-4 text-sm text-slate-700 dark:text-slate-200 align-top",
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TabsContent>
  );
};

export default Compliance;
