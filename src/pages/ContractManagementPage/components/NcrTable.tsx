import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Search, X } from "lucide-react";
import type { ContractNcrSummary } from "../api/contractManagerApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/store/authSlice";
import { formatDateTZ } from "@/lib/utils";
import SubmitCapaDialog from "./SubmitCapaDialog";
import { getRequest, patchRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { getFileExtension, getFileIcon, formatFileSize } from "@/lib/fileUtils";
import { DocumentItem, type DocType } from "./DocumentItem";
import { DocumentViewer } from "@/components/ui/DocumentViewer";

export type NcrRow = {
  id: string;
  title: string;
  status: "Approved" | "Pending" | "Rejected";
  contractId: string;
  basePath: string;
};

type Props = {
  rows: ContractNcrSummary[];
  isLoading?: boolean;
  totalCount?: number;
  pagination: PaginationState;
  setPagination: OnChangeFn<PaginationState>;
  contractId: string;
  basePath: string;
};

type NcrDetailsSheetProps = {
  trigger: React.ReactNode;
  contractId: string;
  ncrId: string;
  basePath: string;
};

export interface NcrDetailsResponse {
  _id: string;
  company: string;
  contractRef: string;
  contractRefModel: string;
  submittedBy: SubmittedBy;
  ncrId: string;
  title: string;
  description: string;
  capa: Capa[];
  // BE returns `responders[]` to most viewers (manager/approver/etc.)
  // but a singular `responder` object to the responder themselves —
  // see project_rfi_responder_singular memory.
  responders?: Responder[];
  responder?: Responder;
  status: string;
  files: File[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Capa {
  _id: string;
  company: string;
  contractRef: string;
  contractRefModel: string;
  capaId: string;
  title: string;
  user: User;
  timeline: string;
  description: string;
  capa: unknown[];
  files: File[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface File {
  name: string;
  url: string;
  type: string;
  size: number;
  _id: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Responder {
  user: string | User;
  status: string;
  actionedAt?: string;
}

export interface SubmittedBy {
  _id: string;
  name: string;
  email: string;
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

const mapFilesToDocs = (files: File[]): DocType[] =>
  files.map((file, index) => {
    const fileType = getFileExtension(file?.name ?? "", file?.type ?? "");
    return {
      id: file?._id ?? `${file?.name ?? "file"}-${index}`,
      name: file?.name ?? "Untitled",
      type: fileType?.toUpperCase() ?? "FILE",
      size:
        typeof file?.size === "number"
          ? formatFileSize(file.size)
          : String(file?.size ?? "N/A"),
      url: file?.url,
      icon: getFileIcon(fileType),
    };
  });

const NcrDetailsSheet: React.FC<NcrDetailsSheetProps> = ({
  trigger,
  contractId,
  ncrId,
  basePath,
}) => {
  const [open, setOpen] = React.useState(false);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [selectedDoc, setSelectedDoc] = React.useState<DocType | null>(null);
  const user = useUser();
  const toastHandler = useToastHandler();
  const queryClient = useQueryClient();

  const { data: detailRes } = useQuery({
    queryKey: ["contractNcrs", "detail", contractId, ncrId, basePath],
    queryFn: async () => {
      const response = await getRequest({
        url: `${basePath}/${ncrId}`,
      });
      return response as ApiResponse<NcrDetailsResponse>;
    },
    enabled: Boolean(contractId) && Boolean(ncrId) && open,
    staleTime: 60000,
  });

  const detail = detailRes?.data?.data;
  const title = detail?.title ?? "-";
  const description = detail?.description ?? "-";
  const status = detail?.status ?? "-";
  const ncrIdentifier = detail?.ncrId ?? detail?._id ?? ncrId;
  const submittedBy = detail?.submittedBy?.name ?? "-";

  const submissionDate = formatDateTZ(detail?.createdAt, "dd MMM yyyy");
  const responseDeadline = formatDateTZ(detail?.updatedAt, "dd MMM yyyy");

  const latestCapa = detail?.capa?.[0];

  // Footer gating is identity-driven, not role-driven:
  //  - Responders (the user(s) listed on `detail.responders`) own the
  //    "Submit CAPA" action while the NCR has no CAPA yet.
  //  - The NCR's `submittedBy` owns the "Approve CAPA" action once the
  //    responder has submitted.
  //
  // BE returns `responders[]` to most viewers but a singular
  // `responder` object to the responder themselves. Check both so the
  // match works regardless of which shape arrived.
  const isResponderMatched = React.useMemo(() => {
    const uid = user?._id;
    if (!uid) return false;
    const extractId = (r: Responder | undefined) => {
      if (!r?.user) return undefined;
      return typeof r.user === "string" ? r.user : r.user?._id;
    };
    const fromList = (detail?.responders ?? []).some(
      (r) => extractId(r) === uid,
    );
    if (fromList) return true;
    return extractId(detail?.responder) === uid;
  }, [detail?.responders, detail?.responder, user?._id]);

  const isNcrSubmitter = Boolean(
    user?._id && detail?.submittedBy?._id === user._id,
  );

  const overviewDocs = React.useMemo(
    () => mapFilesToDocs(detail?.files ?? []),
    [detail?.files],
  );
  const capaDocs = React.useMemo(
    () => mapFilesToDocs(latestCapa?.files ?? []),
    [latestCapa?.files],
  );

  const handlePreview = (doc: DocType) => {
    if (!doc.url) return;
    setSelectedDoc(doc);
    setViewerOpen(true);
  };

  const handleDownload = (doc: DocType) => {
    if (!doc.url) return;
    const a = window.document.createElement("a");
    a.href = doc.url;
    a.download = doc.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  const invalidateNcrQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["contractNcrs"] });
  };

  const approveCapaMutation = useMutation({
    mutationFn: async () => {
      if (!latestCapa?._id) throw new Error("CAPA record not found");
      return await patchRequest({
        url: `${basePath}/${ncrId}/capa/${latestCapa._id}/approve`,
      });
    },
    onSuccess: async (res) => {
      toastHandler.success(
        "NCR CAPA",
        (res as ApiResponse<{ message?: string }>)?.data?.message ??
          "CAPA approved successfully",
      );
      queryClient.invalidateQueries({
        queryKey: ["contractNcrs", "detail", contractId, ncrId, basePath],
      });
      invalidateNcrQueries();
    },
    onError: (error: ApiResponseError) => {
      toastHandler.error("NCR CAPA", error);
    },
  });

  const [closeChecklistOpen, setCloseChecklistOpen] = React.useState(false);
  const [closeSuccessOpen, setCloseSuccessOpen] = React.useState(false);

  const closeNcrMutation = useMutation({
    mutationFn: async () =>
      await patchRequest({
        url: `${basePath}/${ncrId}/close`,
        payload: { reason: "NCR closure checklist verified" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["contractNcrs", "detail", contractId, ncrId, basePath],
      });
      invalidateNcrQueries();
      setCloseChecklistOpen(false);
      setCloseSuccessOpen(true);
    },
    onError: (error: ApiResponseError) => {
      toastHandler.error("Close NCR", error);
    },
  });

  const isRespondActionPending =
    approveCapaMutation.isPending || closeNcrMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl rounded-2xl overflow-y-auto [&>button]:hidden"
      >
        <div className="space-y-6" data-testid="ncr-details-sheet">
          <SheetHeader className="space-y-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827] dark:border-slate-700 dark:text-slate-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <SheetTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                  NCR Details
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
              <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                {title}
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F] dark:border-slate-700 dark:text-slate-100"
              >
                <Download className="mr-2 h-4 w-4" /> Export
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
                {detail?.capa && detail.capa.length > 0 && (
                  <TabsTrigger
                    value="capa"
                    className="data-[state=active]:border-[#6941C6] data-[state=active]:text-[#6941C6] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                  >
                    Corrective &amp; Preventive Action Plan
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="comments"
                  className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  Comments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <LabelRow label="NCR Title" value={title} />
                  <LabelRow
                    label="Submitted by"
                    value={
                      <a className="text-[#2563EB] underline">{submittedBy}</a>
                    }
                  />
                  <LabelRow label="NCR ID" value={ncrIdentifier} />
                  <LabelRow label="Submission Date" value={submissionDate} />
                  <LabelRow
                    label="Response Deadline"
                    value={responseDeadline}
                  />
                  <LabelRow
                    label="Status"
                    value={(() => {
                      const s = String(status || "").toLowerCase();
                      const tone =
                        s === "approved"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : s === "rejected"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                            : s === "closed"
                              ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
                      return (
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}
                        >
                          {String(status || "-")}
                        </span>
                      );
                    })()}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
                    Description
                  </div>
                  <div className="text-sm text-[#374151] dark:text-slate-300">{description}</div>
                </div>

                <div className="space-y-3">
                  <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                    Attached Documents
                  </div>
                  {overviewDocs.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {overviewDocs.map((doc) => (
                        <DocumentItem
                          key={doc.id}
                          d={doc}
                          handlePreview={handlePreview}
                          handleDownload={handleDownload}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#E5E7EB] p-4 text-sm text-[#6B7280] dark:border-slate-700 dark:text-slate-400">
                      No attached documents.
                    </div>
                  )}
                </div>
              </TabsContent>

              {detail?.capa && detail.capa.length > 0 && (
                <TabsContent value="capa" className="space-y-10">
                  <div className="space-y-4">
                    <div className="text-sm text-[#6B7280] dark:text-slate-400">
                      Corrective &amp; Preventive Action Plan
                    </div>
                    <div className="text-base font-semibold leading-[1.5] text-[#0F0F0F] dark:text-slate-100">
                      {latestCapa?.description ?? description}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                      Attached Documents
                    </div>
                    {capaDocs.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-1">
                        {capaDocs.map((doc) => (
                          <DocumentItem
                            key={doc.id}
                            d={doc}
                            handlePreview={handlePreview}
                            handleDownload={handleDownload}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#E5E7EB] p-4 text-sm text-[#6B7280] dark:border-slate-700 dark:text-slate-400">
                        No attached documents.
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              <TabsContent value="comments" className="space-y-4">
                <div className="rounded-xl border border-[#E5E7EB] p-4 text-sm text-[#6B7280]">
                  No comments available.
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer is identity-gated:
              - No CAPA + viewer is a listed responder → Cancel + Submit CAPA
              - CAPA submitted + viewer is the NCR submitter → Cancel + Approve CAPA
              - NCR status approved + viewer is the NCR submitter → Cancel + Close NCR */}
          {!latestCapa?._id && isResponderMatched ? (
            <div className="flex w-full gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <SubmitCapaDialog
                contractId={contractId}
                ncrId={ncrId}
                ncrTitle={title}
                basePath={basePath}
                trigger={
                  <Button className="flex-1 h-12 rounded-xl bg-[#2A4467] text-base font-semibold text-white hover:bg-[#1f3552]">
                    Submit CAPA
                  </Button>
                }
              />
            </div>
          ) : null}

          {latestCapa?._id &&
          isNcrSubmitter &&
          String(status).toLowerCase() !== "approved" ? (
            <div className="flex w-full gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl bg-[#2A4467] text-base font-semibold text-white hover:bg-[#1f3552]"
                onClick={() => approveCapaMutation.mutate()}
                disabled={isRespondActionPending}
              >
                Approve CAPA
              </Button>
            </div>
          ) : null}

          {String(status).toLowerCase() === "approved" && isNcrSubmitter ? (
            <div className="flex w-full gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl bg-[#2A4467] text-base font-semibold text-white hover:bg-[#1f3552]"
                onClick={() => setCloseChecklistOpen(true)}
                disabled={isRespondActionPending}
              >
                Close NCR
              </Button>
            </div>
          ) : null}

          <CloseNcrChecklistDialog
            open={closeChecklistOpen}
            onOpenChange={setCloseChecklistOpen}
            onConfirm={() => closeNcrMutation.mutate()}
            isSubmitting={closeNcrMutation.isPending}
          />

          <NcrCloseSuccessDialog
            open={closeSuccessOpen}
            onOpenChange={setCloseSuccessOpen}
            onDone={() => {
              setCloseSuccessOpen(false);
              setOpen(false);
            }}
          />
          {selectedDoc ? (
            <DocumentViewer
              isOpen={viewerOpen}
              onClose={() => {
                setViewerOpen(false);
                setSelectedDoc(null);
              }}
              fileUrl={selectedDoc.url ?? ""}
              fileName={selectedDoc.name}
              fileType={getFileExtension(selectedDoc.name, selectedDoc.type)}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const columns: ColumnDef<NcrRow>[] = [
  { accessorKey: "id", header: "NCR ID" },
  { accessorKey: "title", header: "Title" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue<NcrRow["status"]>();
      const tone =
        s === "Approved"
          ? "bg-green-100 text-green-700"
          : s === "Rejected"
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700";
      return (
        <span className={`px-4 py-1 rounded-full text-xs font-medium ${tone}`}>
          {s}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <NcrDetailsSheet
          contractId={row.original.contractId}
          ncrId={row.original.id}
          basePath={row.original.basePath}
          trigger={
            <button
              type="button"
              className="text-sm font-medium text-green-700 hover:underline"
            >
              View
            </button>
          }
        />
      </div>
    ),
  },
];

const formatNcrStatus = (status?: string): NcrRow["status"] => {
  const normalized = status?.toLowerCase();
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  return "Pending";
};

const NcrTable: React.FC<Props> = ({
  rows,
  isLoading,
  totalCount,
  pagination,
  setPagination,
  contractId,
  basePath,
}) => {
  const [search, setSearch] = React.useState("");

  const tableRows = React.useMemo<NcrRow[]>(
    () =>
      rows.map((row) => ({
        id: row.ncrId ?? row._id ?? "-",
        title: row.title ?? "-",
        status: formatNcrStatus(row.status),
        contractId,
        basePath,
      })),
    [rows, contractId, basePath],
  );

  const filteredRows = React.useMemo(() => {
    if (!search) return tableRows;
    const query = search.toLowerCase();
    return tableRows.filter((row) =>
      [row.id, row.title, row.status].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [search, tableRows]);

  return (
    <div className="space-y-4" data-testid="ncr-table">
      <DataTable<NcrRow>
        data={filteredRows}
        columns={columns}
        header={() => (
          <div className="flex items-center gap-3 border-b w-full border-[#E5E7EB] dark:border-slate-800 px-5 py-4">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">NCR</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search changes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-[260px] pl-9"
              />
            </div>
          </div>
        )}
        options={{
          disableSelection: true,
          isLoading,
          manualPagination: true,
          totalCounts: totalCount ?? filteredRows.length,
          setPagination,
          pagination,
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

export default NcrTable;

const CLOSE_NCR_CHECKLIST = [
  "All corrective and preventive actions are completed as planned",
  "Sufficient documentation (photos, test reports, records) supports the actions taken",
  "Actions have successfully resolved the non-conformance and prevented recurrence",
  "All NCR documentation is complete, clear, and up-to-date",
  "Necessary approvals from relevant stakeholders have been obtained",
  "Insights have been documented for training and future process improvements",
  "NCR status has been marked as “Closed” in the system",
  "Closed NCR has been archived for audits and future reference",
];

const CloseNcrChecklistDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}> = ({ open, onOpenChange, onConfirm, isSubmitting }) => {
  const [checked, setChecked] = React.useState<boolean[]>(() =>
    CLOSE_NCR_CHECKLIST.map(() => false),
  );

  React.useEffect(() => {
    if (!open) setChecked(CLOSE_NCR_CHECKLIST.map(() => false));
  }, [open]);

  const someChecked = checked.some(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] w-full max-w-xl gap-0 overflow-y-auto rounded-2xl border-0 p-0"
      >
        <div className="flex items-center justify-between px-8 pb-2 pt-8">
          <DialogTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
            Close NCR
          </DialogTitle>
          <button
            type="button"
            onClick={() => !isSubmitting && onOpenChange(false)}
            disabled={isSubmitting}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#EF4444] disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <DialogDescription className="sr-only">
          Confirm that every NCR closure checklist item is complete before
          closing the NCR.
        </DialogDescription>

        <div className="space-y-5 px-8 pb-2 pt-2">
          <div className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">
            NCR Checklist
          </div>
          <div className="space-y-4">
            {CLOSE_NCR_CHECKLIST.map((item, i) => (
              <label
                key={i}
                className="flex items-start gap-3 text-sm text-[#374151] dark:text-slate-200 cursor-pointer"
              >
                <Checkbox
                  checked={checked[i]}
                  onCheckedChange={(value) => {
                    setChecked((prev) => {
                      const next = [...prev];
                      next[i] = Boolean(value);
                      return next;
                    });
                  }}
                  className="mt-0.5"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 px-8 pb-8 pt-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="inline-flex h-11 min-w-[140px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!someChecked || isSubmitting}
            className="inline-flex h-11 min-w-[170px] items-center justify-center rounded-xl bg-[#2A4467] px-6 text-base font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? "Closing..." : "Close NCR"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const NcrCloseSuccessDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}> = ({ open, onOpenChange, onDone }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      showCloseButton={false}
      className="w-full max-w-md rounded-2xl border-0 px-8 py-10"
    >
      <DialogTitle className="sr-only">NCR Closed Successfully</DialogTitle>
      <DialogDescription className="sr-only">
        The NCR has been closed.
      </DialogDescription>
      <div className="flex flex-col items-center gap-6">
        <CheckCircle2 className="h-16 w-16 text-[#22C55E]" />
        <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
          NCR Closed Successfully
        </div>
        <div className="flex w-full items-center gap-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onDone}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#2A4467] text-base font-semibold text-white"
          >
            Done
          </button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
