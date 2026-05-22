import React from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useFormContext, useWatch } from "react-hook-form";
import { Forge, Forger, useForge } from "@/lib/forge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TextArea, TextCurrencyInput, TextFileUploader, TextInput } from "@/components/layouts/FormInputs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import type { ApiResponse, ApiResponseError } from "@/types";
import type { UploadURLs } from "../lib/contractChanges";
import { vendorApi } from "../api/vendorApi";
import { useToastHandler } from "@/hooks/useToaster";
import { formatFileSize, getSimpleFileExtension } from "@/lib/fileUtils";
import Spinner from "@/components/ui/Spinner";

type SubmitLemFormValues = {
  title: string;
  amount: string;
  description: string;
  files: File[] | null;
};

const schema = yup.object({
  title: yup.string().required("LEM Title is required"),
  amount: yup.string().required("Amount is required"),
  description: yup.string().required("Description is required"),
  files: yup.mixed().nullable().notRequired(),
});

type SubmitLemDialogProps = {
  trigger: React.ReactElement;
  contractId: string;
};

const UploadElement = () => {
  return (
    <div className="flex h-40 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#9CA3AF] dark:border-slate-600 bg-white dark:bg-slate-800 px-4">
      <UploadCloud className="h-10 w-10 text-[#2A4467] dark:text-blue-300" />
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="text-sm font-semibold text-[#2A4467] dark:text-blue-300">
          Drag &amp; Drop or Click to choose files
        </div>
        <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
          Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
        </div>
      </div>
    </div>
  );
};

const FilesListItem = ({ file }: { file: File }) => {
  const { control, setValue } = useFormContext<SubmitLemFormValues>();
  const value = useWatch({ control, name: "files" });
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-[#EAF1FB] dark:bg-slate-700">
          <FileText className="h-5 w-5 text-[#2A4467] dark:text-blue-300" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium max-w-xs text-[#0F0F0F] dark:text-slate-100">{file.name}</div>
          <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
            {getSimpleFileExtension(file.name).toUpperCase()} • {formatFileSize(file.size)}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setValue("files", (value ?? []).filter((f) => f.name !== file.name))}
        className="inline-flex h-8 w-8 items-center justify-center text-[#9CA3AF] dark:text-slate-400 hover:text-red-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const SubmitLemDialog: React.FC<SubmitLemDialogProps> = ({ trigger, contractId }) => {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const toastHandler = useToastHandler();
  const queryClient = useQueryClient();

  const { control, reset } = useForge<SubmitLemFormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      title: "",
      amount: "",
      description: "",
      files: null,
    },
  });

  const { mutateAsync: uploadFile } = useMutation<
    ApiResponse<UploadURLs[]>,
    ApiResponseError,
    { file: File }
  >({
    mutationKey: ["uploadLemFile"],
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
    mutationKey: ["createLem", contractId],
    mutationFn: async (data: any) => {
      return await vendorApi.createLem(contractId, data);
    },
    onSuccess: async () => {
      setOpen(false);
      reset();
      await queryClient.invalidateQueries({
        queryKey: ["contractLems", "contractInvoices", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["lem-list", contractId],
      });
      // Also invalidate invoices as LEMs might affect them or appear there? 
      // Based on InvoiceTabContent, it fetches invoices.
      toastHandler.success("Success", "LEM submitted successfully");
    },
    onError: (error: any) => {
      toastHandler.error(
        "Error",
        error?.response?.data?.message || "Failed to submit LEM",
      );
    },
  });

  const onSubmit = async (data: SubmitLemFormValues) => {
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
                size: data.files![index].size.toString(),
              };
            }
            return null;
          })
          .filter(Boolean) as any;
      }

      const payload = {
        title: data.title,
        amount: Number(data.amount),
        description: data.description,
        files: uploadedFiles,
      };

      await createMutation.mutateAsync(payload);
    } catch (error) {
      console.error("Error submitting LEM:", error);
      toastHandler.error("Submission Failed", "An error occurred while submitting the form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <DialogContent className="h-[866px] max-h-[90vh] overflow-y-auto gap-0 border-0 p-0">
        <Forge control={control} onSubmit={onSubmit} className="flex flex-col h-full">
          <div className="flex items-center justify-between px-8 py-8">
            <h2 className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">Submit LEM</h2>
          </div>

          <div className="flex flex-1 flex-col gap-6 px-8">
            <Forger
              name="title"
              label="LEM Title"
              component={TextInput}
              placeholder="Enter Title"
            />

            <Forger
              name="amount"
              label="Amount"
              component={TextCurrencyInput}
              placeholder="Enter Amount"
            />

            <Forger
              name="description"
              label="Description"
              component={TextArea}
              placeholder="Enter Description"
              rows={6} // Design shows a large text area
            />

            <div className="flex flex-col gap-3">
              <label className="text-base font-normal text-[#0F0F0F] dark:text-slate-100">Upload Files</label>
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

          <div className="flex items-center gap-6 px-8 py-8 mt-auto">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 py-3.5 text-base font-semibold text-[#0F0F0F] dark:text-slate-100 shadow-sm hover:bg-[#E5E7EB] dark:hover:bg-slate-700 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-[#2A4467] py-3.5 text-base font-semibold text-white shadow-sm hover:bg-[#1e3a5f] disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner className="h-5 w-5 text-white" />
                  <span>Submitting...</span>
                </div>
              ) : (
                "Submit LEM"
              )}
            </button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitLemDialog;
