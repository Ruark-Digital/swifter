import React from "react";
import { useParams } from "react-router-dom";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
    return { label: "Active", className: "bg-green-100 text-green-700" };
  if (status === "publish")
    return { label: "Published", className: "bg-green-100 text-green-700" };
  if (status === "draft")
    return { label: "Draft", className: "bg-slate-100 text-slate-700" };
  if (status === "pending_approval")
    return {
      label: "Pending Approval",
      className: "bg-yellow-100 text-yellow-700",
    };
  if (status === "completed")
    return { label: "Completed", className: "bg-blue-100 text-blue-700" };
  if (status === "cancelled")
    return { label: "Cancelled", className: "bg-red-100 text-red-700" };
  if (status === "expired")
    return { label: "Expired", className: "bg-orange-100 text-orange-700" };
  if (status === "terminated")
    return { label: "Terminated", className: "bg-red-100 text-red-700" };
  return { label: "Unknown", className: "bg-slate-100 text-slate-700" };
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

const ROLE_TAB_WHITELIST: Record<
  "approver" | "vendor" | "manager" | "view only",
  TabKey[]
> = {
  approver: [
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
    "rate-sheets"
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
  const { isVendor, isApprover, isViewOnly, isCompanyAdmin, isManager } =
    useUserRole();
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
  const [activeTab, setActiveTab] = React.useState<TabKey>("overview");

  const {
    data: contractsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => {
      if (isVendor) return vendorApi.getContract(id ?? "");
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
    queryFn: () => approverApi.getApproveStatus(contract?._id ?? ""),
    enabled:
      !!contractsResponse?.data?.data?._id &&
      isApprover &&
      contractsResponse?.data?.data?.status === "pending_approval",
    staleTime: 60000,
    retry: false,
  });

  const approvalMutation = useMutation({
    mutationFn: async (action: "approved" | "rejected") => {
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
    if (isVendor) {
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
  }, [isApprover, isVendor, isViewOnly, isManager]);

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
    "data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3";

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
          <h1 className="text-2xl font-semibold text-slate-900">
            {contract?.title}
          </h1>
          <p className="text-sm text-slate-500">{contract?.contractId}</p>
        </div>
        <Badge className={status?.className}>{status?.label}</Badge>
      </div>

      {isApprover && canApprove && !hasAprovedorRejected && (
        <div
          className={cn("flex items-center gap-4", {
            hidden: hasNoAuthorization,
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
        <ScrollArea className="pb-4 w-[75vw]">
          <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 justify-start bg-transparent">
            {visibleTabs.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className={triggerClass}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <OverviewTab contract={contract} status={status} />

        <AnalyticsTabContent isActive={activeTab === "analytics"} />

        <KpiTabContent
          contractId={contract?._id ?? ""}
          isActive={activeTab === "kpi"}
        />

        <ComplianceTabContent isActive={activeTab === "compliance"} />

        <ChangeTabContent
          contractId={contract?._id ?? ""}
          isActive={activeTab === "change"}
          actionsDisabled={actionsDisabled}
        />

        <ClaimsTabContent
          contractId={contract?._id ?? ""}
          isActive={activeTab === "claims"}
          actionsDisabled={actionsDisabled}
        />

        <ApproversTabContent
          contractId={contract?._id ?? ""}
          isActive={activeTab === "approvers"}
        />

        <InvoiceTabContent
          contractId={contract?._id ?? ""}
          isActive={activeTab === "invoice"}
        />

        <DeliverablesTabContent />

        <RateSheetsTabContent
          contractId={contract?._id ?? ""}
          isActive={activeTab === "rate-sheets"}
        />

        <LemTabContent
          contractId={contract?._id ?? ""}
          isActive={activeTab === "lem"}
        />

        <RfiTabContent
          contractId={contract?._id ?? ""}
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
          files={contract?.files}
          contractId={contract?._id ?? ""}
          effectiveDate={contract?.startDate}
          actionsDisabled={contract?.status === "publish"}
        />

        <AmendmentsTabContent
          contractId={contract?._id ?? ""}
          isActive={activeTab === "amendments"}
          actionsDisabled={actionsDisabled}
        />

        <PaymentSummaryTabContent
          contractId={contract?._id ?? ""}
          contract={contract}
          isActive={activeTab === "payment-summary"}
        />

        <ClauseLibraryTabContent isActive={activeTab === "clause-library"} />

        <VendorReportsTabContent
          contractId={contract?._id ?? ""}
          isActive={activeTab === "reports"}
        />

        <ActionLogTabContent isActive={activeTab === "action-log"} />
      </Tabs>

      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approved"
                ? "Approve Contract"
                : "Reject Contract"}
            </DialogTitle>
            <DialogDescription>
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
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitApproval}
              disabled={approvalMutation.isPending}
              variant={
                approvalAction === "rejected" ? "destructive" : "default"
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
