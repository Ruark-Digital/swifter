import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
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
  FileText,
  Search,
  Share2,
  UploadCloud,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import {
  formatFileSize,
  getFileIcon,
  getSimpleFileExtension,
} from "@/lib/fileUtils";
import { useToastHandler } from "@/hooks/useToaster";
import { Forge, Forger, useForge } from "@/lib/forge";
import {
  TextArea,
  TextFileUploader,
  TextMultiSelect,
} from "@/components/layouts/FormInputs";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useWatch, useFormContext } from "react-hook-form";
import Spinner from "@/components/ui/Spinner";
import { DocumentItem } from "@/pages/ContractManagementPage/components/DocumentItem";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import { formatDate, isValid } from "date-fns";
import { vendorApi } from "@/pages/ContractManagementPage/api/vendorApi";
import { Option } from "@/components/ui/multiselect";
import { cn } from "@/lib/utils";

type UploadedFilePayload = {
  name: string;
  url: string;
  type: string;
  size: string;
};

type DeliverablePersonnelOptionSource = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: Array<{ name?: string }> | { name?: string } | string;
};

type SubmitDeliverableFormValues = {
  description: string;
  files: File[] | null;
  responders: Option[];
};

const submitDeliverableSchema = yup.object({
  description: yup.string().required("Description is required"),
  files: yup.mixed().nullable().notRequired(),
  responders: yup
    .array()
    .of(
      yup.object({
        value: yup.string(),
        label: yup.string(),
      }),
    )
    .nullable()
    .notRequired(),
});

const getStatusTone = (status?: string) => {
  const normalized = status?.toLowerCase();
  if (normalized === "approved") {
    return "bg-[#EAF7EE] text-[#43A047]";
  }
  if (normalized === "rejected") {
    return "bg-[#FEECEC] text-[#E53935]";
  }
  if (normalized === "pending" || normalized === "under review") {
    return "bg-[#FFF8E1] text-[#F4B400]";
  }
  if (normalized === "late") {
    return "bg-[#FEECEC] text-[#E53935]";
  }
  return "bg-gray-100 text-gray-700";
};

// Guard against malformed/unparseable date strings from the backend.
// date-fns formatDate throws "RangeError: Invalid time value" on invalid dates.
const safeFormatDate = (value: string | undefined | null, fmt: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  return isValid(parsed) ? formatDate(parsed, fmt) : "-";
};

const excludedDeliverableResponderRoles = new Set(["vendor", "projectmanager", "pm"]);

const normalizeDeliverableResponderRole = (role?: string) =>
  (role ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");

const getDeliverableResponderRoles = (
  personnel: DeliverablePersonnelOptionSource,
): string[] => {
  if (Array.isArray(personnel.role)) {
    return personnel.role.map((role) => role?.name ?? "");
  }

  if (typeof personnel.role === "string") {
    return [personnel.role];
  }

  if (personnel.role?.name) {
    return [personnel.role.name];
  }

  return [];
};

export const buildDeliverableResponderOptions = (
  personnel: DeliverablePersonnelOptionSource[],
): Option[] =>
  personnel
    .filter((person) =>
      !getDeliverableResponderRoles(person).some((role) =>
        excludedDeliverableResponderRoles.has(
          normalizeDeliverableResponderRole(role),
        ),
      ),
    )
    .map((person) => ({
      value: person._id,
      label:
        person.firstName && person.lastName
          ? `${person.firstName} ${person.lastName}`
          : person.firstName || person.email || person._id,
    }));

export type DeliverableRow = {
  id: string;
  title: string;
  dueDate: string;
  date?: string;
  submissionStatus: "Submitted" | "Late" | "Pending";
  kpi: KPIDetail;
  status: "Approved" | "Rejected" | "Pending" | "Under Review" | "Late";
  approverStatus?: "N/A" | "pending" | "approved" | "rejected";
};

export interface KPIDetail {
  kpi: number;
  kpiDays: number;
  kpiText: string;
  kpiStatus: string;
}

type DeliverableDetailsSheetProps = {
  trigger: React.ReactNode;
  contractId: string;
  deliverableId: string;
  isApprover?: boolean;
  isContractManager?: boolean;
  basePath: string;
  listInvalidateQueryKey?: readonly unknown[];
  statsInvalidateQueryKey?: readonly unknown[];
  personnelPath?: string;
};

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

const UploadElement = () => (
  <div className="flex py-6 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#1F3B63] px-4 text-center">
    <UploadCloud className="h-12 w-12 text-[#1F3B63]" />
    <p className="mt-4 text-base font-semibold text-[#1F3B63]">
      Drag & Drop or Click to choose files
    </p>
    <p className="mt-2 text-sm text-[#6B6B6B]">
      Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
    </p>
  </div>
);

const FilesListItem = ({ file, index }: { file: File; index: number }) => {
  const { setValue } = useFormContext<SubmitDeliverableFormValues>();
  const value = useWatch({ name: "files" });

  return (
    <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-2">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF1FB]">
          <FileText className="h-5 w-5 text-[#1F3B63]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0F0F0F]">{file.name}</p>
          <p className="text-xs text-[#9CA3AF]">
            {getSimpleFileExtension(file.name).toUpperCase()} •{" "}
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center text-[#EF4444]"
        onClick={() => {
          const newFiles = (value ?? []).filter(
            (_: any, i: number) => i !== index,
          );
          setValue("files", newFiles.length > 0 ? newFiles : null, {
            shouldValidate: true,
          });
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const SubmitDeliverableDialog: React.FC<{
  trigger: React.ReactNode;
  contractId: string;
  deliverableId: string;
  basePath: string;
  listInvalidateQueryKey?: readonly unknown[];
  statsInvalidateQueryKey?: readonly unknown[];
  personnelPath?: string;
}> = ({
  trigger,
  contractId,
  deliverableId,
  basePath,
  listInvalidateQueryKey,
  statsInvalidateQueryKey,
  personnelPath,
}) => {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const { data: personnelData } = useQuery({
    queryKey: ["deliverable-personnel", contractId, personnelPath ?? "default"],
    queryFn: async () =>
      personnelPath
        ? getRequest({ url: personnelPath })
        : vendorApi.listPersonnel(contractId),
    enabled: !!contractId,
    staleTime: 60000,
  });

  const personnelOptions = React.useMemo<Option[]>(() => {
    const data = personnelData?.data?.data;
    if (!Array.isArray(data)) return [];
    return buildDeliverableResponderOptions(data);
  }, [personnelData]);

  const { control, reset } = useForge<SubmitDeliverableFormValues>({
    resolver: yupResolver(submitDeliverableSchema) as any,
    defaultValues: {
      description: "",
      files: null,
      responders: [],
    },
  });

  const { mutateAsync: uploadFile } = useMutation({
    mutationKey: ["upload-deliverable-file"],
    mutationFn: async (file: File) => {
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

      return uploadRes?.data?.data?.[0];
    },
  });

  const submitMutation = useMutation({
    mutationKey: ["submit-deliverable", contractId, deliverableId],
    mutationFn: async (data: SubmitDeliverableFormValues) => {
      let uploadedFiles: UploadedFilePayload[] = [];

      if (data.files && data.files.length > 0) {
        const uploadPromises = Array.from(data.files).map((file) =>
          uploadFile(file).then((uploaded) => ({
            name: uploaded?.name || file.name,
            url: uploaded?.url || "",
            type: uploaded?.type || file.type || "application/octet-stream",
            size: uploaded?.size || String(file.size),
          })),
        );

        uploadedFiles = await Promise.all(uploadPromises);
      }

      return postRequest({
        url: `${basePath}/${deliverableId}/submit`,
        payload: {
          description: data.description,
          files: uploadedFiles,
          responders: data.responders.map((r) => r.value),
        },
      });
    },
    onSuccess: () => {
      toast.success("Success", "Deliverable submitted successfully");
      queryClient.invalidateQueries({
        queryKey:
          listInvalidateQueryKey ?? ["deliverables", contractId, basePath],
      });
      queryClient.invalidateQueries({
        queryKey:
          statsInvalidateQueryKey ?? [
            "deliverables-stats",
            contractId,
            basePath,
          ],
      });
      queryClient.invalidateQueries({
        queryKey: ["deliverable-detail", contractId, deliverableId, basePath],
      });
      setOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(
        "Error",
        error?.response?.data?.message || "Failed to submit deliverable",
      );
    },
  });

  const onSubmit = async (data: SubmitDeliverableFormValues) => {
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync(data);
    } catch (error) {
      console.error("Error submitting deliverable:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isSubmitting) {
          setOpen(next);
          if (!next) reset();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-2xl p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-[#0F0F0F]">
              Submit Deliverable
            </DialogTitle>
          </div>
        </DialogHeader>

        <Forge control={control} onSubmit={onSubmit} className="space-y-6">
          <div className="">
            <Forger
              name="files"
              component={TextFileUploader}
              element={<UploadElement />}
              List={FilesListItem}
              accept={
                {
                  "application/pdf": [".pdf"],
                  "application/msword": [".doc"],
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                    [".docx"],
                  "application/vnd.ms-excel": [".xls"],
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                    [".xlsx"],
                  "application/zip": [".zip"],
                  "image/png": [".png"],
                  "image/jpeg": [".jpeg", ".jpg"],
                } as any
              }
            />
          </div>

          <div className="space-y-3">
            <Forger
              name="responders"
              label="Add Responders"
              component={TextMultiSelect}
              placeholder="Search and select responders"
              options={personnelOptions}
            />
          </div>

          <div className="space-y-3">
            <Forger
              name="description"
              label="Description"
              component={TextArea}
              placeholder="Enter deliverable description"
              rows={6}
            />
          </div>

          <div className="flex items-center justify-end gap-6">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] font-semibold text-[#0F0F0F]"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center rounded-xl bg-[#1F3B63] font-semibold text-white hover:bg-[#1F3B63]/95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Spinner className="h-5 w-5 text-white" />
                  <span>Submitting...</span>
                </div>
              ) : (
                "Submit Deliverable"
              )}
            </Button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

const DeliverableDetailsSheet: React.FC<DeliverableDetailsSheetProps> = ({
  trigger,
  contractId,
  deliverableId,
  isApprover,
  isContractManager,
  basePath,
  listInvalidateQueryKey,
  statsInvalidateQueryKey,
  personnelPath,
}) => {
  const [open, setOpen] = React.useState(false);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [selectedDoc, setSelectedDoc] = React.useState<{
    url: string;
    name: string;
  } | null>(null);
  const isVendor = basePath.includes("/vendor/");
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: useUserQueryKey(["deliverable-detail", contractId, deliverableId, basePath, open]),
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
  const approverStatus = detail?.approverStatus;
  const isSubmitted = detail?.submissionStatus === "submitted";
  // Backend doesn't always set `submissionStatus` — once the PM/vendor
  // uploads, the deliverable carries `submittedBy` and a non-empty
  // `files[]` instead. Treat that combo as "already submitted" so the
  // Submit button doesn't re-appear after the first upload.
  const hasBeenSubmitted =
    Boolean(detail?.submittedBy) &&
    Array.isArray(detail?.files) &&
    detail.files.length > 0;
  // Approve/Reject visibility is gated on `approverStatus === "pending"`
  // for both the approver and the contract manager. Once the deliverable
  // transitions out of pending the buttons hide for everyone.
  const canShowApproveButtons =
    (isApprover || isContractManager) &&
    approverStatus === "pending" &&
    !isSubmitted;
  const canShowSubmitButton =
    isVendor &&
    !isSubmitted &&
    !hasBeenSubmitted &&
    approverStatus !== "N/A";

  // Approve / reject opens a comment dialog first. `pendingAction` drives
  // both the dialog visibility and which variant (Approve vs Reject) we
  // render — `commentDraft` is reset whenever the dialog closes.
  const [pendingAction, setPendingAction] = React.useState<
    "approved" | "rejected" | null
  >(null);
  const [commentDraft, setCommentDraft] = React.useState("");

  React.useEffect(() => {
    if (pendingAction === null) setCommentDraft("");
  }, [pendingAction]);

  const approveRejectMutation = useMutation({
    mutationKey: [
      "approve-reject-deliverable",
      contractId,
      deliverableId,
      basePath,
    ],
    mutationFn: async ({
      action,
      comment,
    }: {
      action: "approved" | "rejected";
      comment: string;
    }) =>
      postRequest({
        url: `${basePath}/${deliverableId}/approve`,
        payload: { action, comment },
      }),
    onSuccess: (_, { action }) => {
      toast.success(
        "Success",
        `Deliverable ${action === "approved" ? "approved" : "rejected"} successfully`,
      );
      queryClient.invalidateQueries({
        queryKey:
          listInvalidateQueryKey ?? ["deliverables", contractId, basePath],
      });
      queryClient.invalidateQueries({
        queryKey:
          statsInvalidateQueryKey ?? [
            "deliverables-stats",
            contractId,
            basePath,
          ],
      });
      queryClient.invalidateQueries({
        queryKey: ["deliverable-detail", contractId, deliverableId, basePath],
      });
      setPendingAction(null);
    },
    onError: (error: any, { action }) => {
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
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827] dark:text-slate-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <SheetTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
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

          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                {detail?.name ?? "Deliverable Details"}
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F] dark:text-slate-100"
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
              <div className="grid gap-6 sm:grid-cols-2 mt-5">
                <LabelRow
                  label="Deliverable Title"
                  value={detail?.name ?? "-"}
                />
                <LabelRow
                  label="Due Date"
                  value={safeFormatDate(detail?.dueDate, "dd MMM yyyy")}
                />
                <LabelRow
                  label="Submission Date"
                  value={safeFormatDate(detail?.submissionDate, "dd MMM yyyy")}
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">Status</div>
              <div
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(detail?.status)}`}
              >
                {detail?.status
                  ? detail.status
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c: string) => c.toUpperCase())
                  : ""}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
                Description
              </div>
              <div className="text-sm text-[#374151] dark:text-slate-300">
                {detail?.description ?? "-"}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
              Attached Documents
            </div>
            <div className="grid gap-3 sm:grid-cols-1">
              {(detail?.files ?? []).map((f: any, idx: number) => (
                <DocumentItem
                  key={idx}
                  d={{
                    id: `${f?.name ?? "file"}-${idx}`,
                    name: f?.name ?? "File",
                    type: f?.type ?? "DOC",
                    size:
                      typeof f?.size === "string"
                        ? f.size
                        : String(f?.size ?? ""),
                    url: f?.url,
                    icon: getFileIcon(f?.type ?? "DOC"),
                  }}
                  handlePreview={(doc) => {
                    if (doc.url) {
                      setSelectedDoc({ url: doc.url, name: doc.name });
                      setViewerOpen(true);
                    }
                  }}
                  handleDownload={(doc) => {
                    if (!doc.url) return;
                    const a = window.document.createElement("a");
                    a.href = doc.url;
                    a.download = doc.name;
                    window.document.body.appendChild(a);
                    a.click();
                    window.document.body.removeChild(a);
                  }}
                />
              ))}
            </div>
          </div>

          {selectedDoc && (
            <DocumentViewer
              isOpen={viewerOpen}
              onClose={() => setViewerOpen(false)}
              fileUrl={selectedDoc.url}
              fileName={selectedDoc.name}
            />
          )}

          <div className="flex gap-3 pt-6 justify-end">
            {(isApprover || isContractManager) && canShowApproveButtons ? (
              <>
                <Button
                  variant="outline"
                  className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827] dark:text-slate-100"
                  disabled={approveRejectMutation.isPending}
                  onClick={() => setPendingAction("rejected")}
                >
                  Reject
                </Button>
                <Button
                  className="h-11 flex-1 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white"
                  disabled={approveRejectMutation.isPending}
                  onClick={() => setPendingAction("approved")}
                >
                  Approve
                </Button>
              </>
            ) : canShowSubmitButton && !isLoading ? (
              <SubmitDeliverableDialog
                contractId={contractId}
                deliverableId={deliverableId}
                basePath={basePath}
                listInvalidateQueryKey={listInvalidateQueryKey}
                statsInvalidateQueryKey={statsInvalidateQueryKey}
                personnelPath={personnelPath}
                trigger={
                  <Button className="h-11 w-64 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white">
                    Submit
                  </Button>
                }
              />
            ) : null}
          </div>
        </div>

        <Dialog
          open={pendingAction !== null}
          onOpenChange={(next) => {
            if (!next && !approveRejectMutation.isPending) {
              setPendingAction(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                {pendingAction === "approved"
                  ? "Approve Deliverable"
                  : "Reject Deliverable"}
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-4">
              <p className="text-sm text-[#6B7280] dark:text-slate-400">
                {pendingAction === "approved"
                  ? "Add an optional comment for the vendor before approving."
                  : "Let the vendor know why this deliverable is being rejected."}
              </p>
              <textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Enter your comment"
                rows={5}
                className="w-full resize-none rounded-lg border border-[#E5E7EB] bg-white p-3 text-sm text-[#0F0F0F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2A4467] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                autoFocus
              />
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827] dark:text-slate-100"
                  disabled={approveRejectMutation.isPending}
                  onClick={() => setPendingAction(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className={cn(
                    "h-11 flex-1 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed",
                    pendingAction === "approved"
                      ? "bg-[#16A34A] hover:bg-[#15803D]"
                      : "bg-[#E53935] hover:bg-[#C62828]",
                  )}
                  disabled={approveRejectMutation.isPending}
                  aria-busy={approveRejectMutation.isPending}
                  onClick={() => {
                    if (pendingAction === null) return;
                    approveRejectMutation.mutate({
                      action: pendingAction,
                      comment: commentDraft.trim(),
                    });
                  }}
                >
                  {approveRejectMutation.isPending
                    ? pendingAction === "approved"
                      ? "Approving..."
                      : "Rejecting..."
                    : pendingAction === "approved"
                      ? "Approve"
                      : "Confirm Reject"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
      <div className="max-w-[260px] text-sm text-slate-700 dark:text-slate-300">
        {getValue<string>()}
      </div>
    ),
  },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
        <p>
          <span className="text-slate-500 dark:text-slate-400">Due Date:&nbsp;</span>
          <span className="text-slate-900 dark:text-slate-100">
            {safeFormatDate(row.original.dueDate, "yyyy MMM dd")}
          </span>
        </p>
        {/* {row.original.submissionDate && <p>
          <span className="text-slate-500">Submission Date:&nbsp;</span>
          <span className="text-slate-900">
            {row.original.submissionDate ? formatDate(row.original.submissionDate ?? "", "yyyy MMM dd") : "-"}
          </span>
        </p>} */}
      </div>
    ),
  },
  { accessorKey: "submissionStatus", header: "Submission Status" },
  {
    accessorKey: "kpi",
    header: "KPI",
    cell: ({ row }) => (
      <div className="text-sm text-slate-700 dark:text-slate-300">{row.original.kpi?.kpiText ?? "-"}</div>
    ),
  },
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
            : s === "Late"
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
      const meta = table.options.meta as any;
      const contractId: string = meta?.contractId ?? "";
      const basePath: string = meta?.basePath ?? "";
      return (
        <div className="text-right">
          <DeliverableDetailsSheet
            contractId={contractId}
            deliverableId={row.original.id}
            isApprover={meta?.isApprover}
            isContractManager={meta?.isContractManager}
            basePath={basePath}
            listInvalidateQueryKey={meta?.listInvalidateQueryKey}
            statsInvalidateQueryKey={meta?.statsInvalidateQueryKey}
            personnelPath={meta?.personnelPath}
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
  isContractManager?: boolean;
  basePath: string;
  listInvalidateQueryKey?: readonly unknown[];
  statsInvalidateQueryKey?: readonly unknown[];
  personnelPath?: string;
};

const DeliverablesTable: React.FC<DeliverablesTableProps> = ({
  rows,
  isLoading,
  contractId,
  isApprover = false,
  isContractManager = false,
  basePath,
  listInvalidateQueryKey,
  statsInvalidateQueryKey,
  personnelPath,
}) => {
  const [search, setSearch] = React.useState("");

  const filteredRows = React.useMemo(() => {
    const src = Array.isArray(rows) ? rows : [];
    const q = search.trim().toLowerCase();
    if (!q) return src;
    return src.filter((row) =>
      [
        row.id,
        row.title,
        row.date,
        row.submissionStatus,
        row.status,
        row.kpi?.kpiText,
      ]
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
          <div className="flex items-center w-full gap-3 border-b border-[#E5E7EB] dark:border-slate-800 px-5 py-4">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
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
          meta: {
            contractId,
            isApprover,
            isContractManager,
            basePath,
            listInvalidateQueryKey,
            statsInvalidateQueryKey,
            personnelPath,
          },
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

export default DeliverablesTable;
