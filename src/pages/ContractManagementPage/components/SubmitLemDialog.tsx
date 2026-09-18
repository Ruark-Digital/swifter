import React from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useFormContext, useWatch } from "react-hook-form";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
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
  /** Optional override of the POST endpoint. When omitted, defaults to
   *  `vendorApi.createLem` which hits `/contract/vendor/contracts/{id}/lems`.
   *  MSA callers pass `/contract/vendor/msa-contracts/{contractId}/lems`. */
  createPath?: string;
  /** Optional extra query key to invalidate after successful submission.
   *  MSA callers pass the wrapped `useUserQueryKey` list key so the MSA tab
   *  refetches after submit. The Contract-side default keys are always
   *  invalidated regardless. */
  invalidateQueryKey?: readonly unknown[];
  /** "edit" resubmits a rejected LEM via PUT instead of creating a new one
   *  (QA #150). Requires lemId; initialLem pre-fills the form. */
  mode?: "create" | "edit";
  /** In edit mode, distinguishes a rejected-item resubmit ("Resubmit") from a
   *  pending-item edit ("Edit"). Both hit the same PUT. */
  isResubmit?: boolean;
  lemId?: string;
  /** Contract-level currency for the Amount input. Falls back to USD ("$")
   *  inside TextCurrencyInput when omitted. */
  currency?: string;
  initialLem?: {
    title?: string;
    amount?: number;
    description?: string;
    // Pre-uploaded attachments come straight from the LEM response, whose file
    // objects have optional fields and a string `size` (ContractLemDTO['files']).
    files?: { name?: string; url?: string; type?: string; size?: string | number }[];
  };
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
          Supported formats: XLS, XLSX
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

const SubmitLemDialog: React.FC<SubmitLemDialogProps> = ({
  trigger,
  contractId,
  createPath,
  invalidateQueryKey,
  mode = "create",
  isResubmit = false,
  lemId,
  currency,
  initialLem,
}) => {
  const isEdit = mode === "edit" && !!lemId;
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // Previously-attached files the user removed while resubmitting, keyed by
  // url||name. Lets the resubmit keep the prior attachment by default while
  // still allowing removal (QA #6).
  const [removedExistingKeys, setRemovedExistingKeys] = React.useState<
    Set<string>
  >(() => new Set());
  const toastHandler = useToastHandler();
  const queryClient = useQueryClient();

  const { control, reset } = useForge<SubmitLemFormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      title: initialLem?.title ?? "",
      amount:
        typeof initialLem?.amount === "number"
          ? String(initialLem.amount)
          : "",
      description: initialLem?.description ?? "",
      files: null,
    },
  });

  const existingFiles = React.useMemo(
    () => initialLem?.files ?? [],
    [initialLem?.files],
  );
  const visibleExistingFiles = React.useMemo(
    () =>
      existingFiles.filter(
        (f) => !removedExistingKeys.has(f.url || f.name || ""),
      ),
    [existingFiles, removedExistingKeys],
  );

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
    mutationKey: ["createLem", contractId, createPath ?? "default", isEdit ? lemId : "new"],
    mutationFn: async (data: any) => {
      if (isEdit && lemId) {
        return await vendorApi.updateLem(contractId, lemId, data);
      }
      if (createPath) {
        const res = await postRequest({ url: createPath, payload: data });
        return res as ApiResponse<any>;
      }
      return await vendorApi.createLem(contractId, data);
    },
    onSuccess: async () => {
      setOpen(false);
      reset();
      setRemovedExistingKeys(new Set());
      await queryClient.invalidateQueries({
        queryKey: ["contractLems", "contractInvoices", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["lem-list", contractId],
      });
      if (isEdit && lemId) {
        await queryClient.invalidateQueries({
          queryKey: ["lem-detail", contractId, lemId],
        });
      }
      if (invalidateQueryKey) {
        await queryClient.invalidateQueries({ queryKey: invalidateQueryKey });
      }
      toastHandler.success(
        "Success",
        isEdit
          ? isResubmit
            ? "LEM resubmitted successfully"
            : "LEM updated successfully"
          : "LEM submitted successfully",
      );
    },
    onError: (error: any) => {
      toastHandler.error(
        "Error",
        error?.response?.data?.message ||
          (isEdit
            ? isResubmit
              ? "Failed to resubmit LEM"
              : "Failed to update LEM"
            : "Failed to submit LEM"),
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

      // Keep the previously-attached files the user didn't remove, plus any new
      // uploads (deduped by url||name), so resubmitting never silently wipes the
      // prior attachment — while still letting the user drop it (QA #6).
      const keptExisting = existingFiles.filter(
        (f) => !removedExistingKeys.has(f.url || f.name || ""),
      );
      const seen = new Set<string>();
      const mergedFiles = [...keptExisting, ...uploadedFiles].filter((f) => {
        const key = (f as { url?: string; name?: string }).url ||
          (f as { url?: string; name?: string }).name ||
          "";
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const payload = {
        title: data.title,
        amount: Number(data.amount),
        description: data.description,
        files: mergedFiles,
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
          if (!nextOpen) {
            reset();
            setRemovedExistingKeys(new Set());
          }
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="h-[866px] max-h-[90vh] overflow-y-auto gap-0 border-0 p-0">
        <Forge control={control} onSubmit={onSubmit} className="flex flex-col h-full">
          <div className="flex items-center justify-between px-8 py-8">
            <h2 className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">
              {isEdit ? (isResubmit ? "Resubmit LEM" : "Edit LEM") : "Submit LEM"}
            </h2>
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
              currency={currency}
              placeholder="Enter Amount"
            />

            <Forger
              name="description"
              label="Description"
              component={TextArea}
              placeholder="Enter Description"
              rows={6} // Design shows a large text area
            />

            {isEdit && visibleExistingFiles.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-base font-normal text-[#0F0F0F] dark:text-slate-100">
                  Previously attached
                </label>
                <div className="flex flex-col gap-2">
                  {visibleExistingFiles.map((file) => {
                    const key = file.url || file.name || "";
                    const name = file.name || "Document";
                    return (
                      <div
                        key={key}
                        className="rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#EAF1FB] dark:bg-slate-700">
                            <FileText className="h-5 w-5 text-[#2A4467] dark:text-blue-300" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-[#0F0F0F] dark:text-slate-100">
                              {name}
                            </div>
                            <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
                              {getSimpleFileExtension(name).toUpperCase()}
                              {file.size != null ? ` • ${file.size}` : ""}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end border-t border-[#E5E7EB] dark:border-slate-700 pt-2">
                          <button
                            type="button"
                            aria-label={`Remove ${name}`}
                            onClick={() =>
                              setRemovedExistingKeys((prev) => {
                                const next = new Set(prev);
                                next.add(key);
                                return next;
                              })
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <label className="text-base font-normal text-[#0F0F0F] dark:text-slate-100">Upload Files</label>
              <Forger
                name="files"
                component={TextFileUploader}
                element={<UploadElement />}
                List={FilesListItem}
                accept={
                  {
                    // LEM submissions are Excel schedules only.
                    "application/vnd.ms-excel": [".xls"],
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                      [".xlsx"],
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
                  <span>
                    {isEdit
                      ? isResubmit
                        ? "Resubmitting..."
                        : "Saving..."
                      : "Submitting..."}
                  </span>
                </div>
              ) : isEdit ? (
                isResubmit ? (
                  "Resubmit LEM"
                ) : (
                  "Edit LEM"
                )
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
