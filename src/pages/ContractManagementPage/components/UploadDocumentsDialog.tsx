import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Forge, Forger, useForge } from "@/lib/forge";
import { TextFileUploader } from "@/components/layouts/FormInputs";
import { CloudUpload, FileText, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import type { ApiResponse, ApiResponseError } from "@/types";
import type { UploadURLs } from "../lib/contractChanges";
import { formatFileSize, getSimpleFileExtension } from "@/lib/fileUtils";
import { useFormContext } from "react-hook-form";

interface UploadDocumentsDialogProps {
  trigger: React.ReactNode;
  contractId: string;
  onSuccess?: () => void;
}

const schema = yup.object().shape({
  files: yup.mixed().required("File is required"),
});

function FileListItem({ file }: { file: File }) {
  const { setValue, getValues } = useFormContext();
  const handleRemove = () => {
    const current = (getValues("files") as File[] | undefined) || [];
    setValue(
      "files",
      current.filter((v: File) => v.name !== file.name),
    );
  };
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-slate-700 rounded flex items-center justify-center">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{file.name}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {getSimpleFileExtension(file.name).toUpperCase()} •{" "}
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleRemove}
        className="text-gray-400 dark:text-slate-500 hover:text-red-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

const UploadDocumentsDialog: React.FC<UploadDocumentsDialogProps> = ({
  trigger,
  contractId,
  onSuccess,
}) => {
  const [open, setOpen] = React.useState(false);
  // "Final document version" flag — the backend stops accepting further
  // uploads and kicks off clause analysis when this is sent as true.
  const [isFinalDocument, setIsFinalDocument] = React.useState(false);
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const { control, reset } = useForge({
    resolver: yupResolver(schema),
    defaultValues: {
      files: undefined,
    },
  });

  const { mutateAsync: uploadFile, isPending: isUploadingFiles } = useMutation<
    ApiResponse<UploadURLs[]>,
    ApiResponseError,
    { file: File }
  >({
    mutationKey: ["uploadContractDocument"],
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

  const submitMutation = useMutation({
    mutationFn: async (payload: { files: unknown[]; finalDocument: boolean }) => {
      return await postRequest({
        url: `/contract/manager/contracts/${contractId}/documents`,
        payload,
      });
    },
    onSuccess: () => {
      toast.success("Success", "Contract documents uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["contract-manager-contracts"] });
      onSuccess?.();
      setOpen(false);
      reset();
      setIsFinalDocument(false);
    },
    onError: (error: any) => {
      toast.error("Error", error?.message || "Failed to upload contract documents");
    },
  });

  const onSubmit = async (data: any) => {
    if (!data.files || !Array.isArray(data.files) || data.files.length === 0) {
      toast.error("Error", "Select at least one file to upload");
      return;
    }

    let filesPayload: any[] = [];
    try {
      const uploadedItems = await Promise.all(
        data.files.map(async (file: File) => {
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

      filesPayload = uploadedItems.filter(Boolean);
    } catch {
      toast.error("Upload Error", "Failed to upload one or more files");
      return;
    }

    if (filesPayload.length === 0) {
      toast.error("Upload Error", "Failed to upload one or more files");
      return;
    }

    submitMutation.mutate({ files: filesPayload, finalDocument: isFinalDocument });
  };

  const acceptedFileTypes = {
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
  } as const;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="p-0 rounded-2xl overflow-auto py-4 border-none">
        <DialogHeader className="flex flex-row items-center justify-between p-4 bg-white dark:bg-slate-950">
          <DialogTitle className="text-base font-medium text-slate-900 dark:text-slate-100">
            Upload Documents
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 bg-white dark:bg-slate-950">
          <Forge control={control} onSubmit={onSubmit} className="space-y-8">
            <div className="space-y-2">
              <p className="text-sm font-light text-slate-900 dark:text-slate-100">Upload Files</p>
              <Forger
                name="files"
                component={TextFileUploader}
                accept={acceptedFileTypes as any}
                List={FileListItem}
                element={
                  <div className="flex flex-col items-center justify-center gap-4 py-5 w-full border-2 border-dashed border-[#2A4467] dark:border-blue-300 rounded-2xl bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer">
                    <div className="p-4 bg-[#2A4467]/10 dark:bg-blue-900/30 rounded-full group-hover:scale-110 transition-transform">
                      <CloudUpload className="h-5 w-5 text-[#2A4467] dark:text-blue-300" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-md font-bold text-[#2A4467] dark:text-blue-300">
                        Drag & Drop or Click to choose files
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
                      </p>
                    </div>
                  </div>
                }
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Uploading while the contract is pending approval replaces the
              current documents; the previous versions are archived.
            </p>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 cursor-pointer dark:border-slate-700 dark:bg-slate-900">
              <Checkbox
                checked={isFinalDocument}
                onCheckedChange={(checked) => setIsFinalDocument(checked === true)}
                className="mt-0.5"
              />
              <span className="space-y-1">
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  This is the last document I will be uploading
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  Marks this upload as the final document version. No further
                  uploads will be accepted for this contract.
                </span>
              </span>
            </label>

            <div className="flex items-center justify-end gap-6 pt-2 pb-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 px-12 rounded-xl border-slate-200 bg-slate-50 text-slate-900 text-md hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  Back
                </Button>
              </DialogClose>

              <Button
                type="submit"
                disabled={submitMutation.isPending || isUploadingFiles}
                className="h-12 px-6 rounded-xl bg-[#2A4467] text-white text-md hover:bg-[#1f3552]"
              >
                {submitMutation.isPending || isUploadingFiles
                  ? "Uploading..."
                  : "Upload Documents"}
              </Button>
            </div>
          </Forge>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDocumentsDialog;
