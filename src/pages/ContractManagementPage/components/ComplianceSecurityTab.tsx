import React, { useMemo } from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Search, Check, X } from "lucide-react";
import { cn, formatSecurityType } from "@/lib/utils";
import { ContractComplianceDTO } from "../api/contractManagerApi";
import { useUserRole } from "@/hooks/useUserRole";
import { format, differenceInDays } from "date-fns";
import ComplianceDetailsSheet from "./ComplianceDetailsSheet";
import SubmitPolicyDialog from "./SubmitPolicyDialog";
import { useParams } from "react-router-dom";
import { postRequest } from "@/lib/axiosInstance";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastHandler } from "@/hooks/useToaster";
import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";

export type PolicyRow = {
  id: string;
  policyId: string;
  policyName: string;
  limit: string;
  status: string;
};

export type SecurityRow = {
  id: string;
  securityId: string;
  securityType: string;
  amount: string;
  dueDate: string;
  dueIn: string;
  status: string;
};

interface ComplianceSecurityTabProps {
  isLoading?: boolean;
  data?: ContractComplianceDTO;
  basePath: string;
  currency?: string;
  actionsDisabled?: boolean;
  /** True when the current user owns/manages this contract — only then may
   *  they approve/reject compliance submissions (QA #140/#144). */
  owner?: boolean;
}

const ComplianceSecurityTab: React.FC<ComplianceSecurityTabProps> = ({
  isLoading,
  data,
  basePath,
  currency,
  actionsDisabled,
  owner,
}) => {
  const { id: contractId } = useParams<{ id: string }>();
  const [search, setSearch] = React.useState("");
  const [activeView, setActiveView] = React.useState<"policy" | "security">(
    "policy",
  );
  const { isVendor, isProjectManager, userRole } = useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  const queryClient = useQueryClient();
  const toast = useToastHandler();

  const hasFiles = React.useMemo(() => {
    const details = data?.details;
    if (!details) return false;

    if (activeView === "policy") {
      return (
        (details.policyStatus?.files?.length ?? details.files?.length ?? 0) > 0
      );
    }

    const raw = details.securityStatus as unknown;
    if (raw && typeof raw === "object" && "files" in raw) {
      return ((raw as { files?: unknown[] }).files?.length ?? 0) > 0;
    }
    return (details.files?.length ?? 0) > 0;
  }, [activeView, data?.details]);
  const isContractManager = userRole === "contract_manager";

  const getSubmissionStatus = (type: "policy" | "security") => {
    if (type === "policy") {
      const status = data?.details?.policyStatus?.status;
      if (status) return status;
      return data?.details?.insuranceStatus;
    }

    const raw = data?.details?.securityStatus as unknown;
    if (typeof raw === "string") return raw;
    if (raw && typeof raw === "object" && "status" in raw) {
      return (raw as { status?: string }).status;
    }
    return undefined;
  };

  const canSubmitActive = React.useMemo(() => {
    if (!isContractVendorLike) return false;
    const status = getSubmissionStatus(activeView);
    if (!status) return !hasFiles;
    const normalized = String(status).toLowerCase();
    return normalized === "pending" || normalized === "rejected";
  }, [activeView, hasFiles, isContractVendorLike, data?.details]);

  const canManagerActOnActive = React.useMemo(() => {
    if (!isContractManager) return false;
    // Only the contract owner/manager may approve/reject — a CM/PL who isn't
    // the owner must not see these buttons (QA #140/#144).
    if (!owner) return false;
    if (!hasFiles) return false;
    const status = getSubmissionStatus(activeView);
    if (!status) return false;
    const normalized = String(status).toLowerCase();
    return (
      normalized === "submitted" ||
      normalized === "pending approval" ||
      normalized === "pending_approval" ||
      normalized === "awaiting approval"
    );
  }, [activeView, hasFiles, isContractManager, owner, data?.details]);

  const formatMoneyNoSymbol = (value: unknown) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";
    const locale = "en-US";
    const fractionDigits = 0;
    if (currency) {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        maximumFractionDigits: fractionDigits,
      }).format(num);
    }
    return num.toLocaleString(locale, {
      maximumFractionDigits: fractionDigits,
    });
  };

  const approveMutation = useMutation({
    mutationFn: async (action: "approved" | "rejected") => {
      const type = activeView === "policy" ? "policy" : "security";
      const endpoint = `contract/manager/contracts/${contractId}/compliance/${type}/approve`;
      const comment =
        action === "approved"
          ? `Approved all ${activeView} items via bulk action`
          : `Rejected all ${activeView} items via bulk action`;
      return postRequest({
        url: endpoint,
        payload: { action, comment },
      });
    },
    onSuccess: (_, action) => {
      toast.success("Success", `Compliance ${activeView} ${action}`);
      queryClient.invalidateQueries({
        queryKey: ["contract-compliance", contractId, basePath],
      });
    },
    onError: (error: any) => {
      toast.error("Error", error?.message || "Failed to update status");
    },
  });

  const handleApprove = () => approveMutation.mutate("approved");
  const handleReject = () => approveMutation.mutate("rejected");

  const columns = useMemo<ColumnDef<PolicyRow>[]>(
    () => [
      { accessorKey: "policyId", header: "Policy ID" },
      {
        accessorKey: "policyName",
        header: "Policy Name",
        cell: ({ getValue }) => (
          <span className="text-slate-700 dark:text-slate-300">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "limit",
        header: "Limit",
        cell: ({ getValue }) => (
          <span className="font-semibold">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const s = getValue<string>();
          let tone =
            "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
          if (
            s?.toLowerCase() === "approved" ||
            s?.toLowerCase() === "submitted"
          )
            tone =
              "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
          if (
            s?.toLowerCase() === "pending" ||
            s?.toLowerCase() === "pending submission"
          )
            tone =
              "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
          if (s?.toLowerCase() === "rejected")
            tone =
              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";

          return (
            <Badge variant="secondary" className={`font-medium ${tone}`}>
              {s}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          return (
            <ComplianceDetailsSheet
              type="policy"
              id={row.original.id}
              contractId={contractId || ""}
              basePath={basePath}
              currency={currency}
              actionsDisabled={!!actionsDisabled}
              trigger={
                <Button
                  variant="link"
                  className="text-green-600 font-semibold p-0 h-auto"
                >
                  View
                </Button>
              }
            />
          );
        },
      },
    ],
    [isContractVendorLike, contractId, basePath],
  );

  const securityColumns = useMemo<ColumnDef<SecurityRow>[]>(
    () => [
      { accessorKey: "securityId", header: "Security ID" },
      {
        accessorKey: "securityType",
        header: "Security Type",
        cell: ({ getValue }) => (
          <span className="text-slate-700 dark:text-slate-300">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ getValue }) => (
          <span className="font-semibold">{getValue<string>()}</span>
        ),
      },
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
        cell: ({ getValue }) => {
          const s = getValue<string>();
          let tone =
            "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
          if (
            s?.toLowerCase() === "approved" ||
            s?.toLowerCase() === "submitted"
          )
            tone =
              "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
          if (
            s?.toLowerCase() === "pending" ||
            s?.toLowerCase() === "pending submission"
          )
            tone =
              "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
          if (s?.toLowerCase() === "rejected")
            tone =
              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
          return (
            <Badge variant="secondary" className={`font-medium ${tone}`}>
              {s}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          return (
            <ComplianceDetailsSheet
              type="security"
              id={row.original.id}
              contractId={contractId || ""}
              basePath={basePath}
              currency={currency}
              actionsDisabled={!!actionsDisabled}
              trigger={
                <Button
                  variant="link"
                  className="text-green-600 font-semibold p-0 h-auto"
                >
                  View
                </Button>
              }
            />
          );
        },
      },
    ],
    [isContractVendorLike, contractId, basePath],
  );

  const policyRows: PolicyRow[] = useMemo(() => {
    if (!data?.policy) return [];
    return data.policy.map((p) => ({
      id: p._id || "",
      policyId: p.policyId || p._id || "-",
      policyName: p.policyName || "-",
      limit: formatMoneyNoSymbol(p.value),
      status: p.status || "Pending",
    }));
  }, [data?.policy]);

  const securityRows: SecurityRow[] = useMemo(() => {
    if (!data?.security) return [];
    return data.security.map((s) => {
      const dueDate = s.dueDate
        ? format(new Date(s.dueDate), "dd MMM yyyy")
        : "-";
      let dueIn = "-";
      if (s.dueDate) {
        const days = differenceInDays(new Date(s.dueDate), new Date());
        if (days > 0) dueIn = `${days} days`;
        else if (days === 0) dueIn = "Today";
        else dueIn = "Overdue";
      }

      return {
        id: s._id || "",
        securityId: s.securityTypeId || s._id || "-",
        securityType: formatSecurityType(s.securityType),
        amount: formatMoneyNoSymbol(s.amount),
        dueDate,
        dueIn,
        status: s.status || "Pending",
      };
    });
  }, [data?.security]);

  const filteredPolicyRows = useMemo(() => {
    if (!search) return policyRows;
    return policyRows.filter(
      (row) =>
        row.policyName.toLowerCase().includes(search.toLowerCase()) ||
        row.policyId.toLowerCase().includes(search.toLowerCase()),
    );
  }, [policyRows, search]);

  const filteredSecurityRows = useMemo(() => {
    if (!search) return securityRows;
    return securityRows.filter(
      (row) =>
        row.securityType.toLowerCase().includes(search.toLowerCase()) ||
        row.securityId.toLowerCase().includes(search.toLowerCase()),
    );
  }, [securityRows, search]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading compliance data...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Compliance & Security Details
        </h3>
        <div className="flex items-center gap-3">
          {canManagerActOnActive && (
            <>
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                onClick={handleReject}
                disabled={approveMutation.isPending || !!actionsDisabled}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={handleApprove}
                disabled={approveMutation.isPending || !!actionsDisabled}
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
          {canSubmitActive && (
            <SubmitPolicyDialog
              type={activeView}
              contractId={contractId || ""}
              basePath={basePath}
              title={`Submit ${activeView === "policy" ? "Policies" : "Security"}`}
              trigger={
                <Button
                  className="bg-[#2A4467] text-white hover:bg-[#1f3552]"
                  disabled={!!actionsDisabled}
                >
                  Submit {activeView === "policy" ? "Policies" : "Security"}
                </Button>
              }
            />
          )}
          <ExportReportSheet contractId={contractId ?? ""} contractType="Contract">
            <Button variant="outline" className="text-slate-600 border-slate-300">
              <Share2 className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </ExportReportSheet>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="space-y-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Insurance Coverage
            </p>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {data?.details?.coverage
                ? `${data.details.coverage} Coverages`
                : "-"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Contract Security
            </p>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {data?.details?.security ? "Yes" : "No"}
            </p>
          </div>
        </div>
        <div className="space-y-8">
          <div className="space-y-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Insurance Expiry Date
            </p>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {data?.details?.expDate
                ? format(new Date(data.details.expDate), "dd MMM yyyy")
                : "-"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Security Type
            </p>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {data?.details?.securityType &&
              Array.isArray(data.details.securityType)
                ? data.details.securityType
                    .map((t) => formatSecurityType(t.securityType))
                    .filter((label) => label && label !== "-")
                    .join(", ") || "-"
                : data?.details?.securityType &&
                    typeof data.details.securityType === "object"
                  ? formatSecurityType(
                      (data.details.securityType as { securityType?: string })
                        .securityType,
                    )
                  : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Toggle and Table Section */}
      <div className="space-y-6">
        {/* Custom Toggle */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full inline-flex">
            <button
              onClick={() => setActiveView("policy")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                activeView === "policy"
                  ? "bg-[#1E293B] text-white dark:bg-slate-200 dark:text-slate-900"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
              )}
            >
              Insurance Coverage
            </button>
            <button
              onClick={() => setActiveView("security")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                activeView === "security"
                  ? "bg-[#1E293B] text-white dark:bg-slate-200 dark:text-slate-900"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
              )}
            >
              Contract Security
            </button>
          </div>
        </div>

        {/* Search and Table */}
        <div className="space-y-4 border border-slate-300 dark:border-slate-700 rounded-md">
          <div className="flex items-center gap-4 p-4">
            <div className="font-medium text-slate-700 dark:text-slate-200 w-20">
              {activeView === "policy" ? "Policy" : "Security"}
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-950 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="border rounded-md bg-white dark:bg-slate-900 dark:border-slate-700">
            {activeView === "policy" ? (
              <DataTable<PolicyRow>
                data={filteredPolicyRows}
                columns={columns}
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
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceSecurityTab;
