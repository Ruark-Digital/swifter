import React from "react";
import { SEOWrapper } from "@/components/SEO";
import { Button } from "@/components/ui/button";
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

const ContractDetailPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <SEOWrapper
        title="Contract Details - SwiftPro eProcurement Portal"
        description="View contract overview, team, and key information."
        canonical="/dashboard/contract-management/:id"
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
            <BreadcrumbPage>Construction Services Agreement</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">
            Construction Services Agreement
          </h1>
          <p className="text-sm text-slate-500">CON-2025-10</p>
          <Button variant="secondary" className="mt-4">
            Approval Settings
          </Button>
        </div>
        <Badge className="bg-green-100 text-green-700">Active</Badge>
      </div>

      <div className="flex w-fit items-center gap-1 rounded-full bg-[#F2F4F7] p-1">
        <button
          type="button"
          className="rounded-full bg-[#2A4467] px-4 py-2 text-sm font-medium text-white"
        >
          MSA Details
        </button>
        <button
          type="button"
          className="rounded-full px-4 py-2 text-sm font-medium text-[#6B6B6B]"
        >
          Linked Contract
        </button>
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

        <OverviewTab />

        <AnalyticsTabContent />

        <KpiTabContent />

        <ComplianceTabContent />

        <ChangeTabContent />

        <ClaimsTabContent />

        <ApproversTabContent />

        <InvoiceTabContent />

        <DeliverablesTabContent />

        <LemTabContent />

        <RfiTabContent />

        <NcrLogTabContent />

        <DocumentsTabContent />

        <AmendmentsTabContent />

        <PaymentSummaryTabContent />

        <ClauseLibraryTabContent />

        <VendorReportsTabContent />

        <ActionLogTabContent />
      </Tabs>
    </div>
  );
};

export default ContractDetailPage;
