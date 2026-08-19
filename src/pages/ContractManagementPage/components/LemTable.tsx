import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { getRequest } from "@/lib/axiosInstance";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { TextArea } from "@/components/layouts/FormInputs";
import { postRequest } from "@/lib/axiosInstance";
import { getFileIcon } from "@/lib/fileUtils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, X } from "lucide-react";
import { useToastHandler } from "@/hooks/useToaster";
import { ApiResponse, ApiResponseError } from "@/types";
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@/store/authSlice";
import { formatDate } from "date-fns";
import { DocumentItem, type DocType } from "./DocumentItem";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import { getFileExtension } from "@/lib/fileUtils";
import { cn, formatCurrency, formatDateTZ, resolveCurrency } from "@/lib/utils";
import SubmitLemDialog from "./SubmitLemDialog";
import MessageComposer from "@/pages/SolicitationManagementPage/components/MessageComposer";
import type {
  ContractCommentDTO,
  ContractChangeCommentDTO,
} from "../api/contractManagerApi";

const formatDateValue = (value: unknown) => {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value as any);
  if (Number.isNaN(d.getTime())) return "—";
  return formatDate(d, "yyyy-MMM-dd");
};

const getLemStatusColor = (status?: string) => {
  const lower = (status ?? "").toLowerCase();
  if (lower === "approved")
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  if (lower === "rejected")
    return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300";
  if (lower === "pending" || lower === "pending approval")
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  return "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
};

export type LemRow = {
  id: string;
  title: string;
  amount: string;
  submissionDate: string;
  status: string;
};

export interface LemDetailsSheetProps {
  trigger?: React.ReactNode;
  contractId: string;
  lemId: string;
  basePath: string;
  /** Contract-level currency; falls back to USD when the API omits it. */
  currency?: string;
}

const LabelRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">{label}</div>
    <div className="text-sm font-medium text-[#111827] dark:text-slate-100">{value}</div>
  </div>
);

type LemSummarySheet = {
  sheetName?: string;
  headers?: string[];
  rows?: Array<Record<string, unknown>>;
};
type LemSummary = {
  files?: Array<{ name?: string; sheets?: LemSummarySheet[] }>;
  comparison?: {
    total?: number | null;
    rateSheetTotal?: number | null;
    totalVariance?: number | null;
    complianceStatus?: string | null;
  };
};

const complianceBadgeColor = (status?: string | null) => {
  const s = (status ?? "").toLowerCase();
  if (s === "fully compliant")
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  if (s === "non-compliant")
    return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300";
  return "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300";
};

// Excel headers arrive with embedded CR/LF; collapse to a single line for th display.
const cleanHeader = (h: string) => h.replace(/\r?\n/g, " ").trim();

const SummaryTotalRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center justify-between px-4 py-3">
    <span className="text-sm text-[#6B7280] dark:text-slate-400">{label}</span>
    <span className="text-sm font-semibold text-[#111827] dark:text-slate-100">
      {value}
    </span>
  </div>
);

/**
 * Renders the BE-supplied LEM `summary`: one tab per parsed spreadsheet sheet
 * (dynamic columns keyed by the sheet's own headers) plus the rate-sheet
 * comparison totals. The design's normalized per-row comparison columns
 * (Avg Rate / Man Hour / Fee / Rate Sheet Price / Variance / Match) are not in
 * the payload — rows are raw cells and `comparison` carries only totals.
 */
const LemSummaryContent: React.FC<{
  summary?: LemSummary;
  currencyCode: string;
}> = ({ summary, currencyCode }) => {
  const sheets = React.useMemo(
    () =>
      (summary?.files ?? []).flatMap((f) =>
        (f.sheets ?? []).map((s) => ({ ...s })),
      ),
    [summary],
  );
  const comparison = summary?.comparison;

  const money = (v?: number | null) =>
    typeof v === "number" ? formatCurrency(v, "en-US", currencyCode) : "—";

  if (!sheets.length && !comparison) {
    return (
      <div className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 p-4 text-sm text-[#6B7280] dark:text-slate-400">
        No summary available.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {sheets.length > 0 && (
        <Tabs
          defaultValue={sheets[0]?.sheetName ?? "sheet-0"}
          className="space-y-3"
        >
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            {sheets.map((s, i) => (
              <TabsTrigger
                key={`${s.sheetName ?? "sheet"}-${i}`}
                value={s.sheetName ?? `sheet-${i}`}
                className="flex-none rounded-full border border-[#E5E7EB] px-3 py-1.5 text-xs font-semibold text-[#667085] dark:border-slate-700 dark:text-slate-400 data-[state=active]:border-[#1F3B63] data-[state=active]:bg-[#1F3B63] data-[state=active]:text-white"
              >
                {s.sheetName ?? `Sheet ${i + 1}`}
              </TabsTrigger>
            ))}
          </TabsList>

          {sheets.map((s, i) => {
            const headers = (s.headers ?? []).filter(Boolean);
            const rows = s.rows ?? [];
            return (
              <TabsContent
                key={`${s.sheetName ?? "sheet"}-${i}-content`}
                value={s.sheetName ?? `sheet-${i}`}
              >
                <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] dark:border-slate-800">
                  <table className="w-full min-w-max text-sm">
                    <thead className="bg-[#F9FAFB] dark:bg-slate-800">
                      <tr className="border-b border-[#E5E7EB] dark:border-slate-800">
                        {headers.map((h, hi) => (
                          <th
                            key={`${h}-${hi}`}
                            className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400"
                          >
                            {cleanHeader(h)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length ? (
                        rows.map((row, ri) => (
                          <tr
                            key={ri}
                            className="border-b border-[#E5E7EB] last:border-0 dark:border-slate-800"
                          >
                            {headers.map((h, hi) => {
                              const cell = row?.[h];
                              return (
                                <td
                                  key={`${ri}-${hi}`}
                                  className="whitespace-pre-line px-4 py-3 align-top text-slate-700 dark:text-slate-200"
                                >
                                  {cell === undefined ||
                                  cell === null ||
                                  cell === ""
                                    ? "—"
                                    : String(cell)}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={Math.max(headers.length, 1)}
                            className="px-4 py-6 text-center text-sm text-[#6B7280] dark:text-slate-400"
                          >
                            No rows.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {comparison && (
        <div className="divide-y divide-[#E5E7EB] rounded-xl border border-[#E5E7EB] dark:divide-slate-800 dark:border-slate-800">
          <SummaryTotalRow label="Total" value={money(comparison.total)} />
          <SummaryTotalRow
            label="Rate Sheet Total"
            value={money(comparison.rateSheetTotal)}
          />
          <SummaryTotalRow
            label="Total Variance"
            value={money(comparison.totalVariance)}
          />
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#6B7280] dark:text-slate-400">
              Compliance Status
            </span>
            {comparison.complianceStatus ? (
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                  complianceBadgeColor(comparison.complianceStatus),
                )}
              >
                {comparison.complianceStatus}
              </span>
            ) : (
              <span className="text-sm text-slate-400">—</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LemDetailsSheet: React.FC<LemDetailsSheetProps> = ({
  trigger,
  contractId,
  lemId,
  basePath,
  currency,
}) => {
  const currencyCode = resolveCurrency(currency, useUser()?.currency);
  const { isVendor, isProjectManager, isApprover, isManager, isAdmin, isViewOnly } =
    useUserRole();
  const user = useUser();
  const queryClient = useQueryClient();
  const { data: lemDetail, isLoading: detailLoading } = useQuery({
    queryKey: useUserQueryKey(["lem-detail", contractId, lemId, basePath]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${basePath}/${lemId}`,
      });
      return (res)?.data?.data as any;
    },
    enabled: !!contractId && !!lemId,
  });

  const toast = useToastHandler();

  // Comments (QA #202) — GET/POST .../lems/{lemId}/comments exist across all
  // roles; `basePath` already carries the role prefix so we just append.
  const commentsQueryKey = useUserQueryKey([
    "contractLemComments",
    contractId,
    lemId,
    basePath,
  ]);
  const { data: commentsRes, isLoading: isCommentsLoading } = useQuery<{
    message?: string;
    data?: { data?: ContractCommentDTO[]; page?: number; limit?: number };
  }>({
    queryKey: commentsQueryKey,
    queryFn: async () => {
      const res = await getRequest({ url: `${basePath}/${lemId}/comments` });
      return (res as { data?: unknown })?.data as {
        message?: string;
        data?: { data?: ContractCommentDTO[]; page?: number; limit?: number };
      };
    },
    enabled: !!contractId && !!lemId,
    staleTime: 60000,
  });

  const addCommentMutation = useMutation<
    { message?: string; data?: ContractCommentDTO },
    unknown,
    ContractChangeCommentDTO
  >({
    mutationKey: ["contractLemComments-add", contractId, lemId, basePath],
    mutationFn: async (payload) => {
      const res = await postRequest({
        url: `${basePath}/${lemId}/comments`,
        payload,
      });
      return (res as { data?: unknown })?.data as {
        message?: string;
        data?: ContractCommentDTO;
      };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: commentsQueryKey });
    },
    onError: (error) => {
      toast.error("LEM Comment", error as ApiResponseError);
    },
  });

  const comments = (commentsRes?.data?.data ?? []) as Array<
    ContractCommentDTO & { createdBy?: { name?: string; email?: string } }
  >;

  const getCommentAuthor = (c: ContractCommentDTO) =>
    c.user?.name ??
    (c as { createdBy?: { name?: string } }).createdBy?.name ??
    c.replyTo?.name ??
    "Unknown";

  const handleSendComment = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    try {
      await addCommentMutation.mutateAsync({ content: trimmed });
    } catch {
      // handled in onError
    }
  };
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [selectedDoc, setSelectedDoc] = React.useState<DocType | null>(null);

  const handlePreview = (doc: DocType) => {
    if (!doc.url) {
      toast.error("Preview", "File URL is missing");
      return;
    }
    setSelectedDoc(doc);
    setViewerOpen(true);
  };
  const handleDownload = (doc: DocType) => {
    if (!doc.url) {
      toast.error("Download", "File URL is missing");
      return;
    }
    const a = window.document.createElement("a");
    a.href = doc.url;
    a.download = doc.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  const canApproveOrReject =
    (isApprover || isManager) &&
    !isAdmin &&
    !isViewOnly &&
    !isVendor &&
    !isProjectManager;
  const approverStatus = (lemDetail as any)?.approverStatus;
  const showApprovalActions =
    canApproveOrReject && approverStatus === "pending";

  const summary = lemDetail?.summary as LemSummary | undefined;
  const hasSummary = !!(
    summary &&
    ((summary.files?.some((f) => f.sheets && f.sheets.length) ?? false) ||
      !!summary.comparison)
  );

  // Widen the slide-over on the LEM Summary tab so its wide sheet tables breathe.
  const [activeTab, setActiveTab] = React.useState("overview");


  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className={cn(
          "w-full rounded-2xl overflow-y-auto [&>button]:hidden",
          "transition-[max-width] duration-300 ease-in-out",
          activeTab === "summary" ? "sm:max-w-5xl" : "sm:max-w-2xl"
        )}
      >
        <div className="space-y-6" data-testid="lem-details-sheet">
          <SheetHeader className="space-y-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SheetClose asChild>
                  <button
                    type="button"
                    aria-label="Close LEM details"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] dark:border-slate-700 text-[#111827] dark:text-slate-200"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </SheetClose>
                <SheetTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                  LEM Details
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                {detailLoading ? "Loading..." : lemDetail?.title || "—"}
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="h-auto rounded-none w-full border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 justify-start bg-transparent">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  Overview
                </TabsTrigger>
                {hasSummary && (
                  <TabsTrigger
                    value="summary"
                    className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                  >
                    LEM Summary
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="comments"
                  className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  Comments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-6 sm:grid-cols-2">
                  <LabelRow
                    label="Deliverable Title"
                    value={
                      detailLoading ? "Loading..." : lemDetail?.title || "—"
                    }
                  />
                  <LabelRow
                    label="Submitted By"
                    value={
                      <a className="text-[#2563EB] dark:text-blue-400 underline">
                        {lemDetail?.submittedBy?.name || "-"}
                      </a>
                    }
                  />
                  <LabelRow
                    label="Amount"
                    value={
                      detailLoading || typeof lemDetail?.amount !== "number"
                        ? "—"
                        : formatCurrency(lemDetail.amount, "en-US", currencyCode)
                    }
                  />
                  <LabelRow
                    label="Status"
                    value={
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
                          getLemStatusColor(lemDetail?.status),
                        )}
                      >
                        {lemDetail?.status || "Pending"}
                      </span>
                    }
                  />
                  <LabelRow
                    label="Submission Date"
                    value={
                      detailLoading ? "Loading..." : formatDateValue(lemDetail?.createdAt)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
                    Description
                  </div>
                  <div className="text-sm text-[#374151] dark:text-slate-200">
                    {detailLoading
                      ? "Loading..."
                      : lemDetail?.description || "—"}
                  </div>
                </div>

                {lemDetail?.files && lemDetail.files.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                      Attachment
                    </div>
                    {lemDetail.files.map((file: any, index: number) => {
                      const ext = getFileExtension(file?.name || "", file?.type || "");
                      const d: DocType = {
                        id: `${file?.name || "attachment"}-${index}`,
                        name: file?.name || "Attachment",
                        type: ext,
                        size: file?.size || "—",
                        url: file?.url,
                        icon: getFileIcon(ext),
                      };
                      return (
                        <DocumentItem
                          key={d.id}
                          d={d}
                          handlePreview={handlePreview}
                          handleDownload={handleDownload}
                        />
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <LemSummaryContent
                  summary={summary}
                  currencyCode={currencyCode}
                />
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                <div className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">
                  Comments
                </div>
                {isCommentsLoading ? (
                  <div className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 p-4 text-sm text-[#6B7280] dark:text-slate-400">
                    Loading comments...
                  </div>
                ) : comments.length ? (
                  <div className="space-y-3">
                    {comments.map((comment, index) => (
                      <div
                        key={comment._id ?? `${index}`}
                        className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">
                            {getCommentAuthor(comment)}
                          </div>
                          <div className="text-xs text-[#6B7280] dark:text-slate-400">
                            {comment.createdAt
                              ? formatDateTZ(comment.createdAt, "dd MMM yyyy, HH:mm")
                              : ""}
                          </div>
                        </div>
                        <div
                          className="mt-2 text-sm text-[#374151] dark:text-slate-200 prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: comment.content ?? "",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 p-4 text-sm text-[#6B7280] dark:text-slate-400">
                    No comments yet.
                  </div>
                )}

                {!isVendor && (
                  <MessageComposer
                    onSend={(content) => {
                      void handleSendComment(content);
                    }}
                    isLoading={addCommentMutation.isPending}
                    currentUser={user ? { name: user.name } : { name: "You" }}
                    sendType="reply"
                    isNewChat={false}
                    onSendTypeChange={() => {}}
                    sendLabel="Send"
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Vendor/PM edit (pending) or resubmit (rejected) — bottom footer,
              matching the Deliverables detail layout. */}
          {isProjectManager &&
            (lemDetail?.status?.toLowerCase?.() === "pending" ||
              lemDetail?.status?.toLowerCase?.() === "rejected") && (
              <div className="flex gap-3 pt-6 justify-end">
                <SubmitLemDialog
                  mode="edit"
                  isResubmit={
                    lemDetail?.status?.toLowerCase?.() === "rejected"
                  }
                  lemId={lemId}
                  contractId={contractId}
                  currency={currencyCode}
                  initialLem={{
                    title: lemDetail?.title,
                    amount: lemDetail?.amount,
                    description: lemDetail?.description,
                    files: lemDetail?.files,
                  }}
                  trigger={
                    <Button
                      data-testid="edit-lem-trigger"
                      className="h-11 w-64 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white"
                    >
                      {lemDetail?.status?.toLowerCase?.() === "rejected"
                        ? "Resubmit"
                        : "Edit"}
                    </Button>
                  }
                />
              </div>
            )}

          {showApprovalActions && (
            <div className="flex gap-3 pt-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    Reject Change
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                      Reject LEM
                    </DialogTitle>
                  </DialogHeader>
                  <RejectLemForm
                    contractId={contractId}
                    lemId={lemId}
                    basePath={basePath}
                  />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="h-11 flex-1 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white">
                    Approve
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                      Approve LEM
                    </DialogTitle>
                  </DialogHeader>
                  <ApproveLemForm
                    contractId={contractId}
                    lemId={lemId}
                    basePath={basePath}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {selectedDoc && (
          <DocumentViewer
            isOpen={viewerOpen}
            onClose={() => {
              setViewerOpen(false);
              setSelectedDoc(null);
            }}
            fileUrl={selectedDoc.url ?? ""}
            fileName={selectedDoc.name}
            fileType={selectedDoc.type}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

const createColumns = (
  contractId: string,
  basePath: string,
  currency?: string,
): ColumnDef<LemRow>[] => [
  { accessorKey: "id", header: "LEM ID" },
  {
    accessorKey: "title",
    header: "LEM Title",
    cell: ({ getValue }) => (
      <div className="max-w-[260px] text-sm text-slate-700 dark:text-slate-200">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ getValue }) => (
      <span className="font-medium text-slate-900 dark:text-slate-100">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "submissionDate",
    header: "Submission Date",
    cell: ({ getValue }) => (
      <span className="text-sm text-slate-700 dark:text-slate-200">
        {formatDateValue(getValue<string>())}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue<string>();
      return (
        <span
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium capitalize",
            getLemStatusColor(s),
          )}
        >
          {s}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right">
          <LemDetailsSheet
            contractId={contractId}
            lemId={row.original.id}
            basePath={basePath}
            currency={currency}
            trigger={
              <button
                type="button"
                className="text-sm font-medium text-green-700 dark:text-green-400 hover:underline"
              >
                View
              </button>
            }
          />
        </div>
      );
    },
  },
];

const LemTable: React.FC<{
  contractId: string;
  rows: LemRow[];
  isLoading?: boolean;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  basePath: string;
  /** Contract-level currency; falls back to USD when the API omits it. */
  currency?: string;
}> = ({
  contractId,
  rows,
  isLoading,
  searchValue,
  onSearchChange,
  basePath,
  currency,
}) => {
  const filteredRows = React.useMemo(() => {
    const source = rows || [];
    const query = (searchValue || "").toLowerCase();
    if (!query) return source;
    return source.filter((row) =>
      [row.id, row.title].some((value) => value.toLowerCase().includes(query)),
    );
  }, [searchValue, rows]);

  return (
    <div className="space-y-4" data-testid="lem-table">
      <DataTable<LemRow>
        data={filteredRows}
        columns={createColumns(contractId, basePath, currency)}
        header={() => (
          <div className="flex items-center gap-3 border-b w-full border-[#E5E7EB] dark:border-slate-800 px-5 py-4">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">LEM</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search"
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="h-10 w-[260px] pl-9"
              />
            </div>
          </div>
        )}
        options={{
          disableSelection: true,
          disablePagination: true,
          manualPagination: false,
          totalCounts: filteredRows.length,
          setPagination: () => {},
          pagination: { pageIndex: 0, pageSize: 10 },
          isLoading: !!isLoading,
        }}
        classNames={{
          container: "border border-[#E5E7EB] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900",
          tHeader: "bg-[#F9FAFB] dark:bg-slate-800",
          tHeadRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tBody: "bg-white dark:bg-slate-900",
          tRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tHead: "px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400",
          tCell: "px-6 py-4 text-sm text-slate-700 dark:text-slate-200 align-top",
        }}
      />
    </div>
  );
};

export default LemTable;

import Spinner from "@/components/ui/Spinner";

const RejectLemForm: React.FC<{
  contractId: string;
  lemId: string;
  basePath: string;
  onSuccess?: () => void;
}> = ({ contractId, lemId, basePath, onSuccess }) => {
  const toast = useToastHandler();

  const schema = yup.object().shape({
    comment: yup.string().required("Rejection reason is required"),
  });
  const { control } = useForge({
    resolver: yupResolver(schema),
    defaultValues: { comment: "" },
  });

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation<
    ApiResponse,
    ApiResponseError,
    { comment: string }
  >({
    mutationKey: ["reject-lem", contractId, lemId, basePath],
    mutationFn: async (data) =>
      await postRequest({
        url: `${basePath}/${lemId}/approve`,
        payload: { action: "rejected", comment: data.comment },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lem-list", contractId] });
      queryClient.invalidateQueries({
        queryKey: ["lem-detail", contractId, lemId],
      });
      toast.success("Success", "LEM rejected successfully");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Error", error?.response?.data?.message || "Failed to reject LEM");
    },
  });

  const onSubmit = (data: { comment: string }) => {
    mutate(data);
  };

  return (
    <Forge control={control} onSubmit={onSubmit} className="space-y-4">
      <Forger
        name="comment"
        component={TextArea}
        placeholder="Enter rejection reason..."
        rows={4}
      />
      <DialogFooter >
        <Button
          type="submit"
          variant="destructive"
          className="w-full sm:w-auto bg-[#EF4444] hover:bg-[#DC2626]"
          disabled={isPending}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Spinner className="h-4 w-4 text-white" />
              <span>Rejecting...</span>
            </div>
          ) : (
            "Reject LEM"
          )}
        </Button>
      </DialogFooter>
    </Forge>
  );
};

const ApproveLemForm: React.FC<{
  contractId: string;
  lemId: string;
  basePath: string;
  onSuccess?: () => void;
}> = ({ contractId, lemId, basePath, onSuccess }) => {
  const toast = useToastHandler();

  const schema = yup.object().shape({
    note: yup.string().optional(),
  });
  const { control } = useForge({
    resolver: yupResolver(schema),
    defaultValues: { note: "" },
  });

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<
    ApiResponse,
    ApiResponseError,
    { note?: string }
  >({
    mutationKey: ["approve-lem", contractId, lemId, basePath],
    mutationFn: async (data) =>
      await postRequest({
        url: `${basePath}/${lemId}/approve`,
        payload: { action: "approved", comment: data.note },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lem-list", contractId] });
      queryClient.invalidateQueries({
        queryKey: ["lem-detail", contractId, lemId],
      });
      toast.success("Success", "LEM approved successfully");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Error", error?.response?.data?.message || "Failed to approve LEM");
    },
  });

  const onSubmit = (data: { note?: string }) => {
    mutate(data);
  };

  return (
    <Forge control={control} onSubmit={onSubmit} className="space-y-4">
      <Forger
        name="note"
        component={TextArea}
        placeholder="Optional note..."
        rows={3}
      />
      <DialogFooter>
        <Button
          type="submit"
          className="w-full sm:w-auto bg-[#1F3B63] hover:bg-[#162c4b]"
          disabled={isPending}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Spinner className="h-4 w-4 text-white" />
              <span>Approving...</span>
            </div>
          ) : (
            "Approve LEM"
          )}
        </Button>
      </DialogFooter>
    </Forge>
  );
};
