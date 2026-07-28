import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import type { ApiResponse, ApiResponseError } from "@/types";
import {
  TextArea,
  TextCurrencyInput,
  TextFileUploader,
  TextInput,
  TextSelect,
} from "@/components/layouts/FormInputs";
import { CloudUpload } from "lucide-react";
import { contractManagerApi, type ContractChangeManagerDTO } from "../api/contractManagerApi";
import { vendorApi } from "../api/vendorApi";
import {
  getCreateChangeTypeOptionsForRole,
  getCreateChangeSubmitLabel,
  toContractChangeFileItem,
  toManagerCreateChangePayload,
  toVendorCreateChangePayload,
  type ContractChangeType,
  type UploadURLs,
} from "../lib/contractChanges";
import { useToastHandler } from "@/hooks/useToaster";
import { FileUploaderItem } from "@/components/ui/file-upload";
import { getFileIcon, getSimpleFileExtension, formatFileSize } from "@/lib/fileUtils.tsx";
import { useWatch } from "react-hook-form";

type Props = {
  trigger: React.ReactNode;
  contractId: string;
  isManager?: boolean;
  documentType?: "Contract" | "MsaContract";
  /** "edit" resubmits a rejected change request via PUT instead of creating
   *  a new one (QA #150). Requires changeId; initialChange pre-fills the
   *  form. Vendor-only — managers don't resubmit their own change requests. */
  mode?: "create" | "edit";
  /** In edit mode, distinguishes a rejected-item resubmit ("Resubmit") from a
   *  pending-item edit ("Edit"). Both hit the same PUT. */
  isResubmit?: boolean;
  changeId?: string;
  initialChange?: {
    title?: string;
    type?: string;
    urgency?: string;
    description?: string;
    files?: { name: string; url: string; type: string; size: string | number }[];
  };
};

function FileListItem({ file, index }: { file: File; index?: number }) {
  const extension = getSimpleFileExtension(file.name).toUpperCase();
  return (
    <FileUploaderItem
      index={index ?? 0}
      className="h-auto w-full rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex items-center gap-3 w-full">
        <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center dark:bg-slate-700 dark:border-slate-600">
          {getFileIcon(extension)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate dark:text-slate-100">
            {file.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {extension || "FILE"} • {formatFileSize(file.size)}
          </p>
        </div>
      </div>
    </FileUploaderItem>
  );
}

const CreateChangeDialog: React.FC<Props> = ({
  trigger,
  contractId,
  isManager = true,
  documentType = "Contract",
  mode = "create",
  isResubmit = false,
  changeId,
  initialChange,
}) => {
  const isEdit = mode === "edit" && !!changeId;
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const toastHandler = useToastHandler();
  const changeTypeOptions = React.useMemo(
    () => getCreateChangeTypeOptionsForRole({ isManager, isVendor: !isManager }),
    [isManager],
  );
  const defaultChangeType = isManager ? "directive" : "request";

  const { control, reset } = useForge({
    defaultValues: {
      changeName: initialChange?.title ?? "",
      changeType: initialChange?.type ?? defaultChangeType,
      amount: "",
      urgency: initialChange?.urgency ?? "",
      description: initialChange?.description ?? "",
      files: null,
    },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({
      changeName: initialChange?.title ?? "",
      changeType: initialChange?.type ?? defaultChangeType,
      amount: "",
      urgency: initialChange?.urgency ?? "",
      description: initialChange?.description ?? "",
      files: null,
    });
    // Only depend on `open` — re-syncing on every initialChange identity
    // change would reset the form mid-edit if the parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

  const files = useWatch({ control, name: "files" }) as File[] | null;
  const changeType = useWatch({ control, name: "changeType" }) as ContractChangeType | undefined;
  const submitLabel = isEdit
    ? isResubmit
      ? "Resubmit"
      : "Save Changes"
    : getCreateChangeSubmitLabel({
        isManager,
        changeType: changeType ?? defaultChangeType,
      });

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
    mutationKey: [
      isManager ? "contractManager" : "vendor",
      "contractChanges",
      isEdit ? "update" : "create",
      contractId,
      isEdit ? changeId : "new",
    ],
    mutationFn: async (payload: ContractChangeManagerDTO) => {
      if (isEdit && changeId) {
        return await vendorApi.updateChange(contractId, changeId, payload as any);
      }
      if (isManager) {
        const res = await contractManagerApi.createChangeRequest(
          contractId,
          documentType,
          payload,
        );
        return res;
      }
      const res =
        documentType === "MsaContract"
          ? await vendorApi.createMsaChange(contractId, payload as any)
          : await vendorApi.createChange(contractId, payload as any);
      return res;
    },
    onSuccess: async () => {
      toastHandler.success(
        "Change Request",
        isEdit
          ? isResubmit
            ? "Change request resubmitted successfully"
            : "Change request updated successfully"
          : "Change request submitted successfully",
      );
      setOpen(false);
      reset();
      const listKey = documentType === "MsaContract" ? "msaChanges" : "contractChanges";
      await queryClient.invalidateQueries({ queryKey: [listKey] });
      await queryClient.invalidateQueries({ queryKey: [listKey, "stats"] });
      if (isEdit && changeId) {
        await queryClient.invalidateQueries({
          queryKey: ["contract-change-detail"],
        });
      }
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
    const payload: ContractChangeManagerDTO = isManager
      ? toManagerCreateChangePayload({
          changeName: data.changeName,
          changeType: data.changeType,
          urgency: data.urgency,
          description: data.description,
          amount: data.amount,
        })
      : (toVendorCreateChangePayload({
          changeName: data.changeName,
          changeType: data.changeType,
          urgency: data.urgency,
          description: data.description,
          amount: data.amount,
        }) as unknown as ContractChangeManagerDTO);

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

        const filesPayload = uploadedItems
          .filter(
            (item): item is { name: string; url: string; type: string; size: string } =>
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

    // Editing without re-uploading shouldn't wipe the existing attachment.
    if (isEdit && !payload.files?.length && initialChange?.files?.length) {
      payload.files = initialChange.files as any;
    }

    try {
      await createMutation.mutateAsync(payload);
    } catch {
      return;
    }
  };

  const isSubmitting = createMutation.isPending || isUploadingFiles;
  const fileCount = files?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <div className="flex items-center justify-between px-8 pt-8">
          <DialogTitle className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">
            {isEdit
              ? isResubmit
                ? "Resubmit Change"
                : "Edit Change"
              : "Create Change"}
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
              options={changeTypeOptions.map((t) => ({ label: t.label, value: t.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Forger
                name="amount"
                label="Amount"
                placeholder="Enter Amount"
                component={TextCurrencyInput}
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
                    <CloudUpload className="h-12 w-12 text-[#2A4467] dark:text-blue-300" />
                    <div className="space-y-1 text-center">
                      <p className="text-base font-semibold text-[#2A4467] dark:text-blue-300">
                        Drag & Drop or Click to choose files
                      </p>
                      <p className="text-sm text-[#6B7280] dark:text-slate-400">
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
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
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
                  className="h-12 flex-1 rounded-xl border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] hover:bg-[#E5E7EB] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
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
                {isSubmitting
                  ? isEdit
                    ? isResubmit
                      ? "Resubmitting..."
                      : "Saving..."
                    : "Sending..."
                  : submitLabel}
              </Button>
            </div>
          </Forge>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChangeDialog;
