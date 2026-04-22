import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Search,
  Share2,
  X,
} from "lucide-react";
import { getRequest } from "@/lib/axiosInstance";
import { getFileIcon } from "@/lib/fileUtils";
import { useDebounceValue } from "usehooks-ts";
import { format } from "date-fns";
import type { VendorReportRow, ReportDetails } from "@/types";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import CreateVendorReportDialog from "../components/CreateVendorReportDialog";
import { CheckCircle } from "lucide-react";

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
  type: string;
  size: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2FF] text-xs font-semibold text-[#3B82F6]">
      {getFileIcon(type)}
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

const ReportDetailsSheet: React.FC<{
  reportId: string;
  basePath: string;
  contractId: string;
  trigger: React.ReactNode;
}> = ({ reportId, basePath, contractId, trigger }) => {
  const [open, setOpen] = useState(false);

  const {
    data: reportDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["report-details", reportId, basePath],
    queryFn: async () => {
      const response = await getRequest({
        url: `${basePath}/reports/${reportId}`,
      });
      return response.data?.data as ReportDetails;
    },
    enabled: !!reportId && !!contractId && open,
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
                  className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  Overview
                </TabsTrigger>
                {/* <TabsTrigger
                  value="comments"
                  className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  Comments
                </TabsTrigger> */}
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-500">Loading report details...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-500">
                      Error loading report details. Please try again.
                    </p>
                  </div>
                ) : reportDetails ? (
                  <>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <LabelRow
                        label="Report Title"
                        value={reportDetails.title}
                      />
                      <LabelRow
                        label="Submitted by"
                        value={
                          <a className="text-[#2563EB] underline">
                            {reportDetails.submittedBy?.name || "Unknown"}
                          </a>
                        }
                      />
                      <LabelRow
                        label="Report ID"
                        value={reportDetails.reportId}
                      />
                      <LabelRow
                        label="Submission Date"
                        value={
                          reportDetails.submissionDate
                            ? format(
                                new Date(reportDetails.submissionDate),
                                "dd MMM yyyy",
                              )
                            : "N/A"
                        }
                      />
                      <LabelRow
                        label="Response Deadline"
                        value={
                          reportDetails.responseDeadline
                            ? format(
                                new Date(reportDetails.responseDeadline),
                                "dd MMM yyyy",
                              )
                            : "N/A"
                        }
                      />
                      <LabelRow
                        label="Status"
                        value={
                          <span className="inline-flex rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#16A34A]">
                            {reportDetails.status}
                          </span>
                        }
                      />
                    </div>

                    {reportDetails.description && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-[#9CA3AF]">
                          Description
                        </div>
                        <div className="text-sm text-[#374151]">
                          {reportDetails.description}
                        </div>
                      </div>
                    )}

                    {reportDetails.files && reportDetails.files.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-base font-semibold text-[#0F0F0F]">
                          Attached Documents
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {reportDetails.files.map((file, index) => (
                            <DocCard
                              key={index}
                              name={file.name}
                              type={file.type}
                              size={`${(file.size / 1024).toFixed(0)}KB`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No report details available.
                    </p>
                  </div>
                )}
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

export interface ReportItem {
  _id: string;
  contractRef: string;
  contractRefModel: string;
  company: string;
  reportId: string;
  title: string;
  submittedBy: {
    name: string;
    email: string;
    id: string;
  };
  description: string;
  files: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

function VendorReportsTabContent({
  contractId,
  isActive,
}: {
  contractId: string;
  isActive?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounceValue(searchQuery, 300);
  const { isVendor, isApprover, isManager, isAdmin, isViewOnly } =
    useUserRole();
  const [openCreate, setOpenCreate] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);

  const getBasePath = () => {
    if (isVendor) return `/contract/vendor/contracts/${contractId}`;
    if (isApprover) return `/contract/approver/contracts/${contractId}`;
    if (isManager) return `/contract/manager/contracts/${contractId}`;
    if (isAdmin || isViewOnly) return `/contract/user/contracts/${contractId}`;
    return `/contract/user/contracts/${contractId}`; // Default fallback
  };

  const basePath = getBasePath();

  // Fetch vendor reports
  const {
    data: reportsData,
    isLoading: reportsLoading,
    error: reportsError,
  } = useQuery({
    queryKey: ["vendor-reports", contractId, debouncedSearchQuery, basePath],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append("title", debouncedSearchQuery);

      const response = await getRequest({
        url: `${basePath}/reports?${params.toString()}`,
      });
      return (
        (response.data?.data?.reports as ReportItem[]) || ([] as ReportItem[])
      );
    },
    enabled: !!contractId && !!isActive,
  });

  // Fetch reports stats
  const { data: reportsStats, isLoading: statsLoading } = useQuery({
    queryKey: ["vendor-reports-stats", contractId, basePath],
    queryFn: async () => {
      const response = await getRequest({
        url: `${basePath}/reports/stats`,
      });
      return response.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60_000,
  });

  const rows: VendorReportRow[] =
    reportsData?.map((report) => ({
      _id: report._id,
      reportId: report.reportId,
      title: report.title,
      submittedBy: report.submittedBy?.name || "Unknown",
      submissionDate: report.createdAt
        ? format(report.createdAt, "dd MMM yyyy")
        : "",
      status: "Unknown",
      description: report.description,
      files: report.files || [],
    })) || [];

  const columns: ColumnDef<VendorReportRow>[] = [
    { accessorKey: "reportId", header: "Report ID" },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "submittedBy", header: "Submitted By" },
    { accessorKey: "submissionDate", header: "Submission Date" },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ReportDetailsSheet
            reportId={row.original._id}
            basePath={basePath}
            contractId={contractId}
            trigger={
              <Button variant="link" size="sm">
                view
              </Button>
            }
          />
        </div>
      ),
    },
  ];

  return (
    <TabsContent value="reports" className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Vendor’s Reports
        </h2>
        {isVendor && (
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="h-10 rounded-xl bg-[#2A4467] text-white">
                Create Report
              </Button>
            </DialogTrigger>
            <CreateVendorReportDialog
              contractId={contractId}
              onSuccess={() => {
                setOpenCreate(false);
                setOpenSuccess(true);
              }}
            />
          </Dialog>
        )}
      </div>

      <Card className="w-[320px] rounded-xl border border-slate-200 bg-white p-5 shadow-none">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-xs text-slate-500">All Report</div>
            <div className="text-lg font-semibold text-slate-900">
              {statsLoading ? "—" : (reportsStats?.total ?? rows.length)}
            </div>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="p-0">
          {reportsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading reports...</p>
              </div>
            </div>
          ) : reportsError ? (
            <div className="text-center py-8">
              <p className="text-red-500">
                Error loading reports. Please try again.
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No reports found.</p>
            </div>
          ) : (
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
          )}
        </div>
      </Card>

      <Dialog open={openSuccess} onOpenChange={setOpenSuccess}>
        <DialogContent
          className="sm:max-w-[420px] rounded-2xl p-6"
          showCloseButton={false}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFDF5]">
              <CheckCircle className="h-8 w-8 text-[#16A34A]" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[#0F0F0F]">
                Report Created Successfully
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2 grid w-full grid-cols-2 gap-3">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-[#E5E7EB] bg-[#F3F4F6] text-slate-900"
                >
                  Close
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button className="h-11 rounded-xl bg-[#2A4467] text-white">
                  Done
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}

export default VendorReportsTabContent;
