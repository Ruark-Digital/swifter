import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText, Search } from "lucide-react";

type VendorReportRow = {
  reportId: string;
  title: string;
  submittedBy: string;
  submissionDate: string;
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
          <button
            type="button"
            className="font-medium text-green-600 hover:underline"
          >
            View
          </button>
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

