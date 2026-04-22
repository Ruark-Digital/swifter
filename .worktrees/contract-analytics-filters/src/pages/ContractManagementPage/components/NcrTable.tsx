import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
} from "@tanstack/react-table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Search, X } from "lucide-react";
import type { ContractNcrSummary } from "../api/contractManagerApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDateTZ } from "@/lib/utils";
import SubmitCapaDialog from "./SubmitCapaDialog";
import { getRequest, patchRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useUser } from "@/store/authSlice";
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
  responders: Responder[];
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
    <div className="text-xs font-medium text-[#9CA3AF]">{label}</div>
    <div className="text-sm font-medium text-[#111827]">{value}</div>
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
  const { isApprover, isVendor } = useUserRole();
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

  const responderIds = React.useMemo(
    () =>
      (detail?.responders ?? [])
        .map((responder) =>
          typeof responder?.user === "string"
            ? responder.user
            : responder?.user?._id,
        )
        .filter((value): value is string => Boolean(value)),
    [detail?.responders],
  );

  const isResponderMatched =
    Boolean(user?._id) && responderIds.includes(user?._id ?? "");

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

  const rejectCapaMutation = useMutation({
    mutationFn: async () =>
      await patchRequest({
        url: `${basePath}/${ncrId}/close`,
        payload: { reason: "CAPA rejected" },
      }),
    onSuccess: (res) => {
      toastHandler.success(
        "NCR CAPA",
        (res as ApiResponse<{ message?: string }>)?.data?.message ??
          "CAPA rejected successfully",
      );
      invalidateNcrQueries();
      setOpen(false);
    },
    onError: (error: ApiResponseError) => {
      toastHandler.error("NCR CAPA", error);
    },
  });

  const closeNcrMutation = useMutation({
    mutationFn: async () =>
      await patchRequest({
        url: `${basePath}/${ncrId}/close`,
        payload: { reason: "CAPA approved" },
      }),
    onSuccess: (res) => {
      toastHandler.success(
        "NCR",
        (res as ApiResponse<{ message?: string }>)?.data?.message ??
          "NCR closed successfully",
      );
      queryClient.invalidateQueries({
        queryKey: ["contractNcrs", "detail", contractId, ncrId, basePath],
      });
      invalidateNcrQueries();
      setOpen(false);
    },
    onError: (error: ApiResponseError) => {
      toastHandler.error("Close NCR", error);
    },
  });

  const isRespondActionPending =
    approveCapaMutation.isPending ||
    rejectCapaMutation.isPending ||
    closeNcrMutation.isPending;

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
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <SheetTitle className="text-base font-semibold text-[#0F0F0F]">
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
              <div className="text-base font-semibold text-[#0F0F0F]">
                {title}
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
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
                <TabsTrigger
                  value="capa"
                  className="data-[state=active]:border-[#6941C6] data-[state=active]:text-[#6941C6] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  Corrective &amp; Preventive Action Plan
                </TabsTrigger>
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
                    value={
                      <span className="inline-flex rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#16A34A]">
                        {String(status || "-")}
                      </span>
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#9CA3AF]">
                    Description
                  </div>
                  <div className="text-sm text-[#374151]">{description}</div>
                </div>

                {isResponderMatched ? (
                  <div className="space-y-3">
                    <div className="text-base font-semibold text-[#0F0F0F]">
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
                      <div className="rounded-xl border border-dashed border-[#E5E7EB] p-4 text-sm text-[#6B7280]">
                        No attached documents.
                      </div>
                    )}
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="capa" className="space-y-10">
                <div className="space-y-4">
                  <div className="text- text-[#6B7280]">
                    Corrective &amp; Preventive Action Plan
                  </div>
                  <div className="text-base font-semibold leading-[1.5] text-[#0F0F0F]">
                    {latestCapa?.description ?? description}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-base font-semibold text-[#0F0F0F]">
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
                    <div className="rounded-xl border border-dashed border-[#E5E7EB] p-4 text-sm text-[#6B7280]">
                      No attached documents.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                <div className="rounded-xl border border-[#E5E7EB] p-4 text-sm text-[#6B7280]">
                  No comments available.
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {isApprover || isVendor ? (
            <div className="flex w-full gap-3 pt-2">
              {!latestCapa?._id ? (
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
              ) : null}
              {latestCapa?._id && (isApprover || isVendor) ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-[#FCA5A5] text-[#DC2626] hover:text-[#B91C1C]"
                    onClick={() => rejectCapaMutation.mutate()}
                    disabled={isRespondActionPending}
                  >
                    Reject CAPA
                  </Button>
                  <Button
                    className="flex-1 h-12 rounded-xl bg-[#2A4467] text-base font-semibold text-white hover:bg-[#1f3552]"
                    onClick={() => approveCapaMutation.mutate()}
                    disabled={isRespondActionPending}
                  >
                    Approve CAPA
                  </Button>
                  {String(status).toLowerCase() === "approved" ? (
                    <Button
                      className="flex-1 h-12 rounded-xl bg-[#2A4467] text-base font-semibold text-white hover:bg-[#1f3552]"
                      onClick={() => closeNcrMutation.mutate()}
                      disabled={isRespondActionPending}
                    >
                      Close NCR
                    </Button>
                  ) : null}
                </>
              ) : !latestCapa?._id && isResponderMatched ? (
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
              ) : null}
            </div>
          ) : null}
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
          <div className="flex items-center gap-3 border-b w-full border-[#E5E7EB] px-5 py-4">
            <span className="text-sm font-medium text-slate-900">NCR</span>
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

export default NcrTable;
