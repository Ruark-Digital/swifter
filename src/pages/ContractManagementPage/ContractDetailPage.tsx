import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEOWrapper } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
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
import { contractManagerApi } from "./api/contractManagerApi";
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
import KpiTabContent from "./layouts/KpiTabContent";
import OverviewTab from "./layouts/OverviewTab";
import RfiTabContent from "./layouts/RfiTabContent";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import VendorReportsTabContent from "./layouts/VendorReportsTabContent";

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

const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<unknown>(null);
  const queryKey = useUserQueryKey(["contract-manager-contracts"]);

  const {
    data: contractsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => contractManagerApi.getContract(id ?? ""),
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
    toastErrorRef.current("Contract Details", error as ApiResponseError);
  }, [error]);

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

  return (
    <div className="space-y-8">
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
          <p className="text-sm text-slate-500">{contract?._id}</p>
        </div>
        <Badge className={status?.className}>{status?.label}</Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full bg-transparent space-y-4">
        <ScrollArea className="pb-4 w-[75vw]">
          <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0  justify-start bg-transparent">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="kpi"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              KPI
            </TabsTrigger>
            <TabsTrigger
              value="compliance"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Compliance & Security
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Documents
            </TabsTrigger>
            <TabsTrigger
              value="amendments"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Amendments
            </TabsTrigger>
            <TabsTrigger
              value="deliverables"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Deliverables
            </TabsTrigger>
            <TabsTrigger
              value="payment-summary"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Payment Summary
            </TabsTrigger>
            <TabsTrigger
              value="lem"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              LEM
            </TabsTrigger>
            <TabsTrigger
              value="invoice"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Invoice
            </TabsTrigger>
            <TabsTrigger
              value="change"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Change Management
            </TabsTrigger>
            <TabsTrigger
              value="claims"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Claims
            </TabsTrigger>
            <TabsTrigger
              value="rfi"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              RFI
            </TabsTrigger>
            <TabsTrigger
              value="ncr-log"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              NCR Log
            </TabsTrigger>
            <TabsTrigger
              value="approvers"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Approvers
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Vendor’s Reports
            </TabsTrigger>
            <TabsTrigger
              value="clause-library"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Clause Library
            </TabsTrigger>
            <TabsTrigger
              value="action-log"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Action Log
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <OverviewTab contract={contract} status={status} />

        <AnalyticsTabContent />

        <KpiTabContent />

        <ComplianceTabContent />

        <ChangeTabContent contractId={contract?._id ?? ""} />

        <ClaimsTabContent contractId={contract?._id ?? ""} />

        <ApproversTabContent contractId={contract?._id ?? ""} />

        <InvoiceTabContent contractId={contract?._id ?? ""} />

        <DeliverablesTabContent />

        <LemTabContent />

        <RfiTabContent contractId={contract?._id ?? ""} />

        <NcrLogTabContent contractId={contract?._id ?? ""} />

        <DocumentsTabContent files={contract?.files} />

        <AmendmentsTabContent contractId={contract?._id ?? ""} />

        <PaymentSummaryTabContent
          contractId={contract?._id ?? ""}
          contract={contract}
        />

        <ClauseLibraryTabContent />

        <VendorReportsTabContent />

        <ActionLogTabContent />
      </Tabs>
    </div>
  );
};

export default ContractDetailPage;
