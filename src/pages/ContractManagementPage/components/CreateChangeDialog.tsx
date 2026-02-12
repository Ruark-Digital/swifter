import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forge, Forger, useForge } from "@/lib/forge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import type { ApiResponse, ApiResponseError } from "@/types";
import {
  TextArea,
  TextFileUploader,
  TextInput,
  TextSelect,
} from "@/components/layouts/FormInputs";
import { CloudUpload } from "lucide-react";
import { contractManagerApi, type ContractChangeManagerDTO } from "../api/contractManagerApi";
import { toContractChangeFileItem, toManagerCreateChangePayload, type UploadURLs } from "../lib/contractChanges";
import { useToastHandler } from "@/hooks/useToaster";
import { FileUploaderItem } from "@/components/ui/file-upload";
import { getFileIcon, getSimpleFileExtension, formatFileSize } from "@/lib/fileUtils.tsx";
import { useWatch } from "react-hook-form";

type Props = {
  trigger: React.ReactNode;
  contractId: string;
};

const CreateChangeDialog: React.FC<Props> = ({ trigger, contractId }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const toastHandler = useToastHandler();

  const { control, reset } = useForge({
    defaultValues: {
      changeName: "",
      changeType: "",
      amount: "",
      urgency: "",
      description: "",
      files: null,
    },
  });

  const files = useWatch({ control, name: "files" }) as File[] | null;

  const { mutateAsync: uploadFile, isPending: isUploadingFiles } = useMutation<
    ApiResponse<UploadURLs[]>,
    ApiResponseError,
    { file: File }
  >({
    mutationKey: ["uploadContractChangeFile"],
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
    mutationKey: ["contractManager", "contractChanges", "create", contractId],
    mutationFn: async (payload: ContractChangeManagerDTO) => {
      const res = await contractManagerApi.createChangeRequest(contractId, "Contract", payload);
      return res;
    },
    onSuccess: async () => {
      toastHandler.success("Change Request", "Change request submitted successfully");
      setOpen(false);
      reset();
      await queryClient.invalidateQueries({
        queryKey: ["contractManager", "contractChanges"],
      });
    },
    onError: (error: ApiResponseError) => {
      toastHandler.error("Change Request", error);
    },
  });

  const handleSubmit = async (data: {
    changeName: string;
    changeType: string;
    amount: string;
    urgency: string;
    description: string;
    files: File[] | null;
  }) => {
    void data.amount;

    const payload: ContractChangeManagerDTO = toManagerCreateChangePayload({
      changeName: data.changeName,
      changeType: data.changeType,
      urgency: data.urgency,
      description: data.description,
    });

    if (data.files?.length) {
      try {
        const uploadedItems = await Promise.all(
          data.files.map(async (file) => {
            const res = await uploadFile({ file });
            const firstUploaded = res.data.data?.[0];
            if (!firstUploaded?.url) return undefined;
            return toContractChangeFileItem(file, firstUploaded);
          })
        );

        const filesPayload = uploadedItems.filter(
          (item): item is { name: string; url: string; type: string; size: number } => Boolean(item)
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <div className="flex items-center justify-between px-8 pt-8">
          <DialogTitle className="text-xl font-semibold text-[#0F0F0F]">
            Create Change
          </DialogTitle>
        </div>
        <div className="px-8 pb-8 pt-6">
          <Forge control={control} onSubmit={handleSubmit} className="space-y-5">
            <Forger
              name="changeName"
              label="Change Name"
              placeholder="Enter Title"
              component={TextInput}
            />
            <Forger
              name="changeType"
              label="Change Type"
              placeholder="Change Proposal"
              component={TextSelect}
              options={[
                { label: "Change Request", value: "request" },
                { label: "Change Order", value: "order" },
                { label: "Change Directive", value: "directive" },
                { label: "Change Proposal", value: "proposal" },
              ]}
            />
            <div className="grid grid-cols-2 gap-4">
              <Forger
                name="amount"
                label="Amount"
                placeholder="Change Proposal"
                component={TextInput}
              />
              <Forger
                name="urgency"
                label="Level of Urgency"
                placeholder="High"
                component={TextSelect}
                options={[
                  { label: "High", value: "high" },
                  { label: "Medium", value: "medium" },
                  { label: "Low", value: "low" },
                ]}
              />
            </div>
            <Forger
              name="description"
              label="Description"
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
                  <div className="flex flex-col items-center gap-3">
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
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
                      ".docx",
                    ],
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
                disabled={isSubmitting}
                className="h-12 flex-1 rounded-xl bg-[#2A4467] text-base font-semibold text-white hover:bg-[#1f3552]"
              >
                {isSubmitting ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </Forge>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChangeDialog;
