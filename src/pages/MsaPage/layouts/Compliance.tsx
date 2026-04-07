import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/layouts/DataTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useUserRole } from "@/hooks/useUserRole";
import { useToastHandler } from "@/hooks/useToaster";
import { getRequest } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";
import { Search, Share2 } from "lucide-react";
import type { ApiResponseError } from "@/types";
import type { ContractComplianceDTO } from "@/pages/ContractManagementPage/api/contractManagerApi";
import ComplianceDetailsSheet from "@/pages/ContractManagementPage/components/ComplianceDetailsSheet";
import SubmitPolicyDialog from "@/pages/ContractManagementPage/components/SubmitPolicyDialog";

type Props = {
  contractId: string;
  isActive?: boolean;
  contract?: ContractComplianceDTO;
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
    return "bg-[#EAF7EE] text-[#43A047]";
  }
  if (normalized === "pending" || normalized === "pending submission") {
    return "bg-[#FFF8E1] text-[#F4B400]";
  }
  if (normalized === "rejected") return "bg-[#FEECEC] text-[#E53935]";
  return "bg-gray-100 text-gray-700";
};

const Compliance: React.FC<Props> = ({ contractId, isActive, }) => {
  const { isVendor, isApprover, isManager, isAdmin, isViewOnly } = useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<unknown>(null);
  const [search, setSearch] = React.useState("");
  const [activeView, setActiveView] = React.useState<"policy" | "security">(
    "policy",
  );

  const basePath = React.useMemo(() => {
    if (isVendor) return `/contract/vendor/msa-contract/${contractId}/compliance`;
    if (isApprover)
      return `/contract/approver/msa-contract/${contractId}/compliance`;
    if (isManager) return `/contract/manager/msa-contract/${contractId}/compliance`;
    if (isAdmin || isViewOnly)
      return `/contract/user/msa-contract/${contractId}/compliance`;
    return `/contract/user/msa-contract/${contractId}/compliance`;
  }, [contractId, isAdmin, isApprover, isManager, isVendor, isViewOnly]);

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
      (complianceData?.security ?? []).map((security) => ({
        id: security.id || "",
        securityId: security.id || "-",
        securityType: security.securityType || "-",
        amount: formatCurrencyCompact(security.amount),
        status: security.status || "Pending",
      })),
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
          const status = row.original.status.toLowerCase();
          const isPending =
            status === "pending" || status === "pending submission";
          const isRejected = status === "rejected";
          const canSubmit = isVendor && (isPending || isRejected);

          if (canSubmit) {
            return (
              <SubmitPolicyDialog
                type="policy"
                id={row.original.id}
                contractId={contractId}
                basePath={basePath}
                title={row.original.policyName}
                trigger={
                  <Button
                    variant="link"
                    className="text-[#43A047] font-semibold p-0 h-auto"
                  >
                    {isRejected ? "Resubmit" : "Submit"}
                  </Button>
                }
              />
            );
          }

          return (
            <ComplianceDetailsSheet
              type="policy"
              id={row.original.id}
              contractId={contractId}
              basePath={basePath}
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
    [basePath, contractId, isVendor],
  );

  const securityColumns = React.useMemo<ColumnDef<SecurityRow>[]>(
    () => [
      { accessorKey: "securityId", header: "Security ID" },
      { accessorKey: "securityType", header: "Security Type" },
      { accessorKey: "amount", header: "Amount" },
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
          const status = row.original.status.toLowerCase();
          const isPending =
            status === "pending" || status === "pending submission";
          const isRejected = status === "rejected";
          const canSubmit = isVendor && (isPending || isRejected);

          if (canSubmit) {
            return (
              <SubmitPolicyDialog
                type="security"
                id={row.original.id}
                contractId={contractId}
                basePath={basePath}
                title={row.original.securityType}
                trigger={
                  <Button
                    variant="link"
                    className="text-[#43A047] font-semibold p-0 h-auto"
                  >
                    {isRejected ? "Resubmit" : "Submit"}
                  </Button>
                }
              />
            );
          }

          return (
            <ComplianceDetailsSheet
              type="security"
              id={row.original.id}
              contractId={contractId}
              basePath={basePath}
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
    [basePath, contractId, isVendor],
  );

  const securityTypeCount = complianceData?.details?.securityType?.length || 0;
  const insuranceStatus = complianceData?.details?.insuranceStatus || "pending";
  const securityStatus = complianceData?.details?.securityStatus || "pending";

  return (
    <TabsContent value="compliance" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-[#0F0F0F]">
          Compliance & Security Details
        </h3>
        <Button
          variant="outline"
          className="h-12 rounded-xl border-[#E5E7EB] px-5 text-base font-semibold text-[#0F0F0F]"
        >
          <Share2 className="mr-2 h-5 w-5" />
          Export Report
        </Button>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280]">
          Loading compliance data...
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
        <div className="space-y-2">
          <p className="text-[18px] leading-7 text-[#6B6B6B]">Insurance Coverage</p>
          <p className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
            {complianceData?.details?.coverage
              ? `${complianceData.details.coverage} Coverages`
              : "-"}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[18px] leading-7 text-[#6B6B6B]">Insurance Expiry Date</p>
          <p className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
            {formatDate(complianceData?.details?.expDate)}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[18px] leading-7 text-[#6B6B6B]">Insurance Status</p>
          <Badge
            variant="secondary"
            className={cn(
              "font-semibold rounded-full px-4 py-1 border-none",
              getStatusTone(insuranceStatus),
            )}
          >
            {insuranceStatus}
          </Badge>
        </div>
        <div className="space-y-2">
          <p className="text-[18px] leading-7 text-[#6B6B6B]">Contract Security</p>
          <p className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
            {complianceData?.details?.security ? "Yes" : "No"}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[18px] leading-7 text-[#6B6B6B]">Security Type</p>
          <p className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
            {securityTypeCount || "-"}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[18px] leading-7 text-[#6B6B6B]">Security Status</p>
          <Badge
            variant="secondary"
            className={cn(
              "font-semibold rounded-full px-4 py-1 border-none",
              getStatusTone(securityStatus),
            )}
          >
            {securityStatus}
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        <div className="inline-flex rounded-full bg-[#F3F4F6] p-1">
          <button
            type="button"
            onClick={() => setActiveView("policy")}
            className={cn(
              "rounded-full px-6 py-2 text-base font-semibold",
              activeView === "policy"
                ? "bg-[#2A4467] text-white"
                : "text-[#6B6B6B]",
            )}
          >
            Insurance Coverage
          </button>
          <button
            type="button"
            onClick={() => setActiveView("security")}
            className={cn(
              "rounded-full px-6 py-2 text-base font-semibold",
              activeView === "security"
                ? "bg-[#2A4467] text-white"
                : "text-[#6B6B6B]",
            )}
          >
            Contract Security
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
          <div className="flex items-center gap-4 border-b border-[#E9E9EB] px-6 py-4">
            <div className="text-base font-semibold text-[#0F0F0F]">
              {activeView === "policy" ? "Policy" : "Security"}
            </div>
            <div className="relative w-[320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#6B6B6B]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="h-12 rounded-lg border border-[#E5E7EB] pl-9 text-sm text-[#0F0F0F] placeholder:text-[#6B6B6B]"
              />
            </div>
          </div>

          {activeView === "policy" ? (
            <DataTable<PolicyRow>
              data={filteredPolicyRows}
              columns={policyColumns}
              options={{ disableSelection: true, disablePagination: true }}
              classNames={{
                container: "[&>div:last-child]:hidden",
                table: "border-spacing-y-0",
                tHeader: "bg-[#F9FAFB]",
                tHeadRow: "border-b border-[#E5E7EB]",
                tBody: "bg-white",
                tRow: "border-b border-[#E5E7EB]",
                tHead: "px-6 py-3 text-sm font-semibold text-[#2A4467]",
                tCell: "px-6 py-4 text-sm text-slate-700 align-top",
              }}
            />
          ) : (
            <DataTable<SecurityRow>
              data={filteredSecurityRows}
              columns={securityColumns}
              options={{ disableSelection: true, disablePagination: true }}
              classNames={{
                container: "[&>div:last-child]:hidden",
                table: "border-spacing-y-0",
                tHeader: "bg-[#F9FAFB]",
                tHeadRow: "border-b border-[#E5E7EB]",
                tBody: "bg-white",
                tRow: "border-b border-[#E5E7EB]",
                tHead: "px-6 py-3 text-sm font-semibold text-[#2A4467]",
                tCell: "px-6 py-4 text-sm text-slate-700 align-top",
              }}
            />
          )}
        </div>
      </div>
    </TabsContent>
  );
};

export default Compliance;
