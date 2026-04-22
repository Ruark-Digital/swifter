import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/layouts/DataTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
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
import { Forge, Forger, useForge } from "@/lib/forge";
import {
  TextArea,
  TextDatePicker,
  TextFileUploader,
  TextInput,
} from "@/components/layouts/FormInputs";
import { FileUploaderItem } from "@/components/ui/file-upload";
import { Check, CloudUpload, Search, Share2, X } from "lucide-react";
import { useWatch } from "react-hook-form";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useToastHandler } from "@/hooks/useToaster";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import {
  formatFileSize,
  getFileExtension,
  getFileIcon,
  getSimpleFileExtension,
} from "@/lib/fileUtils";
import { cn, formatDateTZ } from "@/lib/utils";
import type { ApiResponse, ApiResponseError, ContractRfis } from "@/types";
import type {
  ContractRfiDTO,
  ContractRFIDetailDTO,
  ContractRfiResponseDTO,
  ManagerListRfisQuery,
} from "@/pages/ContractManagementPage/api/contractManagerApi";
import type { UploadURLs } from "@/pages/ContractManagementPage/lib/contractChanges";
import RfiStatsCards from "@/pages/ContractManagementPage/components/RfiStatsCards";

type Props = {
  contractId: string;
  isActive?: boolean;
  actionsDisabled?: boolean;
};

type FilterTab = "all" | "issued" | "received";

type Row = {
  id: string;
  rfiId: string;
  title: string;
  type: string;
  status: string;
  raw: ContractRfis;
};

type IssueRfiDialogProps = {
  trigger: React.ReactNode;
  contractId: string;
  createPath: string;
  invalidateQueryKey: readonly unknown[];
};

type RfiDetailsSheetProps = {
  trigger: React.ReactNode;
  contractId: string;
  rfiId: string;
  basePath: string;
  fallback?: ContractRfis;
};

type RespondToRfiDialogProps = {
  trigger: React.ReactNode;
  contractId: string;
  rfiId: string;
  responsePath: string;
  invalidateQueryKey: readonly unknown[];
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

const formatDate = (value?: string | Date) => formatDateTZ(value, "MMMM dd, yyyy");

const statusTone = (status?: string) => {
  const normalized = status?.toLowerCase();
  if (normalized === "open") return "bg-[#EAF7EE] text-[#43A047]";
  if (normalized === "closed") return "bg-[#FEECEC] text-[#E53935]";
  return "bg-slate-100 text-slate-700";
};

const IssueRfiDialog: React.FC<IssueRfiDialogProps> = ({
  trigger,
  contractId,
  createPath,
  invalidateQueryKey,
}) => {
  const queryClient = useQueryClient();
  const toastHandler = useToastHandler();
  const { control, reset } = useForge({
    defaultValues: {
      rfiTitle: "",
      responseDeadline: undefined,
      question: "",
      files: null,
    },
  });
  const [isSuccess, setIsSuccess] = React.useState(false);
  const files = useWatch({ control, name: "files" }) as File[] | null;

  const { mutateAsync: uploadFile, isPending: isUploadingFiles } = useMutation<
    ApiResponse<UploadURLs[]>,
    ApiResponseError,
    { file: File }
  >({
    mutationKey: ["uploadMsaRfiFile"],
    mutationFn: async ({ file }) => {
      const formData = new FormData();
      formData.append("file", file);
      return await postRequest({
        url: "/upload",
        payload: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      });
    },
  });

  const createMutation = useMutation({
    mutationKey: ["msaRfi", "create", contractId, createPath],
    mutationFn: async (payload: ContractRfiDTO) => {
      const res = await postRequest({
        url: createPath,
        payload,
      });
      return res.data;
    },
    onSuccess: async () => {
      setIsSuccess(true);
      reset();
      toastHandler.success("RFI", "RFI issued successfully");
      await queryClient.invalidateQueries({ queryKey: invalidateQueryKey });
    },
    onError: (error) => {
      toastHandler.error("RFI", error as ApiResponseError);
    },
  });

  const isSubmitting = createMutation.isPending || isUploadingFiles;
  const fileCount = files?.length ?? 0;

  const handleSubmit = async (data: {
    rfiTitle: string;
    responseDeadline?: Date;
    question: string;
    files: File[] | null;
  }) => {
    const payload: ContractRfiDTO = {
      title: data.rfiTitle,
      description: data.question,
      deadline: data.responseDeadline ? data.responseDeadline.toISOString() : undefined,
    };

    if (data.files?.length) {
      try {
        const uploadedItems = await Promise.all(
          data.files.map(async (file) => {
            const res = await uploadFile({ file });
            const firstUploaded = res.data?.data?.[0];
            if (!firstUploaded?.url) return undefined;
            return {
              name: firstUploaded.name || file.name,
              url: firstUploaded.url,
              type: firstUploaded.type || file.type,
              size: firstUploaded.size || file.size.toString(),
            };
          }),
        );

        const filesPayload = uploadedItems.filter(
          (
            item,
          ): item is { name: string; url: string; type: string; size: string } =>
            Boolean(item),
        );
        if (filesPayload.length) payload.files = filesPayload;
      } catch (error) {
        toastHandler.error("Upload Failed", error as ApiResponseError);
        return;
      }
    }

    try {
      await createMutation.mutateAsync(payload);
    } catch {
      return;
    }
  };

  const FileListItem = ({ file, index }: { file: File; index?: number }) => {
    const extension = getSimpleFileExtension(file.name).toUpperCase();
    return (
      <FileUploaderItem
        index={index ?? 0}
        className="h-auto w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
      >
        <div className="flex items-center gap-3 w-full">
          <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
            {getFileIcon(extension)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
            <p className="text-xs text-slate-500">
              {extension || "FILE"} • {formatFileSize(file.size)}
            </p>
          </div>
        </div>
      </FileUploaderItem>
    );
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setIsSuccess(false);
          reset();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        {isSuccess ? (
          <div className="flex flex-col items-center gap-6 px-8 py-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#22C55E] text-[#22C55E]">
              <Check className="h-8 w-8" />
            </div>
            <div className="text-base font-semibold text-[#0F0F0F]">
              RFI Issued Successfully
            </div>
            <div className="flex w-full items-center gap-4">
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F]"
                >
                  Close
                </button>
              </DialogClose>
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#2A4467] text-base font-semibold text-white"
                >
                  Done
                </button>
              </DialogClose>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-8 pt-8">
              <DialogTitle className="text-xl font-semibold text-[#0F0F0F]">
                Issue RFI
              </DialogTitle>
            </div>
            <div className="px-8 pb-8 pt-6">
              <Forge control={control} onSubmit={handleSubmit} className="space-y-5">
                <Forger
                  name="rfiTitle"
                  label="RFI Title"
                  placeholder="Enter Title"
                  component={TextInput}
                />
                <Forger
                  name="responseDeadline"
                  label="Response Deadline"
                  placeholder="Enter Date"
                  component={TextDatePicker}
                />
                <Forger
                  name="question"
                  label="Question / Description"
                  placeholder="Enter Detail"
                  component={TextArea}
                  rows={5}
                />
                <div className="space-y-2">
                  <Forger
                    name="files"
                    label="Upload Files"
                    component={TextFileUploader}
                    element={
                      <div className="flex flex-col items-center gap-3 py-6">
                        <CloudUpload className="h-12 w-12 text-[#2A4467]" />
                        <div className="space-y-1 text-center">
                          <p className="text-base font-semibold text-[#2A4467]">
                            Drag & Drop or Click to choose files
                          </p>
                          <p className="text-sm text-[#6B7280]">
                            Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
                          </p>
                        </div>
                      </div>
                    }
                    List={FileListItem}
                    className="rounded-xl border border-dashed border-[#2A4467]"
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
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {fileCount > 0
                        ? `${fileCount} file${fileCount === 1 ? "" : "s"} ready to upload`
                        : "Files will upload when you submit"}
                    </span>
                    {isUploadingFiles ? <span>Uploading...</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 flex-1 rounded-xl border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] hover:bg-[#E5E7EB]"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    className="h-12 flex-1 rounded-xl bg-[#2A4467] text-base font-semibold text-white hover:bg-[#1f3552]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Issuing..." : "Issue RFI"}
                  </Button>
                </div>
              </Forge>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const RfiDetailsSheet: React.FC<RfiDetailsSheetProps> = ({
  trigger,
  contractId,
  rfiId,
  basePath,
  fallback,
}) => {
  const [open, setOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["msaRfiDetail", contractId, rfiId, basePath],
    queryFn: async () => {
      const response = await getRequest({
        url: `${basePath}/${rfiId}`,
      });
      return response.data as { data?: ContractRFIDetailDTO | { contractRfi?: ContractRfis } };
    },
    enabled: open && Boolean(contractId) && Boolean(rfiId),
  });

  const detail = (data?.data as any)?.contractRfi ?? (data?.data as any) ?? fallback;

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
              <SheetTitle className="text-base font-semibold text-[#0F0F0F]">
                RFI
              </SheetTitle>
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
                <div className="text-xs font-medium text-[#9CA3AF]">RFI Details</div>
                <div className="text-base font-semibold text-[#0F0F0F]">
                  {isLoading ? "Loading..." : detail?.rfiId || detail?._id || rfiId}
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                  statusTone(detail?.status),
                )}
              >
                {detail?.status || "-"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <LabelRow
                label="RFI ID"
                value={isLoading ? "Loading..." : detail?.rfiId || detail?._id || "-"}
              />
              <LabelRow label="Type" value={isLoading ? "Loading..." : detail?.type || "-"} />
              <LabelRow
                label="Submission Date"
                value={isLoading ? "Loading..." : formatDate(detail?.createdAt)}
              />
              <LabelRow
                label="Response Deadline"
                value={isLoading ? "Loading..." : formatDate(detail?.deadline)}
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF]">Title</div>
              <div className="text-sm text-[#374151]">
                {isLoading ? "Loading..." : detail?.title || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF]">Question / Description</div>
              <div className="text-sm text-[#374151]">
                {isLoading ? "Loading..." : detail?.description || "-"}
              </div>
            </div>
            {Array.isArray(detail?.files) && detail.files.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-medium text-[#9CA3AF]">Attachments</div>
                <div className="space-y-2">
                  {detail.files.map((file: any, index: number) => {
                    const ext = getFileExtension(file?.name || "", file?.type || "");
                    return (
                      <div
                        key={`${file?.name || "attachment"}-${index}`}
                        className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700">
                            {ext}
                          </div>
                          <div className="text-sm text-slate-700">{file?.name || "Attachment"}</div>
                        </div>
                        {file?.url ? (
                          <Button
                            variant="link"
                            className="h-auto p-0 text-[#43A047] font-semibold"
                            onClick={() => window.open(file.url, "_blank", "noopener,noreferrer")}
                          >
                            Open
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const RespondToRfiDialog: React.FC<RespondToRfiDialogProps> = ({
  trigger,
  contractId,
  rfiId,
  responsePath,
  invalidateQueryKey,
}) => {
  const queryClient = useQueryClient();
  const toastHandler = useToastHandler();
  const { control, reset } = useForge({
    defaultValues: {
      response: "",
      files: null,
    },
  });
  const files = useWatch({ control, name: "files" }) as File[] | null;

  const { mutateAsync: uploadFile, isPending: isUploadingFiles } = useMutation<
    ApiResponse<UploadURLs[]>,
    ApiResponseError,
    { file: File }
  >({
    mutationKey: ["uploadMsaRfiResponseFile"],
    mutationFn: async ({ file }) => {
      const formData = new FormData();
      formData.append("file", file);
      return await postRequest({
        url: "/upload",
        payload: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      });
    },
  });

  const respondMutation = useMutation({
    mutationKey: ["msaRfi", "response", contractId, rfiId, responsePath],
    mutationFn: async (payload: ContractRfiResponseDTO) => {
      const response = await postRequest({
        url: `${responsePath}/${rfiId}/response`,
        payload,
      });
      return response.data;
    },
    onSuccess: async () => {
      toastHandler.success("RFI", "Response submitted successfully");
      await queryClient.invalidateQueries({ queryKey: invalidateQueryKey });
      await queryClient.invalidateQueries({
        queryKey: ["msaRfiDetail", contractId, rfiId, responsePath],
      });
      reset();
    },
    onError: (error) => {
      toastHandler.error("RFI", error as ApiResponseError);
    },
  });

  const isSubmitting = respondMutation.isPending || isUploadingFiles;
  const fileCount = files?.length ?? 0;

  const handleSubmit = async (data: { response: string; files: File[] | null }) => {
    const payload: ContractRfiResponseDTO = {
      description: data.response,
    };

    if (data.files?.length) {
      try {
        const uploadedItems = await Promise.all(
          data.files.map(async (file) => {
            const res = await uploadFile({ file });
            const firstUploaded = res.data?.data?.[0];
            if (!firstUploaded?.url) return undefined;
            return {
              name: firstUploaded.name || file.name,
              url: firstUploaded.url,
              type: firstUploaded.type || file.type,
              size: firstUploaded.size || file.size.toString(),
            };
          }),
        );

        const filesPayload = uploadedItems.filter(
          (
            item,
          ): item is { name: string; url: string; type: string; size: string } =>
            Boolean(item),
        );
        if (filesPayload.length) payload.files = filesPayload;
      } catch (error) {
        toastHandler.error("Upload Failed", error as ApiResponseError);
        return;
      }
    }

    try {
      await respondMutation.mutateAsync(payload);
    } catch {
      return;
    }
  };

  const FileListItem = ({ file, index }: { file: File; index?: number }) => {
    const extension = getSimpleFileExtension(file.name).toUpperCase();
    return (
      <FileUploaderItem
        index={index ?? 0}
        className="h-auto w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
      >
        <div className="flex items-center gap-3 w-full">
          <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
            {getFileIcon(extension)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
            <p className="text-xs text-slate-500">
              {extension || "FILE"} • {formatFileSize(file.size)}
            </p>
          </div>
        </div>
      </FileUploaderItem>
    );
  };

  return (
    <Dialog onOpenChange={(open) => !open && reset()}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <div className="flex items-center justify-between px-8 pt-8">
          <DialogTitle className="text-xl font-semibold text-[#0F0F0F]">
            Respond to RFI
          </DialogTitle>
        </div>
        <div className="px-8 pb-8 pt-6">
          <Forge control={control} onSubmit={handleSubmit} className="space-y-5">
            <Forger
              name="response"
              label="Response"
              placeholder="Enter response"
              component={TextArea}
              rows={5}
            />
            <div className="space-y-2">
              <Forger
                name="files"
                label="Upload Files"
                component={TextFileUploader}
                element={
                  <div className="flex flex-col items-center gap-3 py-6">
                    <CloudUpload className="h-12 w-12 text-[#2A4467]" />
                    <div className="space-y-1 text-center">
                      <p className="text-base font-semibold text-[#2A4467]">
                        Drag & Drop or Click to choose files
                      </p>
                    </div>
                  </div>
                }
                List={FileListItem}
                className="rounded-xl border border-dashed border-[#2A4467]"
                accept={
                  {
                    "application/pdf": [".pdf"],
                    "application/msword": [".doc"],
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                      [".docx"],
                    "application/vnd.ms-excel": [".xls"],
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
                      ".xlsx",
                    ],
                    "application/zip": [".zip"],
                    "image/png": [".png"],
                    "image/jpeg": [".jpeg", ".jpg"],
                  } as any
                }
              />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {fileCount > 0
                    ? `${fileCount} file${fileCount === 1 ? "" : "s"} ready to upload`
                    : "Files will upload when you submit"}
                </span>
                {isUploadingFiles ? <span>Uploading...</span> : null}
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex-1 rounded-xl border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] hover:bg-[#E5E7EB]"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="h-12 flex-1 rounded-xl bg-[#2A4467] text-base font-semibold text-white hover:bg-[#1f3552]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Response"}
              </Button>
            </div>
          </Forge>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Rfi: React.FC<Props> = ({ contractId, isActive, actionsDisabled }) => {
  const { isManager, isApprover, isVendor, isAdmin, isViewOnly } = useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<{ stats?: unknown; list?: unknown }>({});
  const [search, setSearch] = React.useState("");
  const [filterTab, setFilterTab] = React.useState<FilterTab>("all");

  const basePath = React.useMemo(() => {
    if (isManager || isAdmin) return `/contract/manager/msa-contract/${contractId}/rfi`;
    if (isApprover) return `/contract/approver/msa-contract/${contractId}/rfi`;
    if (isVendor) return `/contract/vendor/msa-contract/${contractId}/rfi`;
    if (isViewOnly) return `/contract/user/msa-contract/${contractId}/rfi`;
    return `/contract/user/msa-contract/${contractId}/rfi`;
  }, [contractId, isAdmin, isApprover, isManager, isVendor, isViewOnly]);

  const statsPath = `${basePath}/stats`;
  const listQueryKey = useUserQueryKey(["msa-rfi-list", contractId, basePath]);
  const statsQueryKey = useUserQueryKey(["msa-rfi-stats", contractId, statsPath]);

  const { data: listRes, isLoading: isListLoading, error: listError } = useQuery({
    queryKey: listQueryKey,
    queryFn: async () => {
      const query: ManagerListRfisQuery = { page: 1, limit: 10 };
      const params = new URLSearchParams();
      if (query.page) params.append("page", String(query.page));
      if (query.limit) params.append("limit", String(query.limit));
      const response = await getRequest({ url: `${basePath}?${params.toString()}` });
      return response.data as {
        data?: {
          contractRfis?: ContractRfis[];
          reports?: ContractRfis[];
          total?: number;
        };
      };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const { data: statsRes, isLoading: isStatsLoading, error: statsError } = useQuery({
    queryKey: statsQueryKey,
    queryFn: async () => {
      const response = await getRequest({ url: statsPath });
      return response.data as { data?: { all?: number; issue?: number; receive?: number } };
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
    toastErrorRef.current("MSA RFI Stats", statsError as ApiResponseError);
  }, [statsError]);

  React.useEffect(() => {
    if (!listError) return;
    if (lastErrorRef.current.list === listError) return;
    lastErrorRef.current.list = listError;
    toastErrorRef.current("MSA RFI", listError as ApiResponseError);
  }, [listError]);

  const sourceRows = React.useMemo(() => {
    const payload = listRes as any;
    if (Array.isArray(payload?.data?.contractRfis)) return payload.data.contractRfis as ContractRfis[];
    if (Array.isArray(payload?.data?.reports)) return payload.data.reports as ContractRfis[];
    if (Array.isArray(payload?.data)) return payload.data as ContractRfis[];
    return [];
  }, [listRes]);

  const mappedRows = React.useMemo<Row[]>(
    () =>
      sourceRows.map((item) => {
        const raw = item as any;
        return {
          id: raw?._id || raw?.rfiId || "-",
          rfiId: raw?.rfiId || raw?._id || "-",
          title: raw?.title || "-",
          type: raw?.type || "-",
          status: raw?.status || "-",
          raw: item,
        };
      }),
    [sourceRows],
  );

  const searchedRows = React.useMemo(() => {
    if (!search.trim()) return mappedRows;
    const q = search.toLowerCase();
    return mappedRows.filter(
      (row) =>
        row.rfiId.toLowerCase().includes(q) ||
        row.title.toLowerCase().includes(q) ||
        row.type.toLowerCase().includes(q),
    );
  }, [mappedRows, search]);

  const filteredRows = React.useMemo(() => {
    if (filterTab === "issued") {
      return searchedRows.filter((row) => row.type.toLowerCase() === "issue");
    }
    if (filterTab === "received") {
      return searchedRows.filter((row) => row.type.toLowerCase() === "received");
    }
    return searchedRows;
  }, [filterTab, searchedRows]);

  const columns = React.useMemo<ColumnDef<Row>[]>(
    () => [
      { accessorKey: "rfiId", header: "RFI ID" },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ getValue }) => (
          <div className="max-w-[280px] text-sm text-slate-700">{getValue<string>() || "-"}</div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ getValue }) => {
          const type = getValue<string>() || "-";
          return (
            <span className="text-slate-900 font-semibold">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue<string>() || "-";
          return (
            <Badge
              variant="secondary"
              className={cn(
                "rounded-full border-none px-4 py-1 font-semibold",
                statusTone(status),
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const isReceived = row.original.type.toLowerCase() === "received";
          if (isReceived && !isViewOnly) {
            return (
              <div className="text-right">
                <RespondToRfiDialog
                  contractId={contractId}
                  rfiId={row.original.id}
                  responsePath={basePath}
                  invalidateQueryKey={listQueryKey}
                  trigger={
                    <Button
                      variant="link"
                      className="h-auto p-0 font-semibold text-[#43A047] hover:no-underline"
                    >
                      Respond
                    </Button>
                  }
                />
              </div>
            );
          }
          return (
            <div className="text-right">
              <RfiDetailsSheet
                contractId={contractId}
                rfiId={row.original.id}
                basePath={basePath}
                fallback={row.original.raw}
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
          );
        },
      },
    ],
    [basePath, contractId, isViewOnly, listQueryKey],
  );

  const stats = (statsRes as any)?.data ?? {};
  const totalCount =
    typeof (listRes as any)?.data?.total === "number"
      ? (listRes as any).data.total
      : mappedRows.length;
  const all = stats?.all ?? stats?.total ?? totalCount;
  const issued = stats?.issue ?? 0;
  const received = stats?.receive ?? 0;

  const canCreate = !isViewOnly;

  return (
    <TabsContent value="rfi" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-[#0F0F0F]">
          RFI
        </h3>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="h-12 rounded-xl border-[#E5E7EB] px-5 text-base font-semibold text-[#0F0F0F]"
          >
            <Share2 className="mr-2 h-5 w-5" />
            Export Report
          </Button>
          {canCreate ? (
            <IssueRfiDialog
              contractId={contractId}
              createPath={basePath}
              invalidateQueryKey={listQueryKey}
              trigger={
                <Button
                  className="h-12 rounded-xl bg-[#2A4467] px-5 text-base font-semibold text-white hover:bg-[#2A4467]/90"
                  disabled={!!actionsDisabled}
                >
                  Issue RFI
                </Button>
              }
            />
          ) : null}
        </div>
      </div>

      <RfiStatsCards all={all} issued={issued} received={received} isLoading={isStatsLoading} />

      <Tabs
        value={filterTab}
        onValueChange={(value) => setFilterTab(value as FilterTab)}
        className="w-full bg-transparent space-y-4"
      >
        <TabsList className="bg-[#F2F4F7] p-1 rounded-full w-fit">
          <TabsTrigger
            value="all"
            className="rounded-full px-4 py-2 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            All RFI
          </TabsTrigger>
          <TabsTrigger
            value="issued"
            className="rounded-full px-4 py-2 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Issued
          </TabsTrigger>
          <TabsTrigger
            value="received"
            className="rounded-full px-4 py-2 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Received
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable<Row>
        data={filteredRows}
        columns={columns}
        options={{
          disableSelection: true,
          disablePagination: true,
          isLoading: isListLoading,
        }}
        header={() => (
          <div className="flex items-center gap-4 border-b border-[#E9E9EB] px-6 py-4">
            <div className="text-base font-semibold text-[#0F0F0F]">RFI</div>
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
        emptyPlaceholder={
          <div className="px-6 py-8 text-sm text-slate-500">No RFI found.</div>
        }
      />
    </TabsContent>
  );
};

export default Rfi;
