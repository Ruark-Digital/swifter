import React from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useFormContext, useWatch } from "react-hook-form";
import { Forge, Forger, useForge } from "@/lib/forge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TextArea, TextCurrencyInput, TextFileUploader, TextSelect } from "@/components/layouts/FormInputs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import type { ApiResponse, ApiResponseError } from "@/types";
import type { UploadURLs } from "../lib/contractChanges";
import { contractManagerApi } from "../api/contractManagerApi";
import { useToastHandler } from "@/hooks/useToaster";
import { formatFileSize, getSimpleFileExtension } from "@/lib/fileUtils";
import  Spinner from "@/components/ui/Spinner";

type ReleaseHoldbackFormValues = {
  releaseType: string;
  amountToBeReleased: string;
  description: string;
  files: File[] | null;
};

const schema = yup.object({
  releaseType: yup
    .string()
    .oneOf(["Partial Release", "Full Release"], "Release Type is required")
    .required("Release Type is required"),
  amountToBeReleased: yup.string().when("releaseType", {
    is: "Partial Release",
    then: (s) => s.required("Amount to be Released is required"),
    otherwise: (s) => s.notRequired(),
  }),
  description: yup.string().notRequired(),
  files: yup.mixed().nullable().notRequired(),
});

type ReleaseHoldbackDialogProps = {
  trigger: React.ReactElement;
  contractId: string;
};

const UploadElement = () => {
  return (
    <div className="flex h-40 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#9CA3AF] bg-white px-4">
      <UploadCloud className="h-10 w-10 text-[#2A4467]" />
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="text-sm font-semibold text-[#2A4467]">
          Drag &amp; Drop or Click to choose files
        </div>
        <div className="text-xs font-medium text-[#9CA3AF]">
          Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
        </div>
      </div>
    </div>
  );
};

const FilesListItem = ({ file }: { file: File }) => {
  const { control, setValue } = useFormContext<ReleaseHoldbackFormValues>();
  const value = useWatch({ control, name: "files" });
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-[#EAF1FB]">
          <FileText className="h-5 w-5 text-[#2A4467]" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-[#0F0F0F]">{file.name}</div>
          <div className="text-xs font-medium text-[#9CA3AF]">
            {getSimpleFileExtension(file.name).toUpperCase()} • {formatFileSize(file.size)}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setValue("files", (value ?? []).filter((f) => f.name !== file.name))}
        className="inline-flex h-8 w-8 items-center justify-center text-[#9CA3AF] hover:text-red-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ReleaseHoldbackDialog: React.FC<ReleaseHoldbackDialogProps> = ({ trigger, contractId }) => {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const toastHandler = useToastHandler();
  const queryClient = useQueryClient();

  const { control, reset, watch } = useForge<ReleaseHoldbackFormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      releaseType: "",
      amountToBeReleased: "",
      description: "",
      files: null,
    },
  });

  const releaseType = watch("releaseType");

  const { mutateAsync: uploadFile } = useMutation<
    ApiResponse<UploadURLs[]>,
    ApiResponseError,
    { file: File }
  >({
    mutationKey: ["uploadHoldbackFile"],
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
    mutationKey: ["createPaymentHoldback", contractId],
    mutationFn: async (data: any) => {
      return await contractManagerApi.createPaymentHoldback(contractId, data);
    },
    onSuccess: async () => {
      setOpen(false);
      reset();
      await queryClient.invalidateQueries({
        queryKey: ["contract-payment-holdbacks", contractId],
      });
      toastHandler.success("Success", "Holdback released successfully");
    },
    onError: (error: any) => {
      toastHandler.error(
        "Error",
        error?.response?.data?.message || "Failed to release holdback",
      );
    },
  });

  const onSubmit = async (data: ReleaseHoldbackFormValues) => {
    setIsSubmitting(true);
    try {
      let uploadedFiles: {
        name: string;
        url: string;
        type: string;
        size: number;
      }[] = [];

      if (data.files && data.files.length > 0) {
        const uploadPromises = data.files.map((file) => uploadFile({ file }));
        const responses = await Promise.all(uploadPromises);

        uploadedFiles = responses
          .map((res, index) => {
            if (res.data && res.data?.data?.[0]) {
              return {
                name: data.files![index].name,
                url: res.data?.data?.[0].url,
                type: getSimpleFileExtension(data.files![index].name).toUpperCase(),
                size: data.files![index].size,
              };
            }
            return null;
          })
          .filter(Boolean) as any;
      }

      const payload = {
        type: data.releaseType === "Full Release" ? "full" : "partial",
        amount: data.releaseType === "Full Release" ? 0 : Number(data.amountToBeReleased),
        description: data.description,
        files: uploadedFiles,
      };

      await createMutation.mutateAsync(payload);
    } catch (error) {
      console.error("Error submitting holdback release:", error);
      toastHandler.error("Submission Failed", "An error occurred while submitting the form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const amountPlaceholder = releaseType === "Full Release" ? "Enter Title" : "Enter Amount";
  const isFullRelease = releaseType === "Full Release";

  return (
    <Dialog 
      open={open} 
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) {
          setOpen(nextOpen);
          if (!nextOpen) reset();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="h-[80vh] overflow-auto gap-0 border-0 p-0 ">
        <Forge control={control} onSubmit={onSubmit} className="flex flex-col">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-5">
            <h2 className="text-xl font-semibold text-[#111827]">Release Holdback</h2>
          </div>

          <div className="flex flex-col gap-6 px-6 py-6">
            <Forger
              name="releaseType"
              label="Release Type"
              component={TextSelect}
              placeholder="Select Release Type"
              options={[
                { label: "Partial Release", value: "Partial Release" },
                { label: "Full Release", value: "Full Release" },
              ]}
            />

            {!isFullRelease && (
              <Forger
                name="amountToBeReleased"
                label="Amount to be Released"
                component={TextCurrencyInput}
                placeholder={amountPlaceholder}
              />
            )}

            <Forger
              name="description"
              label="Description"
              component={TextArea}
              placeholder="Enter Description"
              rows={4}
            />

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#374151]">Upload Files</label>
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
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] px-6 py-5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#374151] shadow-sm hover:bg-[#F9FAFB] disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#2A4467] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1e3a5f] disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Spinner className="h-4 w-4 text-white" />
                  <span>Releasing...</span>
                </div>
              ) : (
                "Release"
              )}
            </button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default ReleaseHoldbackDialog;
