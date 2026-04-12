import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { TabsContent } from "@/components/ui/tabs";
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
import { ArrowLeft, FileText, Search, X } from "lucide-react";
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useToastHandler } from "@/hooks/useToaster";
import { cn, formatDateTZ } from "@/lib/utils";
import { getFileExtension, getFileIcon, formatFileSize } from "@/lib/fileUtils";
import type { ApiResponseError } from "@/types";
import type {
  ContractNcrSummary,
  ContractNcrStatsDTO,
} from "@/pages/ContractManagementPage/api/contractManagerApi";
import { DocumentItem, type DocType } from "@/pages/ContractManagementPage/components/DocumentItem";
import { DocumentViewer } from "@/components/ui/DocumentViewer";

type Props = {
  contractId: string;
  isActive?: boolean;
};

type NcrRow = {
  id: string;
  title: string;
  status: "Closed" | "Open";
};

type NcrDetail = {
  _id?: string;
  ncrId?: string;
  title?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  submittedBy?: { name?: string; email?: string };
  files?: Array<{
    _id?: string;
    name?: string;
    url?: string;
    type?: string;
    size?: number;
  }>;
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

const statusToUi = (status?: string): NcrRow["status"] => {
  const normalized = status?.toLowerCase();
  if (normalized === "approved" || normalized === "closed") return "Closed";
  return "Open";
};

const statusTone = (status: NcrRow["status"]) =>
  status === "Closed" ? "bg-[#FEECEC] text-[#E53935]" : "bg-[#EAF7EE] text-[#43A047]";

const NcrDetailsSheet = ({
  trigger,
  ncrId,
  basePath,
}: {
  trigger: React.ReactNode;
  ncrId: string;
  basePath: string;
}) => {
  const [open, setOpen] = React.useState(false);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [selectedDoc, setSelectedDoc] = React.useState<DocType | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["msa-ncr-detail", basePath, ncrId],
    queryFn: async () => {
      const response = await getRequest({ url: `${basePath}/${ncrId}` });
      return response.data as { data?: NcrDetail };
    },
    enabled: open && Boolean(ncrId),
    staleTime: 60000,
    retry: false,
  });

  const detail = (data as any)?.data?.data ?? (data as any)?.data;

  const docs: DocType[] =
    detail?.files?.map(
      (
        file: { _id?: string; name?: string; url?: string; type?: string; size?: number },
        index: number,
      ) => {
      const ext = getFileExtension(file?.name ?? "", file?.type ?? "");
      return {
        id: file?._id ?? `${file?.name ?? "file"}-${index}`,
        name: file?.name ?? "Attachment",
        type: ext,
        size: formatFileSize(file?.size ?? 0),
        url: file?.url,
        icon: getFileIcon(ext),
      };
      },
    ) ?? [];

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
              <div className="space-y-1">
                <div className="text-xs font-medium text-[#9CA3AF]">NCR Details</div>
                <div className="text-base font-semibold text-[#0F0F0F]">
                  {isLoading ? "Loading..." : detail?.ncrId || detail?._id || ncrId}
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                  statusTone(statusToUi(detail?.status)),
                )}
              >
                {statusToUi(detail?.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <LabelRow
                label="NCR ID"
                value={isLoading ? "Loading..." : detail?.ncrId || detail?._id || "-"}
              />
              <LabelRow
                label="Submission Date"
                value={formatDateTZ(detail?.createdAt, "MMMM dd, yyyy")}
              />
              <LabelRow
                label="Submitted by"
                value={
                  detail?.submittedBy?.email ? (
                    <a href={`mailto:${detail.submittedBy.email}`} className="text-[#2563EB] underline">
                      {detail.submittedBy?.name || detail.submittedBy.email}
                    </a>
                  ) : (
                    detail?.submittedBy?.name || "-"
                  )
                }
              />
              <LabelRow
                label="Updated"
                value={formatDateTZ(detail?.updatedAt, "MMMM dd, yyyy")}
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF]">Title</div>
              <div className="text-sm text-[#374151]">{detail?.title || "-"}</div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF]">Description</div>
              <div className="text-sm text-[#374151]">{detail?.description || "-"}</div>
            </div>

            {docs.length > 0 ? (
              <div className="space-y-3">
                <div className="text-base font-semibold text-[#0F0F0F]">Attachments</div>
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <DocumentItem
                      key={doc.id}
                      d={doc}
                      handlePreview={(nextDoc) => {
                        if (!nextDoc.url) return;
                        setSelectedDoc(nextDoc);
                        setViewerOpen(true);
                      }}
                      handleDownload={(nextDoc) => {
                        if (!nextDoc.url) return;
                        window.open(nextDoc.url, "_blank", "noopener,noreferrer");
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
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

const NcrLog: React.FC<Props> = ({ contractId, isActive }) => {
  const { isApprover, isVendor, isManager, isAdmin, isViewOnly } = useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<{ stats?: unknown; list?: unknown }>({});
  const [search, setSearch] = React.useState("");

  const basePath = React.useMemo(() => {
    if (isVendor) return `/contract/vendor/contracts/${contractId}/ncrs`;
    if (isApprover) return `/contract/approver/contracts/${contractId}/ncrs`;
    if (isManager) return `/contract/manager/contracts/${contractId}/ncrs`;
    if (isAdmin || isViewOnly) return `/contract/user/contracts/${contractId}/ncrs`;
    return `/contract/user/contracts/${contractId}/ncrs`;
  }, [contractId, isAdmin, isApprover, isManager, isVendor, isViewOnly]);

  const listQueryKey = useUserQueryKey(["msa-ncr-list", contractId, basePath]);
  const statsQueryKey = useUserQueryKey(["msa-ncr-stats", contractId, basePath]);

  const { data: statsRes, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: statsQueryKey,
    queryFn: async () => {
      const response = await getRequest({ url: `${basePath}/stats` });
      return response.data as { data?: ContractNcrStatsDTO };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const { data: listRes, isLoading: listLoading, error: listError } = useQuery({
    queryKey: listQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("limit", "50");
      const response = await getRequest({
        url: `${basePath}?${params.toString()}`,
      });
      return response.data as { data?: ContractNcrSummary[] };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  React.useEffect(() => {
    toastErrorRef.current = toastHandler.error;
  }, [toastHandler.error]);

  React.useEffect(() => {
    if (!statsError) return;
    if (lastErrorRef.current.stats === statsError) return;
    lastErrorRef.current.stats = statsError;
    toastErrorRef.current("MSA NCR Stats", statsError as ApiResponseError);
  }, [statsError]);

  React.useEffect(() => {
    if (!listError) return;
    if (lastErrorRef.current.list === listError) return;
    lastErrorRef.current.list = listError;
    toastErrorRef.current("MSA NCR", listError as ApiResponseError);
  }, [listError]);

  const rows = React.useMemo<NcrRow[]>(() => {
    const payload = (listRes as any)?.data;
    const source: ContractNcrSummary[] = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];
    return source.map((row) => ({
      id: row.ncrId ?? row._id ?? "-",
      title: row.title ?? "-",
      status: statusToUi(row.status),
    }));
  }, [listRes]);

  const filteredRows = React.useMemo(() => {
    if (!search.trim()) return rows;
    const query = search.toLowerCase();
    return rows.filter((row) =>
      [row.id, row.title, row.status].some((value) => value.toLowerCase().includes(query)),
    );
  }, [rows, search]);

  const columns = React.useMemo<ColumnDef<NcrRow>[]>(
    () => [
      { accessorKey: "id", header: "NCR ID" },
      { accessorKey: "title", header: "Title" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue<NcrRow["status"]>();
          return (
            <span
              className={cn(
                "inline-flex rounded-full px-4 py-1 text-xs font-semibold",
                statusTone(status),
              )}
            >
              {status}
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
              ncrId={row.original.id}
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

  const statsPayload = (statsRes as any)?.data;
  const stats = (statsPayload?.data ?? statsPayload ?? {}) as ContractNcrStatsDTO;

  return (
    <TabsContent value="ncr-log" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-[#0F0F0F]">
          Non-Compliance Report
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-5 flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-sm text-[#6B6B6B]">All NCR</div>
            <div className="text-base font-semibold leading-8 text-[#0F0F0F]">
              {statsLoading ? "—" : stats.total ?? 0}
            </div>
          </div>
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
              <FileText className="h-4 w-4 text-slate-700" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-5 flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-sm text-[#6B6B6B]">Issued</div>
            <div className="text-base font-semibold leading-8 text-[#0F0F0F]">
              {statsLoading ? "—" : stats.issue ?? 0}
            </div>
          </div>
          <div className="h-12 w-12 rounded-full bg-[#EAF7EE] flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
              <FileText className="h-4 w-4 text-[#43A047]" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-5 flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-sm text-[#6B6B6B]">Received</div>
            <div className="text-base font-semibold leading-8 text-[#0F0F0F]">
              {statsLoading ? "—" : stats.receive ?? 0}
            </div>
          </div>
          <div className="h-12 w-12 rounded-full bg-[#FFF8E0] flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
              <FileText className="h-4 w-4 text-[#E8AE00]" />
            </div>
          </div>
        </div>
      </div>

      <DataTable<NcrRow>
        data={filteredRows}
        columns={columns}
        options={{
          disableSelection: true,
          disablePagination: true,
          isLoading: listLoading,
        }}
        header={() => (
          <div className="flex items-center gap-4 border-b border-[#E9E9EB] px-6 py-4">
            <div className="text-base font-semibold text-[#0F0F0F]">NCR</div>
            <div className="relative w-[320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#6B6B6B]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search changes"
                className="h-12 rounded-lg border border-[#E5E7EB] pl-9 text-sm text-[#0F0F0F] placeholder:text-[#6B6B6B]"
              />
            </div>
          </div>
        )}
        classNames={{
          container: "overflow-hidden rounded-xl border border-[#E5E7EB] bg-white",
          table: "border-spacing-y-0",
          tHeader: "bg-[#F9FAFB]",
          tHeadRow: "border-b border-[#E5E7EB]",
          tBody: "bg-white",
          tRow: "border-b border-[#E5E7EB]",
          tHead: "px-6 py-3 text-sm font-semibold text-[#2A4467]",
          tCell: "px-6 py-4 text-sm text-slate-700 align-top",
        }}
        emptyPlaceholder={<div className="px-6 py-8 text-sm text-slate-500">No NCR found.</div>}
      />
    </TabsContent>
  );
};

export default NcrLog;
