import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/layouts/DataTable";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Download, Eye, FileText, Search, Share2, X } from "lucide-react";

type VendorReportRow = {
  reportId: string;
  title: string;
  submittedBy: string;
  submissionDate: string;
};

type ReportDetailsSheetProps = {
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

const DocCard = ({
  name,
  type,
  size,
}: {
  name: string;
  type: "DOC" | "PDF";
  size: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2FF] text-xs font-semibold text-[#3B82F6]">
      {type}
    </div>
    <div className="flex-1">
      <div className="text-sm font-medium text-[#111827]">{name}</div>
      <div className="text-xs text-[#9CA3AF]">
        {type} • {size}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280]"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6F0FF] text-[#2563EB]"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const ReportDetailsSheet: React.FC<ReportDetailsSheetProps> = ({ trigger }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl rounded-2xl overflow-y-auto [&>button]:hidden"
      >
        <div className="space-y-6" data-testid="report-details-sheet">
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
                  Report Details
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
                Additional structural reinforcement
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
              >
                <Share2 className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-[#E5E7EB] bg-transparent p-0">
                <TabsTrigger
                  value="overview"
                  className="rounded-none border-b-2 border-transparent px-0 pb-2 text-xs font-semibold text-[#6B7280] data-[state=active]:border-[#2A4467] data-[state=active]:text-[#2A4467]"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="rounded-none border-b-2 border-transparent px-0 pb-2 text-xs font-semibold text-[#6B7280] data-[state=active]:border-[#2A4467] data-[state=active]:text-[#2A4467]"
                >
                  Comments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <LabelRow
                    label="NCR Title"
                    value="Additional structural reinforcement"
                  />
                  <LabelRow
                    label="Submitted by"
                    value={
                      <a className="text-[#2563EB] underline">
                        Olamide Oladehinde
                      </a>
                    }
                  />
                  <LabelRow label="NCR ID" value="NCI-2025-10" />
                  <LabelRow label="Submission Date" value="April 30, 2025" />
                  <LabelRow label="Response Deadline" value="April 30, 2025" />
                  <LabelRow
                    label="Status"
                    value={
                      <span className="inline-flex rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#16A34A]">
                        Open
                      </span>
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#9CA3AF]">
                    Description
                  </div>
                  <div className="text-sm text-[#374151]">
                    Lorem ipsum dolor sit amet consectetur. Volutpat quis egestas
                    nunc egestas ut sed accumsan commodo vitae. Ullamcorper
                    feugiat pulvinar consectetur vel natoque amet enim ac sed.
                    Laoreet fringilla sollicitudin pharetra sit proin dictum. Sit
                    sed lorem mauris.
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-base font-semibold text-[#0F0F0F]">
                    Attached Documents
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DocCard name="RFP_HRSoftware" type="DOC" size="25KB" />
                    <DocCard name="RFP_HRSoftware" type="PDF" size="1MB" />
                    <DocCard name="RFP_HRSoftware" type="DOC" size="25KB" />
                    <DocCard name="RFP_HRSoftware" type="PDF" size="1MB" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                <div className="rounded-xl border border-[#E5E7EB] p-4 text-sm text-[#6B7280]">
                  No comments available.
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const VendorReportsTabContent: React.FC = () => {
  const rows: VendorReportRow[] = [
    {
      reportId: "RPT-2025-10",
      title: "Progress Draw",
      submittedBy: "Olamide Oladehinde",
      submissionDate: "12-02-2026",
    },
    {
      reportId: "RPT-2025-10",
      title: "Progress Draw",
      submittedBy: "Olamide Oladehinde",
      submissionDate: "12-02-2026",
    },
    {
      reportId: "RPT-2025-10",
      title: "Progress Draw",
      submittedBy: "Olamide Oladehinde",
      submissionDate: "12-02-2026",
    },
    {
      reportId: "RPT-2025-10",
      title: "Progress Draw",
      submittedBy: "Olamide Oladehinde",
      submissionDate: "12-02-2026",
    },
    {
      reportId: "RPT-2025-10",
      title: "Progress Draw",
      submittedBy: "Olamide Oladehinde",
      submissionDate: "12-02-2026",
    },
  ];

  const columns: ColumnDef<VendorReportRow>[] = [
    { accessorKey: "reportId", header: "Report ID" },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "submittedBy", header: "Submitted By" },
    { accessorKey: "submissionDate", header: "Submission Date" },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: () => (
        <div className="text-right">
          <ReportDetailsSheet
            trigger={
              <button
                type="button"
                className="font-medium text-green-600 hover:underline"
              >
                View
              </button>
            }
          />
        </div>
      ),
    },
  ];

  return (
    <TabsContent value="reports" className="space-y-8">
      <h2 className="text-lg font-semibold text-slate-900">Vendor’s Reports</h2>

      <Card className="w-[320px] rounded-xl border border-slate-200 bg-white p-5 shadow-none">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-xs text-slate-500">All Report</div>
            <div className="text-lg font-semibold text-slate-900">8</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <FileText className="h-5 w-5 text-slate-700" />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-xl">
        <div className="flex items-center gap-6 border-b border-slate-200 px-6 py-4">
          <div className="text-sm font-medium text-slate-900">Reports</div>

          <div className="relative w-full max-w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search changes"
              className="h-10 pl-9 text-sm placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="p-0">
          <DataTable<VendorReportRow>
            data={rows}
            columns={columns}
            classNames={{
              container: "[&>div:last-child]:hidden",
              table: "border-collapse border-spacing-0",
              tHeader: "bg-transparent",
              tHeadRow: "bg-white",
              tHead: "text-[#2A4467] font-medium",
              tCell: "p-4 text-slate-700",
            }}
            options={{
              disablePagination: true,
              disableSelection: true,
              isLoading: false,
              totalCounts: rows.length,
            }}
          />
        </div>
      </Card>
    </TabsContent>
  );
};

export default VendorReportsTabContent;

