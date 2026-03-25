import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEOWrapper } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PageLoader } from "@/components/ui/PageLoader";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useUserRole } from "@/hooks/useUserRole";
import { getRequest } from "@/lib/axiosInstance";
import Overview from "./layouts/Overview";
import LinkedContracts from "./layouts/LinkedContracts";
import PaymentSummary from "./layouts/PaymentSummary";
import Documents from "./layouts/Documents";
import Amendments from "./layouts/Amendments";
import Kpi from "./layouts/Kpi";
import Compliance from "./layouts/Compliance";
import ChangeManagement from "./layouts/ChangeManagement";
import Claims from "./layouts/Claims";
import Invoice from "./layouts/Invoice";
import { Share2 } from "lucide-react";

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
  { key: "action-log", label: "Action Log" },
];

const ROLE_TAB_WHITELIST: Record<
  "approver" | "vendor" | "manager" | "view only",
  TabKey[]
> = {
  approver: [
    "overview",
    "compliance",
    "documents",
    "amendments",
    "invoice",
    "change",
    "claims",
    "payment-summary",
  ],
  vendor: [
    "overview",
    "compliance",
    "documents",
    "amendments",
    "invoice",
    "change",
    "claims",
    "payment-summary",
  ],
  manager: [
    "overview",
    "kpi",
    "compliance",
    "documents",
    "amendments",
    "invoice",
    "change",
    "claims",
    "payment-summary",
  ],
  "view only": [
    "overview",
    "compliance",
    "documents",
    "amendments",
    "invoice",
    "change",
    "claims",
    "payment-summary",
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

const formatMsaStatus = (status?: MsaStatus) => {
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

export interface MSAContractDetail {
  _id: string;
  company: Company;
  creator: Creator;
  managers: any[];
  businessDivision: BusinessDivision;
  rating: number;
  title: string;
  msaContractId: string;
  description: string;
  msaType: MSAType;
  visibility: string;
  currency: string;
  contractValue: number;
  holdBackBank: number;
  deliverables: any[];
  insurance: string;
  duration: number;
  files: any[];
  currentApprovalLevel: number;
  status: string;
  timezone: string;
  isDeleted: boolean;
  vendorPersonnel: any[];
  internalTeam: any[];
  milestone: any[];
  approvers: any[];
  signatories: any[];
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  holdBackReleased: number;
  savingAmount: number;
  holdBack?: number | string;
  contigency?: number | string;
  contingency?: number | string;
  paymentStructure?: string;
  paymentTerms?: { name?: string } | string;
  paymentTerm?: { name?: string } | string;
}

export interface MSAType {
  _id: string;
  name: string;
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

export interface Creator {
  _id: string;
  name: string;
  email: string;
  role: Company;
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
  const { isVendor, isApprover, isViewOnly, isManager } = useUserRole();
  const queryKey = useUserQueryKey(["msa-contract-detail", id]);
  const [activeTab, setActiveTab] = React.useState<TabKey>("overview");
  const [topTab, setTopTab] = React.useState<"details" | "linked">("details");

  const {
    data: msaResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const base = isVendor
        ? "/contract/vendor"
        : isApprover
          ? "/contract/approver"
          : isViewOnly
            ? "/contract/user"
            : "/contract/manager";
      return getRequest({ url: `${base}/msa-contract/${id ?? ""}` });
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
    if (isVendor)
      return ALL_TABS.filter((t) => ROLE_TAB_WHITELIST.vendor.includes(t.key));
    if (isViewOnly)
      return ALL_TABS.filter((t) =>
        ROLE_TAB_WHITELIST["view only"].includes(t.key),
      );
    if (isManager)
      return ALL_TABS.filter((t) => ROLE_TAB_WHITELIST.manager.includes(t.key));
    return ALL_TABS;
  }, [isApprover, isVendor, isViewOnly, isManager]);

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

  const msa = msaResponse?.data?.data as MSAContractDetail | undefined;

  if (!msa) {
    return (
      <div className="space-y-8">
        <SEOWrapper
          title="MSA Details - SwiftPro eProcurement Portal"
          description="View MSA overview, team, and key information."
          canonical={`/dashboard/msa/${id ?? ""}`}
          robots="noindex, nofollow"
        />
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-700">
          MSA not found.
        </div>
      </div>
    );
  }

  const status = formatMsaStatus(toMsaStatus(msa?.status));
  const triggerClass =
    "data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3";

  const draftDuration = diffDays(undefined, undefined);
  const reviewDuration = diffDays(undefined, undefined);
  const approvalDuration = diffDays(undefined, undefined);
  const executionDuration = diffDays(undefined, undefined);

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
          <h1 className="text-2xl font-semibold text-slate-900">
            {msa?.title}
          </h1>
          <p className="text-sm text-slate-500">{msa?.msaContractId}</p>
        </div>
        <Badge className={status?.className}>{status?.label}</Badge>
      </div>

      <Tabs
        value={topTab}
        onValueChange={(v) => setTopTab(v as "details" | "linked")}
        className="w-full space-y-4"
      >
        <TabsList className="bg-transparent p-0 gap-2">
          <TabsTrigger
            value="details"
            className="rounded-full px-4 py-2 text-sm font-semibold border border-[#E5E7EB] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white data-[state=active]:border-[#2A4467]"
          >
            MSA Details
          </TabsTrigger>
          <TabsTrigger
            value="linked"
            className="rounded-full px-4 py-2 text-sm font-semibold border border-[#E5E7EB] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white data-[state=active]:border-[#2A4467]"
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
            <ScrollArea className="pb-4 w-[75vw]">
              <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 justify-start bg-transparent">
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
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <TabsContent value="overview">
              <div className="flex items-center justify-end w-full gap-3 pb-3">
                <Button
                  variant="outline"
                  className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
                >
                  <Share2 className="mr-2 h-4 w-4" /> Export Report
                </Button>
                <Button
                  variant="secondary"
                  className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
                >
                  Edit MSA
                </Button>
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
                  published: formatDate(toISO(msa?.createdAt)),
                  effective: formatDate(toISO(msa?.createdAt)),
                  end: formatDate(toISO(msa?.updatedAt)),
                }}
                durations={{
                  draft: draftDuration,
                  review: reviewDuration,
                  approval: approvalDuration,
                  execution: executionDuration,
                }}
                status={status}
                internalTeam={internalTeam}
                vendorPersonnel={vendorPersonnel}
              />
            </TabsContent>
            <Documents
              contractId={id ?? ""}
              files={msa?.files}
              isActive={activeTab === "documents"}
            />
            <Amendments
              contractId={id ?? ""}
              isActive={activeTab === "amendments"}
              actionsDisabled={msa?.status === "publish"}
            />
            <Compliance
              contractId={id ?? ""}
              isActive={activeTab === "compliance"}
            />
            <ChangeManagement
              contractId={id ?? ""}
              isActive={activeTab === "change"}
              actionsDisabled={msa?.status === "publish"}
            />
            <Invoice
              contractId={id ?? ""}
              isActive={activeTab === "invoice"}
              actionsDisabled={msa?.status === "publish"}
            />
            <Claims
              contractId={id ?? ""}
              isActive={activeTab === "claims"}
              actionsDisabled={msa?.status === "publish"}
            />
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
            <LinkedContracts rows={[]} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MsaDetailPage;
