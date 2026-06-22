import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SEOWrapper } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { PageLoader } from "@/components/ui/PageLoader";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import type { ApiResponseError, ContractDetail } from "@/types";
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@/store/authSlice";
import { vendorApi } from "./api/vendorApi";
import { contractManagerApi } from "./api/contractManagerApi";
import { approverApi } from "./api/approverApi";
import { viewOnlyApi } from "./api/viewOnlyApi";
import { companyAdminApi } from "./api/companyAdminApi";
import AnalyticsTabContent from "./layouts/AnalyticsTabContent";
import ApproversTabContent from "./layouts/ApproversTabContent";
import ActionLogTabContent from "./layouts/ActionLogTabContent";
import ChangeTabContent from "./layouts/ChangeTabContent";
import ClaimsTabContent from "./layouts/ClaimsTabContent";
import ComplianceTabContent from "./layouts/ComplianceTabContent";
import ClauseLibraryTabContent from "./layouts/ClauseLibraryTabContent";
import DeliverablesTabContent from "./layouts/DeliverablesTabContent";
import DocumentsTabContent from "./layouts/DocumentsTabContent";
import InvoiceTabContent from "./layouts/InvoiceTabContent";
import LemTabContent from "./layouts/LemTabContent";
import AmendmentsTabContent from "./layouts/AmendmentsTabContent";
import NcrLogTabContent from "./layouts/NcrLogTabContent";
import PaymentSummaryTabContent from "./layouts/PaymentSummaryTabContent";
import RateSheetsTabContent from "./layouts/RateSheetsTabContent";
import KpiTabContent from "./layouts/KpiTabContent";
import OverviewTab from "./layouts/OverviewTab";
import RfiTabContent from "./layouts/RfiTabContent";
import VendorReportsTabContent from "./layouts/VendorReportsTabContent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const formatContractStatus = (status?: ContractDetail["status"]) => {
  if (status === "active")
    return { label: "Active", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" };
  if (status === "publish")
    return { label: "Published", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" };
  if (status === "draft")
    return { label: "Draft", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };
  if (status === "pending_approval")
    return {
      label: "Pending Approval",
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    };
  if (status === "completed")
    return { label: "Completed", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" };
  if (status === "cancelled")
    return { label: "Cancelled", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
  if (status === "expired")
    return { label: "Expired", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" };
  if (status === "terminated")
    return { label: "Terminated", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
  return { label: "Unknown", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };
};

type TabKey =
  | "overview"
  | "analytics"
  | "kpi"
  | "compliance"
  | "documents"
  | "amendments"
  | "deliverables"
  | "payment-summary"
  | "rate-sheets"
  | "lem"
  | "invoice"
  | "change"
  | "claims"
  | "rfi"
  | "ncr-log"
  | "approvers"
  | "reports"
  | "clause-library"
  | "action-log";

const ALL_TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "analytics", label: "Analytics" },
  { key: "kpi", label: "KPI" },
  { key: "compliance", label: "Compliance & Security" },
  { key: "documents", label: "Documents" },
  { key: "amendments", label: "Amendments" },
  { key: "deliverables", label: "Deliverables" },
  { key: "payment-summary", label: "Payment Summary" },
  { key: "rate-sheets", label: "Rate Sheets" },
  { key: "lem", label: "LEM" },
  { key: "invoice", label: "Invoice" },
  { key: "change", label: "Change Management" },
  { key: "claims", label: "Claims" },
  { key: "rfi", label: "RFI" },
  { key: "ncr-log", label: "NCR Log" },
  { key: "approvers", label: "Approvers" },
  { key: "reports", label: "Vendor’s Reports" },
  { key: "clause-library", label: "Clause Library" },
  { key: "action-log", label: "Action Log" },
];

const ALL_TAB_KEYS = new Set<string>(ALL_TABS.map((t) => t.key));

const ROLE_TAB_WHITELIST: Record<
  "approver" | "vendor" | "manager" | "view only",
  TabKey[]
> = {
  approver: [
    "overview",
    "analytics",
    "payment-summary",
    "documents",
    "amendments",
    "change",
    "claims",
    "invoice",
    "rfi",
    "lem",
    "deliverables",
    "ncr-log",
  ],
  vendor: [
    "overview",
    "payment-summary",
    "change",
    "claims",
    "deliverables",
    "lem",
    "invoice",
    "rfi",
    "documents",
    "reports",
    "ncr-log",
    "compliance",
    "amendments",
    "rate-sheets",
  ],
  manager: ALL_TABS.map((t) => t.key),
  "view only": [
    "overview",
    "payment-summary",
    "documents",
    "amendments",
    "change",
    "claims",
    "invoice",
    "rfi",
    "lem",
    "deliverables",
    "ncr-log",
  ],
};

const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<unknown>(null);
  const {
    isVendor,
    isProjectManager: isRoleProjectManager,
    isApprover,
    isViewOnly,
    isCompanyAdmin,
    isManager,
  } = useUserRole();
  const isContractVendorLike = isVendor || isRoleProjectManager;
  const queryKey = useUserQueryKey(["contract-manager-contracts", id]);
  const approveStatusQueryKey = useUserQueryKey([
    "contract-approver-approve-status",
    undefined,
  ]);
  const queryClient = useQueryClient();

  const [approvalDialogOpen, setApprovalDialogOpen] = React.useState(false);
  const [approvalAction, setApprovalAction] = React.useState<
    "approved" | "rejected" | null
  >(null);
  const [comment, setComment] = React.useState("");
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<TabKey>(() => {
    const tab = searchParams.get("tab");
    return tab && ALL_TAB_KEYS.has(tab) ? (tab as TabKey) : "overview";
  });

  const {
    data: contractsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => {
      if (isContractVendorLike) return vendorApi.getContract(id ?? "");
      if (isApprover) return approverApi.getContract(id ?? "");
      if (isCompanyAdmin) return companyAdminApi.getContract(id ?? "");
      if (isViewOnly) return viewOnlyApi.getContract(id ?? "");
      return contractManagerApi.getContract(id ?? "");
    },
    enabled: !!id,
    staleTime: 60000,
    retry: false,
  });

  const { data: approveStatusResponse } = useQuery({
    queryKey: [approveStatusQueryKey[0], contractsResponse?.data?.data?._id],
    queryFn: () =>
      approverApi.getApproveStatus(contractsResponse?.data?.data?._id ?? ""),
    enabled:
      !!contractsResponse?.data?.data?._id &&
      isApprover &&
      contractsResponse?.data?.data?.status === "pending_approval",
    staleTime: 60000,
    retry: false,
  });

  const contractData = contractsResponse?.data?.data;
  const user = useUser();

  const isContractProjectManager = Boolean(
    user?.projectmanagerId &&
    contractData?.projectManager?.user?._id === user.projectmanagerId,
  );
  // Keep the approve/reject actions available until the PM has approved.
  // A prior rejection still lets the PM revisit the decision; only an
  // "approved" status finalizes it and hides the buttons.
  const isContractProjectManagerNotApproved =
    contractData?.projectManager?.status === "pending" ||
    contractData?.projectManager?.status === "rejected";

  const canProjectManagerApprove =
    isContractProjectManager &&
    isContractProjectManagerNotApproved &&
    contractData?.status === "pending_approval";

  const approvalMutation = useMutation({
    mutationFn: async (action: "approved" | "rejected") => {
      if (canProjectManagerApprove) {
        return vendorApi.approveContract(id ?? "", { action, comment });
      }
      return approverApi.approveContract(id ?? "", {
        action,
        comment,
      });
    },
    onSuccess: (res, action) => {
      toastHandler.success(
        `Contract ${action === "approved" ? "approved" : "rejected"} successfully`,
        res.data.message,
      );
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({
        queryKey: [
          approveStatusQueryKey[0],
          contractsResponse?.data?.data?._id,
        ],
      });
      setApprovalDialogOpen(false);
      setApprovalAction(null);
      setComment("");
    },
    onError: (err: ApiResponseError) => {
      toastHandler.error("Failed to update contract status", err);
    },
  });

  const handleApprovalAction = (action: "approved" | "rejected") => {
    setApprovalAction(action);
    setApprovalDialogOpen(true);
  };

  const submitApproval = () => {
    if (approvalAction) {
      approvalMutation.mutate(approvalAction);
    }
  };

  React.useEffect(() => {
    toastErrorRef.current = toastHandler.error;
  }, [toastHandler.error]);

  React.useEffect(() => {
    if (!error) return;
    if (lastErrorRef.current === error) return;
    lastErrorRef.current = error;
    toastErrorRef.current("Contract Details", error as ApiResponseError);
  }, [error]);

  const visibleTabs = React.useMemo(() => {
    if (isApprover) {
      return ALL_TABS.filter((t) =>
        ROLE_TAB_WHITELIST.approver.includes(t.key),
      );
    }
    if (isContractVendorLike) {
      return ALL_TABS.filter((t) => ROLE_TAB_WHITELIST.vendor.includes(t.key));
    }
    if (isViewOnly) {
      return ALL_TABS.filter((t) =>
        ROLE_TAB_WHITELIST["view only"].includes(t.key),
      );
    }
    if (isManager) {
      return ALL_TABS.filter((t) => ROLE_TAB_WHITELIST.manager.includes(t.key));
    }
    return ALL_TABS;
  }, [isApprover, isContractVendorLike, isViewOnly, isManager]);

  // A deep-linked ?tab= may point at a tab this role can't see — fall back to overview.
  React.useEffect(() => {
    if (!visibleTabs.some((t) => t.key === activeTab)) {
      setActiveTab("overview");
    }
  }, [visibleTabs, activeTab]);

  if (isLoading) {
    return (
      <PageLoader
        title="Contract Details"
        message="Loading contract details..."
        className="space-y-8"
      />
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <SEOWrapper
          title="Contract Details - SwiftPro eProcurement Portal"
          description="View contract overview, team, and key information."
          canonical={`/dashboard/contract-management/${id ?? ""}`}
          robots="noindex, nofollow"
        />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load contract details.
        </div>
      </div>
    );
  }

  const contract = contractsResponse?.data?.data;

  if (!contract) {
    return (
      <div className="space-y-8">
        <SEOWrapper
          title="Contract Details - SwiftPro eProcurement Portal"
          description="View contract overview, team, and key information."
          canonical={`/dashboard/contract-management/${id ?? ""}`}
          robots="noindex, nofollow"
        />
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-700">
          Contract not found.
        </div>
      </div>
    );
  }

  const status = formatContractStatus(contract?.status);
  const actionsDisabled = contract?.status === "pending_approval";

  const canApprove = approveStatusResponse?.data?.data?.status === "pending";
  const hasAprovedorRejected =
    approveStatusResponse?.data?.data?.status === "approved" ||
    approveStatusResponse?.data?.data?.status === "rejected";
  const hasNoAuthorization =
    approveStatusResponse?.data?.data?.status === "N/A";

  const triggerClass =
    "data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3 text-sm";

  return (
    <div className="space-y-8 pt-5">
      <SEOWrapper
        title="Contract Details - SwiftPro eProcurement Portal"
        description="View contract overview, team, and key information."
        canonical={`/dashboard/contract-management/${contract?._id ?? ""}`}
        robots="noindex, nofollow"
      />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/contract-management">
              Contracts
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Contract Details</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {contract?.title ?? "Contract Details"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {contract?.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{contract?.contractId}</p>
        </div>
        <Badge className={status?.className}>{status?.label}</Badge>
      </div>

      {((isApprover && canApprove && !hasAprovedorRejected) ||
        canProjectManagerApprove) && (
        <div
          className={cn("flex items-center gap-4", {
            hidden: hasNoAuthorization && !canProjectManagerApprove,
          })}
        >
          <Button
            variant="default"
            className="bg-[#2A4467] hover:bg-[#2A4467]/90"
            onClick={() => handleApprovalAction("approved")}
          >
            Approve Contract
          </Button>
          <Button
            variant="outline"
            className="bg-[#F3F4F6] border-[#E5E7EB]"
            onClick={() => handleApprovalAction("rejected")}
          >
            Reject Contract
          </Button>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabKey)}
        className="w-full bg-transparent space-y-4"
      >
        <div
          className="overflow-x-auto pb-4 -mx-1 px-1"
          style={{ width: "1px", minWidth: "100%" }}
        >
          <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 justify-start bg-transparent w-max">
            {visibleTabs.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className={triggerClass}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <OverviewTab
          contract={contract}
          currency={contract?.currency}
          status={status}
        />

        <AnalyticsTabContent
          currency={contract?.currency}
          isActive={activeTab === "analytics"}
        />

        <KpiTabContent
          contractId={contract?._id ?? ""}
          currency={contract?.currency}
          isActive={activeTab === "kpi"}
        />

        <ComplianceTabContent
          currency={contract?.currency}
          isActive={activeTab === "compliance"}
          actionsDisabled={actionsDisabled}
          owner={contract?.owner}
        />

        <ChangeTabContent
          contractId={contract?._id ?? ""}
          currency={contract?.currency}
          isActive={activeTab === "change"}
          actionsDisabled={actionsDisabled}
        />

        <ClaimsTabContent
          contractId={contract?._id ?? ""}
          currency={contract?.currency}
          isActive={activeTab === "claims"}
          actionsDisabled={actionsDisabled}
        />

        <ApproversTabContent
          contractId={contract?._id ?? ""}
          currency={contract?.currency}
          isActive={activeTab === "approvers"}
        />

        <InvoiceTabContent
          contractId={contract?._id ?? ""}
          currency={contract?.currency}
          isActive={activeTab === "invoice"}
          actionsDisabled={actionsDisabled}
          owner={contract?.owner}
        />

        <DeliverablesTabContent />

        <RateSheetsTabContent
          contractId={contract?._id ?? ""}
          currency={contract?.currency}
          isActive={activeTab === "rate-sheets"}
        />

        <LemTabContent
          contractId={contract?._id ?? ""}
          currency={contract?.currency}
          isActive={activeTab === "lem"}
        />

        <RfiTabContent
          contractId={contract?._id ?? ""}
          currency={contract?.currency}
          isActive={activeTab === "rfi"}
          actionsDisabled={actionsDisabled}
        />

        <NcrLogTabContent
          contractId={contract?._id ?? ""}
          contract={contract}
          isActive={activeTab === "ncr-log"}
          actionsDisabled={actionsDisabled}
        />

        <DocumentsTabContent
          currency={contract?.currency}
          files={contract?.files}
          contractId={contract?._id ?? ""}
          effectiveDate={contract?.startDate}
          status={contract?.status}
          actionsDisabled={contract?.status === "publish"}
        />

        <AmendmentsTabContent
          contractId={contract?._id ?? ""}
          currency={contract?.currency}
          isActive={activeTab === "amendments"}
          actionsDisabled={actionsDisabled}
        />

        <PaymentSummaryTabContent
          contractId={contract?._id ?? ""}
          currency={contract?.currency}
          contract={contract}
          isActive={activeTab === "payment-summary"}
        />

        <ClauseLibraryTabContent
          currency={contract?.currency}
          vendorName={contract?.vendor?.name}
          isActive={activeTab === "clause-library"}
        />

        <VendorReportsTabContent
          contractId={contract?._id ?? ""}
          isActive={activeTab === "reports"}
          contractStatus={contract?.status}
        />

        <ActionLogTabContent isActive={activeTab === "action-log"} />
      </Tabs>

      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-50">
              {approvalAction === "approved"
                ? "Approve Contract"
                : "Reject Contract"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {approvalAction === "approved"
                ? "Are you sure you want to approve this contract? This action cannot be undone."
                : "Please provide a reason for rejecting this contract."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="Add a comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovalDialogOpen(false)}
              className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={submitApproval}
              disabled={approvalMutation.isPending}
              variant={
                approvalAction === "rejected" ? "destructive" : "default"
              }
              className={
                approvalAction === "approved"
                  ? "bg-[#2A4467] text-slate-50 hover:bg-[#2A4467]/90 dark:bg-[#2A4467] dark:text-slate-50 dark:hover:bg-[#2A4467]/80"
                  : undefined
              }
            >
              {approvalMutation.isPending
                ? "Processing..."
                : approvalAction === "approved"
                  ? "Approve"
                  : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractDetailPage;
