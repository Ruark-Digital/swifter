import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ArrowLeft, Share2, X } from "lucide-react";
export type ApproverRow = {
  name: string;
  email: string;
  role: string;
  approvalLevel: string;
  assignedApprovals: string;
  status: "Completed" | "Pending";
};

type ApproverDetailsSheetProps = {
  trigger: React.ReactNode;
};

const LabelRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="text-xs font-medium text-[#9CA3AF]">{label}</div>
    <div className="text-sm font-medium text-[#111827]">{value}</div>
  </div>
);

const ApproverDetailsSheet: React.FC<ApproverDetailsSheetProps> = ({
  trigger,
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[560px] rounded-2xl overflow-y-auto [&>button]:hidden"
      >
        <div className="space-y-6" data-testid="approver-details-sheet">
          <SheetHeader className="space-y-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <SheetTitle className="text-base font-semibold text-[#0F0F0F]">
                  Approval Scorecard
                </SheetTitle>
              </div>
              <SheetClose asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FCA5A5] text-[#EF4444]"
                >
                  <X className="h-4 w-4" />
                </button>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="text-base font-semibold text-[#0F0F0F]">
                Approver Details
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
              >
                <Share2 className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <LabelRow label="Approval Name" value="EliseJohn" />
              <LabelRow
                label="Contact"
                value={<a className="text-[#2563EB] underline">Mike@acme.com</a>}
              />
              <LabelRow label="Submission Date" value="April 30, 2025" />
              <LabelRow label="Assigned Approval" value="2/2" />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF]">Status</div>
              <div className="inline-flex rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-semibold text-[#2563EB]">
                Completed
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-base font-semibold text-[#0F0F0F]">
                Approval Status
              </div>
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem
                  value="project"
                  className="rounded-xl border border-[#E5E7EB] px-4"
                >
                  <AccordionTrigger className="py-4 text-sm font-semibold text-[#0F0F0F] hover:no-underline">
                    Project
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <LabelRow label="Status" value="Approved" />
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-[#9CA3AF]">
                        Comments
                      </div>
                      <div className="text-sm text-[#374151]">
                        “Lorem ipsum dolor sit amet consectetur. Volutpat quis
                        egestas nunc egestas ut sed accumsan commodo vitae.
                        Ullamcorper feugiat pulvinar consectetur vel natoque
                        amet enim ac sed. Laoreet fringilla sollicitudin
                        pharetra sit proin dictum. Sit sed lorem mauris.”
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-medium text-[#2563EB] underline"
                    >
                      View Details
                    </button>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="change"
                  className="rounded-xl border border-[#E5E7EB] px-4"
                >
                  <AccordionTrigger className="py-4 text-sm font-semibold text-[#0F0F0F] hover:no-underline">
                    Change
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <LabelRow label="Status" value="Approved" />
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-[#9CA3AF]">
                        Comments
                      </div>
                      <div className="text-sm text-[#374151]">
                        “Lorem ipsum dolor sit amet consectetur. Volutpat quis
                        egestas nunc egestas ut sed accumsan commodo vitae.
                        Ullamcorper feugiat pulvinar consectetur vel natoque
                        amet enim ac sed. Laoreet fringilla sollicitudin
                        pharetra sit proin dictum. Sit sed lorem mauris.”
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-medium text-[#2563EB] underline"
                    >
                      View Details
                    </button>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="claim"
                  className="rounded-xl border border-[#E5E7EB] px-4"
                >
                  <AccordionTrigger className="py-4 text-sm font-semibold text-[#0F0F0F] hover:no-underline">
                    Claim
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <LabelRow label="Status" value="Rejected" />
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-[#9CA3AF]">
                        Comments
                      </div>
                      <div className="text-sm text-[#374151]">
                        “Lorem ipsum dolor sit amet consectetur. Volutpat quis
                        egestas nunc egestas ut sed accumsan commodo vitae.
                        Ullamcorper feugiat pulvinar consectetur vel natoque
                        amet enim ac sed. Laoreet fringilla sollicitudin
                        pharetra sit proin dictum. Sit sed lorem mauris.”
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-medium text-[#2563EB] underline"
                    >
                      View Details
                    </button>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const columns: ColumnDef<ApproverRow>[] = [
  {
    accessorKey: "name",
    header: "Approver Name",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-900">
          {row.original.name}
        </p>
        <a href="#" className="text-xs text-blue-600 underline">
          {row.original.email}
        </a>
      </div>
    ),
  },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "approvalLevel", header: "Approval Level" },
  { accessorKey: "assignedApprovals", header: "Assigned Approvals" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue<ApproverRow["status"]>();
      const tone =
        s === "Completed"
          ? "bg-blue-100 text-blue-700"
          : "bg-yellow-100 text-yellow-700";
      return (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone}`}
        >
          {s}
        </span>
      );
    },
  },
  {
    id: "view",
    header: "Status",
    cell: () => (
      <ApproverDetailsSheet
        trigger={
          <button
            type="button"
            className="text-sm font-medium text-green-700 hover:underline"
          >
            View
          </button>
        }
      />
    ),
  },
];

const sampleRows: ApproverRow[] = [
  {
    name: "Elise Johnson",
    email: "Mike@acme.com",
    role: "Engineer",
    approvalLevel: "5",
    assignedApprovals: "2/2",
    status: "Completed",
  },
  {
    name: "Elise Johnson",
    email: "Mike@acme.com",
    role: "Legal",
    approvalLevel: "4",
    assignedApprovals: "0/2",
    status: "Pending",
  },
  {
    name: "Elise Johnson",
    email: "Mike@acme.com",
    role: "Legal",
    approvalLevel: "4",
    assignedApprovals: "0/2",
    status: "Pending",
  },
  {
    name: "Elise Johnson",
    email: "Mike@acme.com",
    role: "Project Manager",
    approvalLevel: "3",
    assignedApprovals: "1/2",
    status: "Completed",
  },
  {
    name: "Elise Johnson",
    email: "Mike@acme.com",
    role: "Finance",
    approvalLevel: "2",
    assignedApprovals: "0/2",
    status: "Pending",
  },
  {
    name: "Elise Johnson",
    email: "Mike@acme.com",
    role: "Finance",
    approvalLevel: "1",
    assignedApprovals: "0/2",
    status: "Pending",
  },
];

const ApproversTable: React.FC = () => {
  return (
    <div className="space-y-4">
      <DataTable<ApproverRow>
        data={sampleRows}
        columns={columns}
        header={() => (
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
            <span className="text-sm font-medium text-slate-900">
              Approvers
            </span>
          </div>
        )}
        options={{
          disableSelection: true,
          disablePagination: true,
          manualPagination: false,
          totalCounts: sampleRows.length,
          setPagination: () => {},
          pagination: { pageIndex: 0, pageSize: 10 },
        }}
        classNames={{
          container: "border border-[#E5E7EB] rounded-xl bg-white",
          tHeader: "bg-[#F9FAFB]",
          tHeadRow: "border-b border-[#E5E7EB]",
          tBody: "bg-white",
          tRow: "border-b border-[#E5E7EB]",
          tHead: "px-6 py-3 text-xs font-semibold text-slate-500",
          tCell: "px-6 py-4 text-sm text-slate-700 align-top",
        }}
      />
    </div>
  );
};

export default ApproversTable;
