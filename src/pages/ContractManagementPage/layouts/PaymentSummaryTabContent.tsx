import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentSummaryMilestonesTable from "../components/PaymentSummaryMilestonesTable";
import type { ColumnDef } from "@tanstack/react-table";

type HoldbackReleaseRow = {
  releaseId: string;
  releasedType: string;
  releasedAmount: string;
  status: "Approved" | "Pending";
  dueDate: string;
};

type SavingsRealizedRow = {
  savingsId: string;
  savingsTitle: string;
  category: string;
  amount: string;
  dateSubmitted: string;
};

const holdbackReleaseColumns: ColumnDef<HoldbackReleaseRow>[] = [
  {
    accessorKey: "releaseId",
    header: "Release ID",
    cell: ({ getValue }) => (
      <div className="w-[120px] py-4 text-sm font-semibold text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "releasedType",
    header: "Released Type",
    cell: ({ getValue }) => (
      <div className="w-[120px] py-4 text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "releasedAmount",
    header: () => <div className="w-[140px] text-center">Released Amount</div>,
    cell: ({ getValue }) => (
      <div className="w-[140px] py-4 text-center text-sm font-semibold text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: () => <div className="w-[120px] text-center">Status</div>,
    cell: ({ getValue }) => {
      const value = getValue<HoldbackReleaseRow["status"]>();
      const styles =
        value === "Approved"
          ? "bg-[#EAF7EE] text-[#16A34A]"
          : "bg-[#FEF9C3] text-[#CA8A04]";
      return (
        <div className="flex w-[120px] justify-center py-4">
          <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-semibold ${styles}`}>
            {value}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "dueDate",
    header: () => <div className="w-[120px] text-center">Due Date</div>,
    cell: ({ getValue }) => (
      <div className="w-[120px] py-4 text-center text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    id: "action",
    header: () => <div className="w-[80px] text-center">Action</div>,
    cell: () => (
      <div className="flex w-[80px] justify-center py-4">
        <button
          type="button"
          className="text-sm font-semibold text-[#16A34A] underline underline-offset-2"
        >
          View
        </button>
      </div>
    ),
  },
];

const holdbackReleaseRows: HoldbackReleaseRow[] = [
  {
    releaseId: "HB-2025-10",
    releasedType: "Partial",
    releasedAmount: "$2.5M",
    status: "Approved",
    dueDate: "12-65-2025",
  },
  {
    releaseId: "HB-2025-10",
    releasedType: "Full",
    releasedAmount: "$2.5M",
    status: "Pending",
    dueDate: "12-65-2025",
  },
];

const savingsRealizedColumns: ColumnDef<SavingsRealizedRow>[] = [
  {
    accessorKey: "savingsId",
    header: "Savings ID",
    cell: ({ getValue }) => (
      <div className="w-[120px] py-4 text-sm font-semibold text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "savingsTitle",
    header: "Savings Title",
    cell: ({ getValue }) => (
      <div className="w-[220px] py-4 text-sm font-medium leading-5 text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ getValue }) => (
      <div className="w-[190px] py-4 text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <div className="w-[120px] text-center">Amount</div>,
    cell: ({ getValue }) => (
      <div className="w-[120px] py-4 text-center text-sm font-semibold text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "dateSubmitted",
    header: () => <div className="w-[140px] text-center">Date Submitted</div>,
    cell: ({ getValue }) => (
      <div className="w-[140px] py-4 text-center text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    id: "action",
    header: () => <div className="w-[80px] text-center">Action</div>,
    cell: () => (
      <div className="flex w-[80px] justify-center py-4">
        <button
          type="button"
          className="text-sm font-semibold text-[#16A34A] underline underline-offset-2"
        >
          View
        </button>
      </div>
    ),
  },
];

const savingsRealizedRows: SavingsRealizedRow[] = [
  {
    savingsId: "SR-2025-10",
    savingsTitle: "Additional structural reinforcement",
    category: "Direct Negotiations",
    amount: "$2.5M",
    dateSubmitted: "12-65-2025",
  },
  {
    savingsId: "SR-2025-10",
    savingsTitle: "Additional structural reinforcement",
    category: "Indirect Savings",
    amount: "$2.5M",
    dateSubmitted: "12-65-2025",
  },
  {
    savingsId: "SR-2025-10",
    savingsTitle: "Additional structural reinforcement",
    category: "Cost Avoidance",
    amount: "$2.5M",
    dateSubmitted: "12-65-2025",
  },
  {
    savingsId: "SR-2025-10",
    savingsTitle: "Additional structural reinforcement",
    category: "Working Capital Optimization",
    amount: "$2.5M",
    dateSubmitted: "12-65-2025",
  },
];

const PaymentSummaryTabContent: React.FC = () => {
  return (
    <TabsContent value="payment-summary" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#0F0F0F]">Payment Summary</h3>
        
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] px-[15px] py-3 text-base font-semibold text-[#0F0F0F]"
          >
            <img
              src="/assets/contract-management/payment-summary/share.svg"
              className="h-5 w-5"
            />
            Export Report
          </button>

          <div className="inline-flex items-start gap-6">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] px-[15px] py-[14px] text-base font-semibold text-[#0F0F0F]"
            >
              Update Saving
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-[#2A4467] px-4 py-[15px] text-base font-semibold text-white"
            >
              Release Holdback
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-x-6 gap-y-6">
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">Contract Value</div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              $2,500,000
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">Contigency</div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              $1000
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">Holdback</div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              10%
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">Holdback Amount</div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              $250,000
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">
              Holdback Released
            </div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              $10M
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">Saving Realized</div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              $0
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">
              Payment Structure
            </div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              Milestone
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">Payment Term</div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              NET 30
            </div>
          </div>
          <div />
        </div>
      </div>

      <Tabs defaultValue="milestones" className="w-full bg-transparent space-y-8">
        <TabsList className="bg-[#F3F4F6] p-2 h-fit rounded-full w-fit">
          <TabsTrigger
            value="milestones"
            className="rounded-full px-6 py-1.5 text-base font-semibold text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            MileStones
          </TabsTrigger>
          <TabsTrigger
            value="holdback-release"
            className="rounded-full px-5 py-1.5 text-base font-semibold text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Holdback Release
          </TabsTrigger>
          <TabsTrigger
            value="saving-realized"
            className="rounded-full px-5 py-1.5 text-base font-semibold text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Saving Realized
          </TabsTrigger>
        </TabsList>

        <TabsContent value="milestones">
          <PaymentSummaryMilestonesTable />
        </TabsContent>
        <TabsContent value="holdback-release">
          <PaymentSummaryMilestonesTable
            title="Holdback Release"
            rows={holdbackReleaseRows}
            columns={holdbackReleaseColumns}
            getRowSearchValues={(row) => [
              row.releaseId,
              row.releasedType,
              row.releasedAmount,
              row.status,
              row.dueDate,
            ]}
          />
        </TabsContent>
        <TabsContent value="saving-realized">
          <PaymentSummaryMilestonesTable<SavingsRealizedRow>
            title="Savings"
            rows={savingsRealizedRows}
            columns={savingsRealizedColumns}
            getRowSearchValues={(row) => [
              row.savingsId,
              row.savingsTitle,
              row.category,
              row.amount,
              row.dateSubmitted,
            ]}
          />
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
};

export default PaymentSummaryTabContent;

