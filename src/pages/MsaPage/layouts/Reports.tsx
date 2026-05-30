import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/layouts/DataTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, FileText, Search, X } from "lucide-react";
import CreateVendorReportDialog from "@/pages/ContractManagementPage/components/CreateVendorReportDialog";
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useToastHandler } from "@/hooks/useToaster";
import type { ApiResponseError } from "@/types";
import { formatDateTZ } from "@/lib/utils";

type Props = {
  contractId: string;
  isActive?: boolean;
};

type ReportRow = {
  id: string;
  reportId: string;
  title: string;
  submittedBy: string;
  submissionDate: string;
};

type ReportDetails = {
  _id?: string;
  reportId?: string;
  title?: string;
  description?: string;
  submittedBy?: { name?: string; email?: string } | string;
  submissionDate?: string;
  createdAt?: string;
  files?: Array<{ name?: string; type?: string; url?: string; size?: number | string }>;
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

const ReportDetailsSheet = ({
  trigger,
  reportId,
  basePath,
}: {
  trigger: React.ReactNode;
  reportId: string;
  basePath: string;
}) => {
  const [open, setOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["msa-report-detail", basePath, reportId],
    queryFn: async () => {
      const res = await getRequest({ url: `${basePath}/${reportId}` });
      return res.data as { data?: ReportDetails };
    },
    enabled: open && Boolean(reportId),
    staleTime: 60000,
    retry: false,
  });

  const detail = (data as any)?.data?.data ?? (data as any)?.data;
  const submitter =
    typeof detail?.submittedBy === "string"
      ? detail.submittedBy
      : detail?.submittedBy?.name || "Unknown";
  const submitterEmail =
    typeof detail?.submittedBy === "string" ? "" : detail?.submittedBy?.email || "";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[560px] rounded-2xl overflow-y-auto [&>button]:hidden"
      >
        <div className="space-y-6">
          <SheetHeader className="space-y-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <SheetTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
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
            <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
              {isLoading ? "Loading..." : detail?.title || "-"}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <LabelRow label="Report ID" value={isLoading ? "Loading..." : detail?.reportId || "-"} />
              <LabelRow
                label="Submission Date"
                value={
                  isLoading
                    ? "Loading..."
                    : formatDateTZ(detail?.submissionDate || detail?.createdAt, "MMMM dd, yyyy")
                }
              />
              <LabelRow
                label="Submitted by"
                value={isLoading ? "Loading..." : submitter}
              />
              <LabelRow
                label="Contact"
                value={
                  submitterEmail ? (
                    <a href={`mailto:${submitterEmail}`} className="text-[#2563EB] underline">
                      {submitterEmail}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF]">Description</div>
              <div className="text-sm text-[#374151] dark:text-slate-200">{detail?.description || "-"}</div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Reports: React.FC<Props> = ({ contractId, isActive }) => {
  const { isApprover, isVendor, isProjectManager, isManager, isAdmin, isViewOnly } =
    useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<{ stats?: unknown; list?: unknown }>({});
  const [search, setSearch] = React.useState("");

  const basePath = React.useMemo(() => {
    if (isVendor || isProjectManager)
      return `/contract/vendor/contracts/${contractId}/reports`;
    if (isApprover) return `/contract/approver/contracts/${contractId}/reports`;
    if (isManager) return `/contract/manager/contracts/${contractId}/reports`;
    if (isAdmin || isViewOnly) return `/contract/user/contracts/${contractId}/reports`;
    return `/contract/user/contracts/${contractId}/reports`;
  }, [
    contractId,
    isAdmin,
    isApprover,
    isManager,
    isVendor,
    isProjectManager,
    isViewOnly,
  ]);

  const listQueryKey = useUserQueryKey(["msa-reports", contractId, basePath, search]);
  const statsQueryKey = useUserQueryKey(["msa-reports-stats", contractId, basePath]);

  const { data: reportsRes, isLoading: reportsLoading, error: listError } = useQuery({
    queryKey: listQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search.trim()) params.append("title", search.trim());
      params.append("page", "1");
      params.append("limit", "200");
      const response = await getRequest({
        url: `${basePath}?${params.toString()}`,
      });
      return response.data as { data?: { reports?: any[]; total?: number } };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const { data: statsRes, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: statsQueryKey,
    queryFn: async () => {
      const response = await getRequest({ url: `${basePath}/stats` });
      return response.data as { data?: { total?: number } };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  React.useEffect(() => {
    toastErrorRef.current = toastHandler.error;
  }, [toastHandler.error]);

  React.useEffect(() => {
    if (!listError) return;
    if (lastErrorRef.current.list === listError) return;
    lastErrorRef.current.list = listError;
    toastErrorRef.current("MSA Reports", listError as ApiResponseError);
  }, [listError]);

  React.useEffect(() => {
    if (!statsError) return;
    if (lastErrorRef.current.stats === statsError) return;
    lastErrorRef.current.stats = statsError;
    toastErrorRef.current("MSA Reports Stats", statsError as ApiResponseError);
  }, [statsError]);

  const rows = React.useMemo<ReportRow[]>(() => {
    const payload = (reportsRes as any)?.data;
    const reports = Array.isArray(payload?.data?.reports)
      ? payload.data.reports
      : Array.isArray(payload?.reports)
        ? payload.reports
        : [];
    return reports.map((report: any) => ({
      id: report?._id || report?.reportId || "",
      reportId: report?.reportId || report?._id || "-",
      title: report?.title || "-",
      submittedBy:
        typeof report?.submittedBy === "string"
          ? report.submittedBy
          : report?.submittedBy?.name || "Unknown",
      submissionDate: report?.createdAt
        ? formatDateTZ(report.createdAt, "dd-MM-yyyy")
        : report?.submissionDate
          ? formatDateTZ(report.submissionDate, "dd-MM-yyyy")
          : "-",
    }));
  }, [reportsRes]);

  const allCount = React.useMemo(() => {
    const statsPayload = (statsRes as any)?.data;
    const stats = statsPayload?.data ?? statsPayload;
    if (typeof stats?.total === "number") return stats.total;
    const listPayload = (reportsRes as any)?.data;
    const listData = listPayload?.data ?? listPayload;
    if (typeof listData?.total === "number") return listData.total;
    return rows.length;
  }, [reportsRes, rows.length, statsRes]);

  const columns = React.useMemo<ColumnDef<ReportRow>[]>(
    () => [
      { accessorKey: "reportId", header: "Report ID" },
      { accessorKey: "title", header: "Title" },
      { accessorKey: "submittedBy", header: "Submitted By" },
      { accessorKey: "submissionDate", header: "Submission Date" },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <ReportDetailsSheet
              reportId={row.original.id}
              basePath={basePath}
              trigger={
                <Button
                  variant="link"
                  className="h-auto p-0 font-semibold text-[#43A047] hover:no-underline"
                >
                  View
                </Button>
              }
            />
          </div>
        ),
      },
    ],
    [basePath],
  );

  const isVendorLike = isVendor || isProjectManager;
  const [openCreate, setOpenCreate] = React.useState(false);

  return (
    <TabsContent value="reports" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-[#0F0F0F] dark:text-slate-100">
          Vendor’s Reports
        </h3>
        {isVendorLike ? (
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="h-10 rounded-xl bg-[#2A4467] text-white">
                Create Report
              </Button>
            </DialogTrigger>
            <CreateVendorReportDialog
              contractId={contractId}
              invalidateQueryKey={listQueryKey}
              onSuccess={() => setOpenCreate(false)}
            />
          </Dialog>
        ) : null}
      </div>

      <Card className="w-[320px] rounded-xl border border-[#E5E7EB] dark:border-slate-800 dark:bg-slate-900 shadow-none">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-sm text-[#6B6B6B] dark:text-slate-400">All Report</div>
            <div className="text-2xl font-semibold leading-8 text-[#0F0F0F] dark:text-slate-100">
              {statsLoading ? "—" : allCount}
            </div>
          </div>
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-900/60 flex items-center justify-center">
              <FileText className="h-4 w-4 text-slate-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable<ReportRow>
        data={rows}
        columns={columns}
        options={{
          disableSelection: true,
          disablePagination: true,
          isLoading: reportsLoading,
        }}
        header={() => (
          <div className="flex items-center gap-4 border-b border-[#E9E9EB] w-full dark:border-slate-800 px-6 py-4">
            <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">Reports</div>
            <div className="relative w-[320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#6B6B6B] dark:text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search changes"
                className="h-12 rounded-lg border border-[#E5E7EB] dark:border-slate-700 dark:bg-slate-900 pl-9 text-sm text-[#0F0F0F] dark:text-slate-100 placeholder:text-[#6B6B6B] dark:placeholder:text-slate-500 dark:text-slate-400"
              />
            </div>
          </div>
        )}
        classNames={{
          container: "overflow-hidden rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900",
          table: "border-spacing-y-0",
          tHeader: "bg-[#F9FAFB] dark:bg-slate-800",
          tHeadRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tBody: "bg-white dark:bg-slate-900",
          tRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tHead: "px-6 py-3 text-sm font-semibold text-[#2A4467] dark:text-indigo-300",
          tCell: "px-6 py-4 text-sm text-[#2A4467] align-top",
        }}
        emptyPlaceholder={
          <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">No reports found.</div>
        }
      />
    </TabsContent>
  );
};

export default Reports;
