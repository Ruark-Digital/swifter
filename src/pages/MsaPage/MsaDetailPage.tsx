import React from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SEOWrapper } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useUserRole } from "@/hooks/useUserRole";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { Textarea } from "@/components/ui/textarea";
import CreateMSADialog from "./layouts/CreateMSADialog";
import Overview from "./layouts/Overview";
import Analytics from "./layouts/Analytics";
import LinkedContracts from "./layouts/LinkedContracts";
import PaymentSummary from "./layouts/PaymentSummary";
import Documents from "./layouts/Documents";
import Amendments from "./layouts/Amendments";
import Kpi from "./layouts/Kpi";
import Compliance from "./layouts/Compliance";
import ChangeManagement from "./layouts/ChangeManagement";
import Claims from "./layouts/Claims";
import Invoice from "./layouts/Invoice";
import Rfi from "./layouts/Rfi";
import Lem from "./layouts/Lem";
import Approvers from "./layouts/Approvers";
import Deliverables from "./layouts/Deliverables";
import Reports from "./layouts/Reports";
import NcrLog from "./layouts/NcrLog";
import { Share2 } from "lucide-react";
import { Status } from "./components/StatusBadge";
import { useUser } from "@/store/authSlice";
import type { ApiResponseError } from "@/types";

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
  | "reports";

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
];

const ROLE_TAB_WHITELIST: Record<
  "approver" | "vendor" | "manager" | "view only",
  TabKey[]
> = {
  approver: [
    "overview",
    "documents",
    "amendments",
    "lem",
    "invoice",
    "change",
    "claims",
    "rfi",
    "deliverables",
    "ncr-log",
    // "approvers" intentionally omitted — approvers can't see the Approvers tab
    "reports",
    "payment-summary",
  ],
  vendor: [
    "overview",
    "compliance",
    "documents",
    "amendments",
    "lem",
    "invoice",
    "change",
    "claims",
    "rfi",
    "deliverables",
    "ncr-log",
    // "approvers" intentionally omitted — vendors and project managers can't see the Approvers tab
    "reports",
    "payment-summary",
  ],
  manager: [
    "overview",
    "analytics",
    "kpi",
    "compliance",
    "documents",
    "amendments",
    "lem",
    "invoice",
    "change",
    "claims",
    "rfi",
    "deliverables",
    "ncr-log",
    "approvers",
    "reports",
    "payment-summary",
  ],
  "view only": [
    "overview",
    "documents",
    "amendments",
    "lem",
    "invoice",
    "change",
    "claims",
    "rfi",
    "deliverables",
    "ncr-log",
    "approvers",
    "reports",
  ],
};

type MsaStatus =
  | "draft"
  | "publish"
  | "active"
  | "completed"
  | "cancelled"
  | "expired"
  | "terminated"
  | "pending_approval";

const toMsaStatus = (value?: string): MsaStatus | undefined => {
  switch (value) {
    case "draft":
    case "publish":
    case "active":
    case "completed":
    case "cancelled":
    case "expired":
    case "terminated":
    case "pending_approval":
      return value;
    default:
      return undefined;
  }
};

const formatMsaStatus = (
  status?: MsaStatus,
): {
  label: Status;
  className: string;
} => {
  if (status === "active")
    return { label: "active", className: "bg-green-100 text-green-700" };
  if (status === "publish")
    return { label: "publish", className: "bg-green-100 text-green-700" };
  if (status === "draft")
    return { label: "draft", className: "bg-slate-100 text-slate-700" };
  if (status === "pending_approval")
    return {
      label: "pending_approval",
      className: "bg-yellow-100 text-yellow-700",
    };
  if (status === "completed")
    return { label: "completed", className: "bg-blue-100 text-blue-700" };
  if (status === "cancelled")
    return { label: "cancelled", className: "bg-red-100 text-red-700" };
  if (status === "expired")
    return { label: "expired", className: "bg-orange-100 text-orange-700" };
  if (status === "terminated")
    return { label: "terminated", className: "bg-red-100 text-red-700" };
  return { label: "draft", className: "bg-slate-100 text-slate-700" };
};

export interface MSAContractDetail {
  vendor: Vendor;
  contractFormationStage: ContractFormationStage;
  _id: string;
  company: Company;
  creator: Creator;
  internalTeam: Approver[];
  managers: any[];
  businessDivision: BusinessDivision;
  rating: number;
  title: string;
  msaContractId: string;
  description: string;
  msaType: Company;
  visibility: string;
  currency: string;
  contractValue: number;
  contigency: string;
  holdBack: number;
  holdBackBank: number;
  paymentStructure: string;
  deliverables: string[];
  assignContract?: Array<{ _id?: string; name?: string }>;
  insurance: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  files: File[];
  currentApprovalLevel: number;
  approvers: Approver[];
  status: string;
  signatories: Signatory[];
  datePublished: Date;
  timezone: string;
  isDeleted: boolean;
  vendorPersonnel: any[];
  milestone: any[];
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  holdBackReleased: number;
  savingAmount: number;
  projectManager?: { status?: string; user?: { _id?: string } };
}

export interface Approver {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface BusinessDivision {
  _id: string;
  name: string;
  location: string;
}

export interface Company {
  _id: string;
  name: string;
}

export interface ContractFormationStage {
  draft: Approval;
  review: Approval;
  approval: Approval;
  execution: Approval;
}

export interface Approval {
  startDate: string;
  endDate: string;
}

export interface Creator {
  _id: string;
  name: string;
  email: string;
  role: Company;
}

export interface File {
  name: string;
  url: string;
  type: string;
  size: string;
  _id: string;
  uploadedAt: string;
}

export interface Signatory {
  user: string;
  userRef: string;
  status: string;
  _id: string;
}

export interface Vendor {
  status: string;
}

const formatDate = (iso?: string) => {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};

const diffDays = (a?: string, b?: string) => {
  if (!a || !b) return "N/A";
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) return "N/A";
  const days = Math.max(0, Math.round((db - da) / (1000 * 60 * 60 * 24)));
  return `${days} days`;
};

const toISO = (d?: Date | string) => {
  if (!d) return undefined;
  return typeof d === "string" ? d : d.toISOString();
};

const MsaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<unknown>(null);
  const {
    isVendor,
    isApprover,
    isViewOnly,
    isManager,
    isProjectManager,
    isCompanyAdmin,
  } = useUserRole();
  const queryKey = useUserQueryKey(["msa-contracts-detail", id]);
  const approveStatusQueryKey = useUserQueryKey(["msa-approve-status", id]);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<TabKey>("overview");
  const [topTab, setTopTab] = React.useState<"details" | "linked">("details");
  const [approvalDialogOpen, setApprovalDialogOpen] = React.useState(false);
  const [approvalAction, setApprovalAction] = React.useState<
    "approved" | "rejected" | null
  >(null);
  const [comment, setComment] = React.useState("");

  const {
    data: msaResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const base =
        isVendor || isProjectManager
          ? "/contract/vendor"
          : isApprover
            ? "/contract/approver"
            : isViewOnly
              ? "/contract/user"
              : "/contract/manager";
      return getRequest({ url: `${base}/msa-contracts/${id ?? ""}` });
    },
    enabled: !!id,
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
    toastErrorRef.current("MSA Details", error as any);
  }, [error]);

  const visibleTabs = React.useMemo(() => {
    if (isApprover)
      return ALL_TABS.filter((t) =>
        ROLE_TAB_WHITELIST.approver.includes(t.key),
      );
    if (isVendor || isProjectManager)
      return ALL_TABS.filter((t) => ROLE_TAB_WHITELIST.vendor.includes(t.key));
    if (isViewOnly)
      return ALL_TABS.filter((t) =>
        ROLE_TAB_WHITELIST["view only"].includes(t.key),
      );
    if (isManager)
      return ALL_TABS.filter((t) => ROLE_TAB_WHITELIST.manager.includes(t.key));
    return ALL_TABS;
  }, [isApprover, isVendor, isProjectManager, isViewOnly, isManager]);

  const msa = msaResponse?.data?.data as MSAContractDetail | undefined;

  const canFetchLinkedContracts = (isManager || isCompanyAdmin) && Boolean(id);
  const linkedContractsQueryKey = useUserQueryKey(["msa-linked-contract", id]);

  const { data: linkedContractsResponse, isLoading: isLinkedContractsLoading } =
    useQuery({
      queryKey: linkedContractsQueryKey,
      queryFn: async () => {
        return getRequest({
          url: `/contract/manager/msa-contracts/${id ?? ""}/linked-contract`,
        });
      },
      enabled: canFetchLinkedContracts && topTab === "linked",
      staleTime: 60_000,
      retry: false,
    });

  const formatMoney = React.useCallback(
    (value?: unknown, currency?: string) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return undefined;
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: currency ?? "USD",
          maximumFractionDigits: 0,
        }).format(num);
      } catch {
        return `$${num.toLocaleString()}`;
      }
    },
    [],
  );

  const linkedContractRows = React.useMemo(() => {
    const raw = (linkedContractsResponse?.data as any)?.data;
    if (!raw) return [];

    const items = Array.isArray(raw) ? raw : [raw];
    return items.filter(Boolean).map((it: any) => ({
      title: String(it?.title ?? "-"),
      code: String(it?.contractId ?? "-"),
      id: String(it?._id ?? ""),
      company: String(it?.company?.name ?? "-"),
      relationship: String(it?.contractRelationship ?? "-"),
      value: formatMoney(it?.contractValue, it?.currency),
      published: it?.datePublished ? formatDate(it.datePublished) : undefined,
      endDate: it?.endDate ? formatDate(it.endDate) : undefined,
      status: String(it?.status ?? "-"),
    }));
  }, [formatMoney, linkedContractsResponse?.data]);

  const user = useUser();
  const isMsaProjectManager = Boolean(
    user?.projectmanagerId &&
    msa?.projectManager?.user?._id === user.projectmanagerId,
  );
  const isMsaProjectManagerPending = msa?.projectManager?.status === "pending";
  const canProjectManagerApprove =
    isMsaProjectManager &&
    isMsaProjectManagerPending &&
    msa?.status === "pending_approval";

  const { data: approveStatusResponse } = useQuery({
    queryKey: [approveStatusQueryKey[0], msa?._id],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/approver/msa-contracts/${msa?._id ?? ""}/approve/status`,
      });
      return res.data as { data?: { status?: string } };
    },
    enabled:
      Boolean(msa?._id) && isApprover && msa?.status === "pending_approval",
    staleTime: 60000,
    retry: false,
  });

  const canApprove = approveStatusResponse?.data?.status === "pending";
  const hasApprovedOrRejected =
    approveStatusResponse?.data?.status === "approved" ||
    approveStatusResponse?.data?.status === "rejected";

  const approvalMutation = useMutation({
    mutationFn: async (action: "approved" | "rejected") => {
      const payload = { action, comment };
      const url = canProjectManagerApprove
        ? `/contract/vendor/msa-contracts/${msa?._id ?? ""}/approve`
        : `/contract/approver/msa-contracts/${msa?._id ?? ""}/approve`;
      const res = await postRequest({ url, payload });
      return res.data as { message?: string };
    },
    onSuccess: (res, action) => {
      toastHandler.success(
        `MSA ${action === "approved" ? "approved" : "rejected"} successfully`,
        res?.message ?? "Success",
      );
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({
        queryKey: [approveStatusQueryKey[0], msa?._id],
      });
      setApprovalDialogOpen(false);
      setApprovalAction(null);
      setComment("");
    },
    onError: (err: ApiResponseError) => {
      toastHandler.error("Failed to update MSA status", err);
    },
  });

  const handleApprovalAction = (action: "approved" | "rejected") => {
    setApprovalAction(action);
    setApprovalDialogOpen(true);
  };

  const submitApproval = () => {
    if (approvalAction) approvalMutation.mutate(approvalAction);
  };

  if (isLoading) {
    return (
      <PageLoader
        title="MSA Details"
        message="Loading MSA details..."
        className="space-y-8"
      />
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <SEOWrapper
          title="MSA Details - SwiftPro eProcurement Portal"
          description="View MSA overview, team, and key information."
          canonical={`/dashboard/msa/${id ?? ""}`}
          robots="noindex, nofollow"
        />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load MSA details.
        </div>
      </div>
    );
  }

  if (!msa) {
    return (
      <div className="space-y-8">
        <SEOWrapper
          title="MSA Details - SwiftPro eProcurement Portal"
          description="View MSA overview, team, and key information."
          canonical={`/dashboard/msa/${id ?? ""}`}
          robots="noindex, nofollow"
        />
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-700 dark:text-slate-200">
          MSA not found.
        </div>
      </div>
    );
  }

  const status = formatMsaStatus(toMsaStatus(msa?.status));
  const triggerClass =
    "dark:text-slate-400 data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3";

  const stages = msa?.contractFormationStage;
  const draftDuration = diffDays(stages?.draft?.startDate, stages?.draft?.endDate);
  const reviewDuration = diffDays(
    stages?.review?.startDate,
    stages?.review?.endDate,
  );
  const approvalDuration = diffDays(
    stages?.approval?.startDate,
    stages?.approval?.endDate,
  );
  const executionDuration = diffDays(
    stages?.execution?.startDate,
    stages?.execution?.endDate,
  );
  const stageRange = (s?: { startDate?: string; endDate?: string }) => ({
    start: formatDate(s?.startDate),
    end: formatDate(s?.endDate),
  });
  const formationStages = {
    draft: stageRange(stages?.draft),
    review: stageRange(stages?.review),
    approval: stageRange(stages?.approval),
    execution: stageRange(stages?.execution),
  };
  const contractManagerName =
    (msa as any)?.contractManager?.name ||
    (msa as any)?.manager?.name ||
    msa?.creator?.name ||
    "";

  const internalTeam = Array.isArray(msa?.internalTeam)
    ? msa!.internalTeam
    : [];
  const vendorPersonnel = Array.isArray(msa?.vendorPersonnel)
    ? msa!.vendorPersonnel!
    : [];

  return (
    <div className="space-y-8 pt-5">
      <SEOWrapper
        title="MSA Details - SwiftPro eProcurement Portal"
        description="View MSA overview, team, and key information."
        canonical={`/dashboard/msa/${msa?._id ?? ""}`}
        robots="noindex, nofollow"
      />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/msa">MSA</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">MSA Details</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{msa?.title ?? "MSA Details"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {msa?.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{msa?.msaContractId}</p>
        </div>
        <Badge className={status?.className}>{status?.label}</Badge>
      </div>

      {((isApprover && canApprove && !hasApprovedOrRejected) ||
        canProjectManagerApprove) && (
        <div className="flex items-center gap-4 ">
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
        value={topTab}
        onValueChange={(v) => setTopTab(v as "details" | "linked")}
        className="w-full space-y-4"
      >
        <TabsList className="gap-2 p-2 bg-gray-200 rounded-full dark:bg-slate-800">
          <TabsTrigger
            value="details"
            className="rounded-full px-4 py-4 text-sm font-semibold border border-[#E5E7EB] dark:border-slate-700 text-slate-700 dark:text-slate-300 data-[state=active]:bg-[#2A4467] data-[state=active]:text-white data-[state=active]:border-[#2A4467] data-[state=active]:dark:text-white"
          >
            MSA Details
          </TabsTrigger>
          <TabsTrigger
            value="linked"
            className="rounded-full px-4 py-4 text-sm font-semibold border border-[#E5E7EB] dark:border-slate-700 text-slate-700 dark:text-slate-300 data-[state=active]:bg-[#2A4467] data-[state=active]:text-white data-[state=active]:border-[#2A4467] data-[state=active]:dark:text-white"
          >
            Linked Contracts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
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
                  <TabsTrigger
                    key={t.key}
                    value={t.key}
                    className={triggerClass}
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="overview">
              <div className="flex items-center justify-end w-full gap-3 pb-3">
                <Button
                  variant="outline"
                  className="h-9 rounded-lg border-[#E5E7EB] dark:border-slate-700 px-3 text-xs font-semibold text-[#0F0F0F] dark:text-slate-100"
                >
                  <Share2 className="mr-2 h-4 w-4" /> Export Report
                </Button>
                {isManager && (
                  <CreateMSADialog
                    trigger={
                      <Button
                        variant="secondary"
                        className="h-9 rounded-lg border-[#E5E7EB] dark:border-slate-700 px-3 text-xs font-semibold text-[#0F0F0F] dark:text-slate-100"
                        disabled={msa?.status !== "draft"}
                      >
                        Edit MSA
                      </Button>
                    }
                    editingMsaId={msa?._id ?? undefined}
                    initialValues={msa as any}
                  />
                )}
              </div>

              <Overview
                msa={{
                  title: msa?.title,
                  msaContractId: msa?.msaContractId,
                  msaType:
                    typeof msa?.msaType === "string"
                      ? msa?.msaType
                      : msa?.msaType?.name,
                  rating: msa?.rating,
                  businessDivision:
                    typeof msa?.businessDivision === "object"
                      ? msa?.businessDivision?.name
                      : (msa as any)?.businessDivision,
                  description: msa?.description,
                }}
                dates={{
                  published: formatDate(toISO(msa?.datePublished)),
                  effective: formatDate(toISO(msa?.startDate)),
                  end: formatDate(toISO(msa?.endDate)),
                }}
                durations={{
                  draft: draftDuration,
                  review: reviewDuration,
                  approval: approvalDuration,
                  execution: executionDuration,
                }}
                formationStages={formationStages}
                status={status}
                contractManager={contractManagerName}
                internalTeam={internalTeam}
                vendorPersonnel={vendorPersonnel}
              />
            </TabsContent>

            <Analytics
              contractId={id ?? ""}
              isActive={activeTab === "analytics"}
            />

            <Documents
              contractId={id ?? ""}
              files={msa?.files}
              isActive={activeTab === "documents"}
              status={msa?.status}
            />

            <Amendments
              contractId={id ?? ""}
              isActive={activeTab === "amendments"}
              actionsDisabled={msa?.status === "pending_approval"}
            />

            <Compliance
              contractId={id ?? ""}
              isActive={activeTab === "compliance"}
              actionsDisabled={msa?.status === "pending_approval"}
            />

            <ChangeManagement
              contractId={id ?? ""}
              isActive={activeTab === "change"}
              actionsDisabled={msa?.status === "pending_approval"}
            />

            <Invoice
              contractId={id ?? ""}
              isActive={activeTab === "invoice"}
              actionsDisabled={msa?.status === "pending_approval"}
            />

            <Claims
              contractId={id ?? ""}
              isActive={activeTab === "claims"}
              actionsDisabled={msa?.status === "pending_approval"}
            />

            <Rfi
              contractId={id ?? ""}
              isActive={activeTab === "rfi"}
              actionsDisabled={msa?.status === "pending_approval"}
            />

            <NcrLog
              contractId={id ?? ""}
              contract={msa as any}
              isActive={activeTab === "ncr-log"}
            />

            <Deliverables
              contractId={id ?? ""}
              isActive={activeTab === "deliverables"}
            />

            <Lem contractId={id ?? ""} isActive={activeTab === "lem"} />

            <Approvers
              contractId={id ?? ""}
              isActive={activeTab === "approvers"}
            />

            <Reports contractId={id ?? ""} isActive={activeTab === "reports"} />

            <Kpi contractId={id ?? ""} isActive={activeTab === "kpi"} />

            <PaymentSummary
              contractId={id ?? ""}
              msa={msa}
              isActive={activeTab === "payment-summary"}
            />
          </Tabs>
        </TabsContent>

        <TabsContent value="linked">
          <div className="pt-4">
            <LinkedContracts
              rows={linkedContractRows}
              isLoading={isLinkedContractsLoading}
            />
          </div>
        </TabsContent>
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
              className="resize-none text-slate-900 dark:text-slate-100"
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

export default MsaDetailPage;
