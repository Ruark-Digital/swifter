import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Search,
  Share2,
  UploadCloud,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { formatFileSize, getFileIcon, getSimpleFileExtension } from "@/lib/fileUtils";
import { useToastHandler } from "@/hooks/useToaster";

type UploadedFilePayload = {
  name: string;
  url: string;
  type: string;
  size: string;
};

export type DeliverableRow = {
  id: string;
  title: string;
  dueDate: string;
  submissionDate?: string;
  submissionStatus: "Submitted" | "Late" | "Pending";
  kpi: string;
  status: "Approved" | "Rejected" | "Pending" | "Under Review";
};

type DeliverableDetailsSheetProps = {
  trigger: React.ReactNode;
  contractId: string;
  deliverableId: string;
  isApprover?: boolean;
  basePath: string;
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
  type: string;
  size: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2FF]">
      {getFileIcon(type)}
    </div>
    <div className="flex-1">
      <div className="text-sm font-medium text-[#111827]">{name}</div>
      <div className="text-xs text-[#9CA3AF]">
        {type.toUpperCase()} • {size}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827]"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827]"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const SubmitDeliverableDialog: React.FC<{
  trigger: React.ReactNode;
  contractId: string;
  deliverableId: string;
  basePath: string;
}> = ({ trigger, contractId, deliverableId, basePath }) => {
  const [open, setOpen] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const resetForm = React.useCallback(() => {
    setDescription("");
    setSelectedFiles([]);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const addFiles = React.useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const next = Array.from(files);
    setSelectedFiles((prev) => {
      const merged = [...prev];
      for (const file of next) {
        if (!merged.some((existing) => existing.name === file.name)) {
          merged.push(file);
        }
      }
      return merged;
    });
  }, []);

  const uploadFiles = React.useCallback(async (files: File[]) => {
    const uploaded: UploadedFilePayload[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await postRequest({
        url: "/upload",
        payload: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      });

      const uploadedData = uploadRes?.data?.data;
      if (Array.isArray(uploadedData) && uploadedData[0]) {
        uploaded.push({
          name: String(uploadedData[0].name),
          url: String(uploadedData[0].url),
          type: String(uploadedData[0].type),
          size: String(uploadedData[0].size),
        });
        continue;
      }

      uploaded.push({
        name: file.name,
        url: "",
        type: file.type || "application/octet-stream",
        size: String(file.size),
      });
    }

    return uploaded;
  }, []);

  const submitMutation = useMutation({
    mutationKey: ["submit-deliverable", contractId, deliverableId],
    mutationFn: async () => {
      const files = await uploadFiles(selectedFiles);
      return postRequest({
        url: `${basePath}/${deliverableId}/submit`,
        payload: {
          description,
          files,
        },
      });
    },
    onSuccess: () => {
      toast.success("Success", "Deliverable submitted successfully");
      queryClient.invalidateQueries({
        queryKey: ["deliverables", contractId, basePath],
      });
      queryClient.invalidateQueries({
        queryKey: ["deliverables-stats", contractId, basePath],
      });
      queryClient.invalidateQueries({
        queryKey: ["deliverable-detail", contractId, deliverableId, basePath],
      });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(
        "Error",
        error?.response?.data?.message || "Failed to submit deliverable",
      );
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitMutation.isPending) {
          setOpen(next);
          if (!next) resetForm();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[700px] max-w-[calc(100vw-32px)] rounded-2xl p-8">
        <DialogHeader className="space-y-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[36px] font-semibold text-[#0F0F0F]">
              Submit Deliverable
            </DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center text-[#EF4444]"
              >
                <X className="h-6 w-6" />
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-2xl font-normal text-[#0F0F0F]">Upload Files</p>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                addFiles(event.dataTransfer.files);
              }}
              className={`flex min-h-[212px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed ${
                isDragging ? "border-[#1F3B63] bg-[#F8FAFC]" : "border-[#1F3B63]"
              } px-4 text-center`}
            >
              <UploadCloud className="h-12 w-12 text-[#1F3B63]" />
              <p className="mt-4 text-[36px] font-semibold text-[#1F3B63]">
                Drag & Drop or Click to choose files
              </p>
              <p className="mt-2 text-2xl text-[#6B6B6B]">
                Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".doc,.docx,.pdf,.xls,.xlsx,.zip,.png,.jpeg,.jpg"
                onChange={(event) => addFiles(event.target.files)}
              />
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              {selectedFiles.map((file) => (
                <div
                  key={`${file.name}-${file.lastModified}`}
                  className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF1FB]">
                      <FileText className="h-5 w-5 text-[#1F3B63]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F0F0F]">
                        {file.name}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {getSimpleFileExtension(file.name).toUpperCase()} •{" "}
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center text-[#EF4444]"
                    onClick={() =>
                      setSelectedFiles((prev) =>
                        prev.filter((it) => it.name !== file.name),
                      )
                    }
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-2xl font-normal text-[#0F0F0F]">
              Add Responders <span className="text-[#6B6B6B]">(Multi-Select)</span>
            </p>
            <div className="rounded-lg border border-[#E5E7EB] px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {["Olamide Oladehinde", "Deji Ade", "Jacob Smith", "Ola Daniel"].map(
                  (name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#2A44671A] px-2 py-1 text-[12px] font-semibold text-[#2A4467]"
                    >
                      {name}
                      <X className="h-[14px] w-[14px] text-[#EF4444]" />
                    </span>
                  ),
                )}
                <span className="text-2xl text-[#6B6B6B]">Search</span>
              </div>
            </div>
            <p className="text-2xl font-medium text-[#2A4467]">
              Add with email address, name
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-2xl font-medium text-[#0F0F0F]">Description</p>
            <textarea
              className="h-[120px] w-full rounded-lg border border-[#E5E7EB] px-4 py-3 text-xl text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F3B63]/20"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Duration"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-6 pl-[236px]">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitMutation.isPending}
            className="h-[56px] flex-1 rounded-xl border-[#E5E7EB] bg-[#F3F4F6] text-[16px] font-semibold text-[#0F0F0F]"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            className="h-[56px] flex-1 rounded-xl bg-[#1F3B63] text-[16px] font-semibold text-white hover:bg-[#1F3B63]/95"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Deliverable"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DeliverableDetailsSheet: React.FC<DeliverableDetailsSheetProps> = ({
  trigger,
  contractId,
  deliverableId,
  isApprover,
  basePath,
}) => {
  const [open, setOpen] = React.useState(false);
  const isVendor = basePath.includes("/vendor/");
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [
      "deliverable-detail",
      contractId,
      deliverableId,
      basePath,
      open,
    ],
    queryFn: async () => {
      const res = await getRequest({
        url: `${basePath}/${deliverableId}`,
      });
      return res as any;
    },
    enabled: open && !!contractId && !!deliverableId,
    staleTime: 60000,
  });

  const detail = data?.data?.data;

  const approveRejectMutation = useMutation({
    mutationKey: ["approve-reject-deliverable", contractId, deliverableId, basePath],
    mutationFn: async (action: "approved" | "rejected") =>
      postRequest({
        url: `${basePath}/${deliverableId}/approve`,
        payload: { action, comment: "" },
      }),
    onSuccess: (_, action) => {
      toast.success(
        "Success",
        `Deliverable ${action === "approved" ? "approved" : "rejected"} successfully`,
      );
      queryClient.invalidateQueries({
        queryKey: ["deliverables", contractId, basePath],
      });
      queryClient.invalidateQueries({
        queryKey: ["deliverables-stats", contractId, basePath],
      });
      queryClient.invalidateQueries({
        queryKey: ["deliverable-detail", contractId, deliverableId, basePath],
      });
    },
    onError: (error: any, action) => {
      toast.error(
        "Error",
        error?.response?.data?.message ||
          `Failed to ${action === "approved" ? "approve" : "reject"} deliverable`,
      );
    },
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl rounded-2xl overflow-y-auto [&>button]:hidden"
      >
        <div className="space-y-6" data-testid="deliverable-details-sheet">
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
                  Deliverable Details
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
              <div className="text-base font-semibold text-[#0F0F0F]">
                {detail?.name ?? "Deliverable Details"}
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
              >
                <Share2 className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>

            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-24 rounded bg-slate-200" />
                    <div className="h-4 w-40 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                <LabelRow label="Deliverable Title" value={detail?.name ?? "-"} />
                <LabelRow
                  label="Amount"
                  value={
                    typeof detail?.amount === "number"
                      ? `$${detail.amount.toLocaleString()}`
                      : detail?.amount ?? "-"
                  }
                />
                <LabelRow label="Due Date" value={detail?.dueDate ?? "-"} />
                <LabelRow
                  label="Submission Date"
                  value={detail?.submissionDate ?? "-"}
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF]">Status</div>
              <div className="inline-flex rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#F59E0B]">
                {detail?.status
                  ? detail.status
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c: string) => c.toUpperCase())
                  : "Under Review"}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF]">Description</div>
              <div className="text-sm text-[#374151]">
                {detail?.description ?? "-"}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-base font-semibold text-[#0F0F0F]">
              Attached Documents
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(detail?.files ?? []).map((f: any, idx: number) => (
                <DocCard
                  key={idx}
                  name={f?.name ?? "File"}
                  type={f?.type ?? "DOC"}
                  size={typeof f?.size === "string" ? f.size : String(f?.size ?? "")}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            {isApprover ? (
              <>
                <Button
                  variant="outline"
                  className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827]"
                  disabled={approveRejectMutation.isPending}
                  onClick={() => approveRejectMutation.mutate("rejected")}
                >
                  {approveRejectMutation.isPending ? "Rejecting..." : "Reject"}
                </Button>
                <Button
                  className="h-11 flex-1 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white"
                  disabled={approveRejectMutation.isPending}
                  onClick={() => approveRejectMutation.mutate("approved")}
                >
                  {approveRejectMutation.isPending ? "Approving..." : "Approve"}
                </Button>
              </>
            ) : isVendor ? (
              <SubmitDeliverableDialog
                contractId={contractId}
                deliverableId={deliverableId}
                basePath={basePath}
                trigger={
                  <Button className="h-11 flex-1 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white">
                    Submit
                  </Button>
                }
              />
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const columns: ColumnDef<DeliverableRow>[] = [
  { accessorKey: "id", header: "Deliverable ID" },
  {
    accessorKey: "title",
    header: "Deliverable Title",
    cell: ({ getValue }) => (
      <div className="max-w-[260px] text-sm text-slate-700">
        {getValue<string>()}
      </div>
    ),
  },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="space-y-1 text-xs text-slate-600">
        <p>
          <span className="text-slate-500">Due Date:&nbsp;</span>
          <span className="text-slate-900">{row.original.dueDate}</span>
        </p>
        <p>
          <span className="text-slate-500">Submission Date:&nbsp;</span>
          <span className="text-slate-900">
            {row.original.submissionDate ?? "-"}
          </span>
        </p>
      </div>
    ),
  },
  { accessorKey: "submissionStatus", header: "Submission Status" },
  { accessorKey: "kpi", header: "KPI" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue<DeliverableRow["status"]>();
      const tone =
        s === "Approved"
          ? "bg-green-100 text-green-700"
          : s === "Rejected"
          ? "bg-red-100 text-red-600"
          : s === "Pending"
            ? "bg-yellow-100 text-yellow-700"
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
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row, table }) => {
      const contractId: string = (table.options.meta as any)?.contractId ?? "";
      const basePath: string = (table.options.meta as any)?.basePath ?? "";
      return (
        <div className="text-right">
          <DeliverableDetailsSheet
            contractId={contractId}
            deliverableId={row.original.id}
            isApprover={(table.options.meta as any)?.isApprover}
            basePath={basePath}
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
      );
    },
  },
];

type DeliverablesTableProps = {
  rows: DeliverableRow[];
  isLoading: boolean;
  contractId: string;
  isApprover?: boolean;
  basePath: string;
};

const DeliverablesTable: React.FC<DeliverablesTableProps> = ({
  rows,
  isLoading,
  contractId,
  isApprover = false,
  basePath,
}) => {
  const [search, setSearch] = React.useState("");
  const filteredRows = React.useMemo(() => {
    const src = Array.isArray(rows) ? rows : [];
    const q = search.trim().toLowerCase();
    if (!q) return src;
    return src.filter((row) =>
      [row.id, row.title, row.submissionStatus, row.status, row.kpi]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [search, rows]);

  return (
    <div className="space-y-4" data-testid="deliverables-table">
      <DataTable<DeliverableRow>
        data={filteredRows}
        columns={columns}
        header={() => (
          <div className="flex items-center w-full gap-3 border-b border-[#E5E7EB] px-5 py-4">
            <span className="text-sm font-medium text-slate-900">
              Deliverables
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-[260px] pl-9"
                disabled={isLoading}
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
          meta: { contractId, isApprover, basePath },
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

export default DeliverablesTable;
