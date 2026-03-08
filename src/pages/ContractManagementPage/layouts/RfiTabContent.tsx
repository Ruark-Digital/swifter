import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Forge, Forger, useForge } from "@/lib/forge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import type { ApiResponse, ApiResponseError } from "@/types";
import {
  TextArea,
  TextDatePicker,
  TextFileUploader,
  TextInput,
} from "@/components/layouts/FormInputs";
import { Check, CloudUpload, Share2, X } from "lucide-react";
import RfiStatsCards from "../components/RfiStatsCards";
import RfiTable from "../components/RfiTable";
import {
  type ContractRfiDTO,
  type ManagerListRfisQuery,
} from "../api/contractManagerApi";
import type { UploadURLs } from "../lib/contractChanges";
import { useToastHandler } from "@/hooks/useToaster";
import { FileUploaderItem } from "@/components/ui/file-upload";
import { formatFileSize, getFileIcon, getSimpleFileExtension } from "@/lib/fileUtils";
import { useWatch } from "react-hook-form";
import { useUserRole } from "@/hooks/useUserRole";

type IssueRfiDialogProps = {
  trigger: React.ReactNode;
  contractId: string;
  basePath: string;
};

const IssueRfiDialog: React.FC<IssueRfiDialogProps> = ({
  trigger,
  contractId,
  basePath,
}) => {
  const queryClient = useQueryClient();
  const toastHandler = useToastHandler();
  const { isViewOnly } = useUserRole();
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
    mutationKey: ["uploadContractRfiFile"],
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
    mutationKey: [
      "contractRfis",
      "create",
      contractId,
      basePath
    ],
    mutationFn: async (payload: ContractRfiDTO) => {
      if (isViewOnly) {
        throw new Error("View-only users cannot issue RFIs");
      }
      const res = await postRequest({
        url: basePath,
        payload
      });
      return res.data;
    },
    onSuccess: async () => {
      setIsSuccess(true);
      reset();
      toastHandler.success("RFI", "RFI issued successfully");
      await queryClient.invalidateQueries({
        queryKey: [
          "contractRfis",
          contractId,
        ],
      });
    },
    onError: (error: ApiResponseError) => {
      toastHandler.error("RFI", error);
    },
  });

  const handleSubmit = async (data: {
    rfiTitle: string;
    responseDeadline?: Date;
    question: string;
    files: File[] | null;
  }) => {
    const payload: ContractRfiDTO = {
      title: data.rfiTitle,
      description: data.question,
      deadline: data.responseDeadline
        ? data.responseDeadline.toISOString()
        : undefined,
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
        if (filesPayload.length) {
          payload.files = filesPayload;
        }
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
            <p className="text-sm font-medium text-slate-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-slate-500">
              {extension || "FILE"} • {formatFileSize(file.size)}
            </p>
          </div>
        </div>
      </FileUploaderItem>
    );
  };

  const isSubmitting = createMutation.isPending || isUploadingFiles;
  const fileCount = files?.length ?? 0;

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
              <DialogClose asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FCA5A5] text-[#EF4444]"
                >
                  <X className="h-4 w-4" />
                </button>
              </DialogClose>
            </div>
            <div className="px-8 pb-8 pt-6">
              <Forge
                control={control}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <Forger
                  name="rfiTitle"
                  label="RFI Title"
                  placeholder="Enter Title"
                  component={TextInput}
                />
                <Forger
                  name="responseDeadline"
                  label="Response Deadline"
                  placeholder="Enter Title"
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
                            Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG,
                            JPEG
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

type Props = {
  contractId: string;
  isActive?: boolean;
  actionsDisabled?: boolean;
};

const RfiTabContent: React.FC<Props> = ({ contractId, isActive, actionsDisabled }) => {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const { isApprover, isVendor, isViewOnly, isManager, isAdmin } = useUserRole();

  const getBasePath = () => {
    if (isVendor) return `/contract/vendor/contracts/${contractId}/rfi`;
    if (isApprover) return `/contract/approver/contracts/${contractId}/rfi`;
    if (isManager) return `/contract/manager/contracts/${contractId}/rfis`;
    if (isAdmin || isViewOnly) return `/contract/user/contracts/${contractId}/rfi`;
    return `/contract/user/contracts/${contractId}/rfi`; // Default fallback
  };

  const basePath = getBasePath();

  const { data: rfisRes, isLoading: isRfisLoading } = useQuery({
    queryKey: [
      "contractRfis",
      contractId,
      pagination.pageIndex,
      pagination.pageSize,
      basePath
    ],
    queryFn: async () => {
      const query: ManagerListRfisQuery = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      };
      
      const params = new URLSearchParams();
      if (query.page) params.append("page", String(query.page));
      if (query.limit) params.append("limit", String(query.limit));

      const response = await getRequest({
        url: `${basePath}?${params.toString()}`,
      });
      return response.data;
    },
    enabled: Boolean(contractId) && !!isActive,
  });

  const { data: statsRes } = useQuery({
    queryKey: ["contractRfis", "stats", contractId, basePath],
    queryFn: async () => {
      const response = await getRequest({
        url: `${basePath}/stats`,
      });
      return response.data;
    },
    enabled: Boolean(contractId) && !!isActive,
  });

  const rfiRows = (() => {
    const base = rfisRes as any;
    if (!base) return [];
    if (Array.isArray(base?.data?.contractRfis)) return base.data.contractRfis;
    if (Array.isArray(base?.data?.reports)) return base.data.reports; // Some roles might use reports key? Check doc
    if (Array.isArray(base?.data)) return base.data;
    return [];
  })();
  
  const totalCount = (() => {
    const base = rfisRes as any;
    if (typeof base?.data?.total === "number") return base.data.total;
    if (typeof base?.total === "number") return base.total;
    return rfiRows.length;
  })();

  const stats = statsRes?.data as any;

  return (
    <TabsContent value="rfi" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">RFI</h3>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 rounded-xl px-4">
            <Share2 className="mr-2 h-4 w-4" /> Export Report
          </Button>
          {!isViewOnly && (
            <IssueRfiDialog
              contractId={contractId}
              basePath={basePath}
              trigger={
                <Button className="h-10 rounded-xl px-4" disabled={!!actionsDisabled}>
                  Issue RFI
                </Button>
              }
            />
          )}
        </div>
      </div>

      <RfiStatsCards
        all={stats?.total ?? totalCount}
        issued={stats?.issue ?? 0}
        received={stats?.receive ?? 0}
        isLoading={isRfisLoading}
      />

      <Tabs defaultValue="all" className="w-full bg-transparent">
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

        <TabsContent value="all">
          <RfiTable
            rows={rfiRows}
            isLoading={isRfisLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
          />
        </TabsContent>
        <TabsContent value="issued">
          <RfiTable
            rows={rfiRows.filter((item: any) => item.type === "issue")}
            isLoading={isRfisLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
          />
        </TabsContent>
        <TabsContent value="received">
          <RfiTable
            rows={rfiRows.filter((item: any) => item.type === "received")}
            isLoading={isRfisLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
          />
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
};

export default RfiTabContent;
