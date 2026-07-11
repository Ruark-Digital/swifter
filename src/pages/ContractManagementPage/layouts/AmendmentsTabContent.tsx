import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
import {
  TextArea,
  TextFileUploader,
  TextInput,
  TextDatePicker,
  TextCurrencyInput,
} from "@/components/layouts/FormInputs";
import { Check, CloudUpload, FileText, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import AmendmentsStatsCards from "../components/AmendmentsStatsCards";
import AmendmentsTable, {
  type AmendmentDetail,
  type AmendmentRow,
} from "../components/AmendmentsTable";
import { useQuery } from "@tanstack/react-query";
import {
  type ContractAmendmentDTO,
  type ContractAmendmentStatsDTO,
} from "../api/contractManagerApi";
import { useUserRole } from "@/hooks/useUserRole";
import { getRequest, putRequest } from "@/lib/axiosInstance";
import { formatFileSize, getSimpleFileExtension } from "@/lib/fileUtils";
import { toAmendmentDateTimeValue } from "../utils/amendmentDate";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastHandler } from "@/hooks/useToaster";
import { postRequest } from "@/lib/axiosInstance";
import type { UploadURLs } from "../lib/contractChanges";
import type { ApiResponse, ApiResponseError } from "@/types";
import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";
import { useFormContext } from "react-hook-form";

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
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800">
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
        className="text-gray-400 dark:text-slate-400 hover:text-red-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export type CreateAmendmentFormValues = {
  amendmentTitle: string;
  impactType: "time" | "cost" | "time_cost" | "others";
  timeImpactDays: Date | string;
  costImpactAmount: string;
  scopeEnabled: boolean;
  expiryEnabled: boolean;
  costEnabled: boolean;
  clauseEnabled: boolean;
  othersEnabled: boolean;
  scope: string;
  newExpiryDate: Date | string;
  otherCost: string;
  clause: string;
  otherDetails: string;
  description: string;
  files: File[] | null;
};

type ContractAmendmentChange = { field: string; value: string | number };

export type ContractAmendmentFile = {
  name: string;
  url: string;
  type: string;
  size: string;
};

type CreateAmendmentPayload = {
  title: string;
  impact: CreateAmendmentFormValues["impactType"];
  description: string;
  clause?: string;
  others?: string;
  changes: ContractAmendmentChange[];
  files: ContractAmendmentFile[];
};

const CREATE_AMENDMENT_DEFAULT_VALUES: CreateAmendmentFormValues = {
  amendmentTitle: "",
  impactType: "time",
  timeImpactDays: "",
  costImpactAmount: "",
  scopeEnabled: true,
  expiryEnabled: true,
  costEnabled: true,
  clauseEnabled: true,
  othersEnabled: true,
  scope: "",
  newExpiryDate: "",
  otherCost: "",
  clause: "",
  otherDetails: "",
  description: "",
  files: null,
};

const getCreateAmendmentDefaultValues = (
  initialValues?: Partial<CreateAmendmentFormValues>,
): CreateAmendmentFormValues => ({
  ...CREATE_AMENDMENT_DEFAULT_VALUES,
  ...initialValues,
  files: null,
});

const UploadElement = () => {
  return (
    <div className="flex flex-col items-center gap-3">
      <CloudUpload className="h-12 w-12 text-[#2A4467] dark:text-blue-300" />
      <div className="space-y-1 text-center">
        <p className="text-base font-semibold text-[#2A4467] dark:text-blue-300">
          Drag &amp; Drop or Click to choose files
        </p>
        <p className="text-sm text-[#6B7280] dark:text-slate-400">
          Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
        </p>
      </div>
    </div>
  );
};

export const CreateAmendmentDialog: React.FC<{
  trigger: React.ReactElement;
  contractId: string;
  createPath?: string;
  updatePath?: string;
  amendmentId?: string;
  mode?: "create" | "edit";
  initialValues?: Partial<CreateAmendmentFormValues>;
  existingFiles?: ContractAmendmentFile[];
  mutationScope?: string;
  listInvalidateQueryKey?: readonly unknown[];
  statsInvalidateQueryKey?: readonly unknown[];
  titleText?: string;
  submitText?: string;
  successText?: string;
  onSubmitted?: () => void;
}> = ({
  trigger,
  contractId,
  createPath,
  updatePath,
  amendmentId,
  mode = "create",
  initialValues,
  existingFiles = [],
  mutationScope = "contract-amendments",
  listInvalidateQueryKey,
  statsInvalidateQueryKey,
  titleText,
  submitText,
  successText,
  onSubmitted,
}) => {
  const [open, setOpen] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const toastHandler = useToastHandler();
  const isEditMode = mode === "edit";
  const formDefaults = React.useMemo(
    () => getCreateAmendmentDefaultValues(initialValues),
    [initialValues],
  );

  const { control, reset, watch } = useForge<CreateAmendmentFormValues>({
    defaultValues: formDefaults,
  });

  React.useEffect(() => {
    if (open) {
      reset(formDefaults);
    }
  }, [formDefaults, open, reset]);
  
  const impactType = watch("impactType");
  const scopeEnabled = watch("scopeEnabled");
  const expiryEnabled = watch("expiryEnabled");
  const costEnabled = watch("costEnabled");
  const clauseEnabled = watch("clauseEnabled");
  const othersEnabled = watch("othersEnabled");

  const { mutateAsync: uploadFile, isPending: isUploadingFiles } = useMutation<
    ApiResponse<UploadURLs[]>,
    ApiResponseError,
    { file: File }
  >({
    mutationKey: ["uploadContractAmendmentFile"],
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
    mutationKey: [mutationScope, isEditMode ? "edit" : "create", contractId, amendmentId],
    mutationFn: async (payload: CreateAmendmentPayload) => {
      if (isEditMode) {
        const resolvedUpdatePath =
          updatePath ||
          (amendmentId
            ? `/contract/manager/contracts/${contractId}/amendments/${amendmentId}`
            : "");

        if (!resolvedUpdatePath) {
          throw new Error("Missing amendment update path");
        }

        const res = await putRequest({
          url: resolvedUpdatePath,
          payload,
        });
        return res.data;
      }

      const res = await postRequest({
        url: createPath || `/contract/manager/contracts/${contractId}/amendments`,
        payload,
      });
      return res.data;
    },
    onSuccess: async () => {
      setOpen(false);
      setSuccessOpen(true);
      reset(formDefaults);
      await queryClient.invalidateQueries({
        queryKey: listInvalidateQueryKey ?? [mutationScope, contractId],
      });
      await queryClient.invalidateQueries({
        queryKey:
          statsInvalidateQueryKey ?? [`${mutationScope}-stats`, contractId],
      });
      onSubmitted?.();
    },
    onError: (error: ApiResponseError) => {
      toastHandler.error(
        isEditMode ? "Update Amendment Failed" : "Create Amendment Failed",
        error,
      );
    },
  });

  const handleSubmit = async (data: CreateAmendmentFormValues) => {
    let uploadedFiles: ContractAmendmentFile[] = [];

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
              size: firstUploaded.size ?? "",
            };
          }),
        );

        uploadedFiles = uploadedItems.filter(
          (item): item is ContractAmendmentFile => Boolean(item),
        );
      } catch (error) {
        toastHandler.error("Upload Failed", error as ApiResponseError);
        return;
      }
    }

    const changes: ContractAmendmentChange[] = [];
    if (data.impactType === "time" || data.impactType === "time_cost") {
      if (data.timeImpactDays) {
        changes.push({
          field: "time",
          value: toAmendmentDateTimeValue(data.timeImpactDays),
        });
      }
    }
    if (data.impactType === "cost" || data.impactType === "time_cost") {
      if (data.costImpactAmount) {
        const numValue = typeof data.costImpactAmount === "string" 
          ? parseFloat(data.costImpactAmount) 
          : data.costImpactAmount;
        changes.push({
          field: "cost",
          value: numValue,
        });
      }
    }
    if (data.impactType === "others") {
      if (data.scopeEnabled && data.scope) {
        changes.push({ field: "others", value: String(data.scope) });
      }
      if (data.expiryEnabled && data.newExpiryDate) {
        changes.push({
          field: "time",
          value: toAmendmentDateTimeValue(data.newExpiryDate),
        });
      }
      if (data.costEnabled && data.otherCost) {
        const numValue = typeof data.otherCost === "string"
          ? parseFloat(data.otherCost)
          : data.otherCost;
        changes.push({ field: "cost", value: numValue });
      }
    }

    const payload: CreateAmendmentPayload = {
      title: data.amendmentTitle,
      impact: data.impactType,
      description: data.description,
      clause: data.impactType === "others" && data.clauseEnabled ? data.clause : undefined,
      others: data.impactType === "others" && data.othersEnabled ? data.otherDetails : undefined,
      changes,
      files: [...existingFiles, ...uploadedFiles],
    };

    try {
      await createMutation.mutateAsync(payload);
    } catch {
      // Error handled in onError
    }
  };

  const isSubmitting = createMutation.isPending || isUploadingFiles;
  const dialogTitle =
    titleText ?? (isEditMode ? "Modify Amendment" : "Create Amendment");
  const submitLabel =
    submitText ?? (isEditMode ? "Resubmit Amendment" : "Create Amendment");
  const successLabel =
    successText ??
    (isEditMode
      ? "Amendment Resubmitted Successfully"
      : "Amendment Created Successfully");

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) reset(formDefaults);
        }}
      >
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          showCloseButton={false}
          className="max-h-[90vh] w-full max-w-2xl gap-0 overflow-hidden rounded-2xl border-0 p-0"
        >
          <Forge
            control={control}
            onSubmit={handleSubmit}
            className="flex max-h-[90vh] flex-col"
          >
            <div className="flex items-center justify-between px-8 pb-2 pt-8">
              <div className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">
                {dialogTitle}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#EF4444]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-8 pb-8 pt-4">
              <Forger
                name="amendmentTitle"
                label="Amendment Title"
                placeholder="Enter Title"
                component={TextInput}
              />

              <Forger
                name="impactType"
                component={({
                  value,
                  onChange,
                }: {
                  value?: string;
                  onChange: (val: string) => void;
                }) => (
                  <div className="flex flex-wrap gap-6">
                    {[
                      {
                        id: "impact-time",
                        value: "time",
                        label: "Time Impact",
                      },
                      {
                        id: "impact-cost",
                        value: "cost",
                        label: "Cost Impact",
                      },
                      {
                        id: "impact-time-cost",
                        value: "time_cost",
                        label: "Time & Cost Impact",
                      },
                      {
                        id: "impact-other",
                        value: "others",
                        label: "Other Combinations",
                      },
                    ].map((option) => {
                      const isSelected = value === option.value;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => onChange(option.value)}
                          className="flex items-center gap-3 text-sm font-semibold text-[#374151] dark:text-slate-200"
                        >
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                              isSelected
                                ? "border-[#2A4467] bg-[#F9F5FF] dark:border-blue-300 dark:bg-slate-800"
                                : "border-[#E5E7EB] bg-white dark:border-slate-600 dark:bg-slate-800"
                            }`}
                          >
                            {isSelected && (
                              <span className="h-2.5 w-2.5 rounded-full bg-[#2A4467] dark:bg-blue-300" />
                            )}
                          </span>
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />

              {impactType === "time" && (
                <Forger
                  name="timeImpactDays"
                  label="New Expiry/ Delivery / Completion Date"
                  placeholder="Enter no. of days"
                  component={TextDatePicker}
                />
              )}

              {impactType === "cost" && (
                <Forger
                  name="costImpactAmount"
                  label="Cost"
                  placeholder="Enter Amount"
                  component={TextCurrencyInput}
                />
              )}

              {impactType === "time_cost" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Forger
                    name="timeImpactDays"
                    label="New Expiry/ Delivery / Completion Date"
                    placeholder="Enter no. of days"
                    component={TextDatePicker}
                  />
                  <Forger
                    name="costImpactAmount"
                    label="Cost"
                    placeholder="Enter Amount"
                    component={TextCurrencyInput}
                  />
                </div>
              )}

              {impactType === "others" && (
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 shadow-[0_-1px_4px_0px_rgba(0,26,43,0.05)] space-y-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">
                        Scope
                      </div>
                      <Forger
                        name="scopeEnabled"
                        component={({
                          value,
                          onChange,
                        }: {
                          value?: boolean;
                          onChange: (val: boolean) => void;
                        }) => (
                          <Checkbox
                            checked={!!value}
                            onCheckedChange={(checked) => onChange(!!checked)}
                            className="h-6 w-6 rounded-md border-[#2A4467] dark:border-slate-400 data-[state=checked]:bg-[#2A4467] data-[state=checked]:border-[#2A4467]"
                          />
                        )}
                      />
                    </div>
                    <Forger
                      name="scope"
                      placeholder="Enter Scope"
                      component={TextInput}
                      disabled={!scopeEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">
                        New Expiry/ Delivery / Completion Date
                      </div>
                      <Forger
                        name="expiryEnabled"
                        component={({
                          value,
                          onChange,
                        }: {
                          value?: boolean;
                          onChange: (val: boolean) => void;
                        }) => (
                          <Checkbox
                            checked={!!value}
                            onCheckedChange={(checked) => onChange(!!checked)}
                            className="h-6 w-6 rounded-md border-[#2A4467] dark:border-slate-400 data-[state=checked]:bg-[#2A4467] data-[state=checked]:border-[#2A4467]"
                          />
                        )}
                      />
                    </div>
                    <Forger
                      name="newExpiryDate"
                      placeholder="Enter Date"
                      component={TextDatePicker}
                      disabled={!expiryEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">
                        Cost
                      </div>
                      <Forger
                        name="costEnabled"
                        component={({
                          value,
                          onChange,
                        }: {
                          value?: boolean;
                          onChange: (val: boolean) => void;
                        }) => (
                          <Checkbox
                            checked={!!value}
                            onCheckedChange={(checked) => onChange(!!checked)}
                            className="h-6 w-6 rounded-md border-[#2A4467] dark:border-slate-400 data-[state=checked]:bg-[#2A4467] data-[state=checked]:border-[#2A4467]"
                          />
                        )}
                      />
                    </div>
                    <Forger
                      name="otherCost"
                      placeholder="Enter Amount"
                      component={TextCurrencyInput}
                      disabled={!costEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">
                        Clause
                      </div>
                      <Forger
                        name="clauseEnabled"
                        component={({
                          value,
                          onChange,
                        }: {
                          value?: boolean;
                          onChange: (val: boolean) => void;
                        }) => (
                          <Checkbox
                            checked={!!value}
                            onCheckedChange={(checked) => onChange(!!checked)}
                            className="h-6 w-6 rounded-md border-[#2A4467] dark:border-slate-400 data-[state=checked]:bg-[#2A4467] data-[state=checked]:border-[#2A4467]"
                          />
                        )}
                      />
                    </div>
                    <Forger
                      name="clause"
                      placeholder="Enter Detail"
                      component={TextInput}
                      disabled={!clauseEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">
                        Others
                      </div>
                      <Forger
                        name="othersEnabled"
                        component={({
                          value,
                          onChange,
                        }: {
                          value?: boolean;
                          onChange: (val: boolean) => void;
                        }) => (
                          <Checkbox
                            checked={!!value}
                            onCheckedChange={(checked) => onChange(!!checked)}
                            className="h-6 w-6 rounded-md border-[#2A4467] dark:border-slate-400 data-[state=checked]:bg-[#2A4467] data-[state=checked]:border-[#2A4467]"
                          />
                        )}
                      />
                    </div>
                    <Forger
                      name="otherDetails"
                      placeholder="Enter Detail"
                      component={TextInput}
                      disabled={!othersEnabled}
                    />
                  </div>
                </div>
              )}

              <Forger
                name="description"
                label="Description"
                placeholder="Enter Detail"
                component={TextArea}
                rows={5}
              />

              {existingFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                    Current Files
                  </div>
                  <div className="space-y-3">
                    {existingFiles.map((file) => (
                      <div
                        key={file.url || file.name}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-100 dark:bg-slate-700">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                              {getSimpleFileExtension(file.name).toUpperCase()} | {file.size}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                  {existingFiles.length > 0 ? "Upload Additional Files" : "Upload Files"}
                </div>
                <Forger
                  name="files"
                  component={TextFileUploader}
                  element={<UploadElement />}
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
              </div>
            </div>

            <div className="flex items-center gap-6 px-8 py-4">
              <Button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] dark:text-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#2A4467] px-6 text-base font-semibold text-white"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? isEditMode
                    ? "Resubmitting..."
                    : "Creating..."
                  : submitLabel}
              </Button>
            </div>
          </Forge>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-full max-w-md rounded-2xl border-0 px-8 py-10"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#22C55E] text-[#22C55E]">
              <Check className="h-8 w-8" />
            </div>
            <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
              {successLabel}
            </div>
            <Button
              type="button"
              onClick={() => setSuccessOpen(false)}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#2A4467] text-base font-semibold text-white"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const toAmendmentFormDate = (
  value: string | Date | undefined | null,
): Date | string => {
  if (!value) return "";
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed;
};

const buildEditAmendmentInitialValues = (
  detail: AmendmentDetail,
): Partial<CreateAmendmentFormValues> => {
  const impactType =
    detail.impact === "cost" ||
    detail.impact === "time_cost" ||
    detail.impact === "others"
      ? detail.impact
      : "time";

  const timeChange = detail.changes?.find((change) =>
    ["time", "endDate", "newExpiryDate"].includes(change.field),
  );
  const costChange = detail.changes?.find((change) => change.field === "cost");
  const scopeChange = detail.changes?.find((change) =>
    ["scope", "others"].includes(change.field),
  );
  const clauseValue = String((detail as any).clause ?? "");
  const otherDetails = String((detail as any).others ?? "");

  return {
    amendmentTitle: detail.title ?? "",
    impactType,
    timeImpactDays: toAmendmentFormDate(timeChange?.newValue as any),
    costImpactAmount: costChange?.newValue ? String(costChange.newValue) : "",
    scopeEnabled: Boolean(scopeChange?.newValue),
    expiryEnabled: Boolean(timeChange?.newValue),
    costEnabled: Boolean(costChange?.newValue),
    clauseEnabled: Boolean(clauseValue),
    othersEnabled: Boolean(otherDetails),
    scope: scopeChange?.newValue ? String(scopeChange.newValue) : "",
    newExpiryDate: toAmendmentFormDate(timeChange?.newValue as any),
    otherCost: costChange?.newValue ? String(costChange.newValue) : "",
    clause: clauseValue,
    otherDetails,
    description: detail.description ?? "",
  };
};

const buildExistingAmendmentFiles = (
  detail: AmendmentDetail,
): ContractAmendmentFile[] =>
  (detail.files ?? []).map((file) => ({
    name: file.name ?? "",
    url: file.url ?? "",
    type: file.type ?? "",
    size: file.size ?? "",
  }));

type Props = {
  contractId: string;
  currency?: string;
  isActive?: boolean;
  actionsDisabled?: boolean;
};

const AmendmentsTabContent: React.FC<Props> = ({
  contractId,
  currency,
  isActive,
  actionsDisabled,
}) => {
  const { isApprover, isVendor, isProjectManager, isManager, isAdmin, isViewOnly } =
    useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;

  const getBasePath = () => {
    if (isContractVendorLike) return `/contract/vendor/contracts/${contractId}/amendment`;
    if (isApprover)
      return `/contract/approver/contracts/${contractId}/amendment`;
    if (isManager)
      return `/contract/manager/contracts/${contractId}/amendments`;
    if (isAdmin || isViewOnly)
      return `/contract/user/contracts/${contractId}/amendment`;
    return `/contract/user/contracts/${contractId}/amendment`; // Default fallback
  };

  const basePath = getBasePath();

  const statsQueryKey = ["contract-amendments-stats", contractId, basePath];
  const amendmentsQueryKey = ["contract-amendments", contractId, basePath];

  const { data: statsRes, isLoading: isStatsLoading } = useQuery<
    ApiResponse<ContractAmendmentStatsDTO>,
    ApiResponseError
  >({
    queryKey: statsQueryKey,
    queryFn: async () => {
      const res = await getRequest({
        url: `${basePath}/stats`,
      });
      return res as any;
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const { data: amendmentsRes, isLoading: isAmendmentsLoading } = useQuery<
    {
      message?: string;
      data?: { data: ContractAmendmentDTO[]; message: string };
    },
    ApiResponseError
  >({
    queryKey: amendmentsQueryKey,
    queryFn: async () => {
      const res = await getRequest({
        url: basePath,
      });
      return res as any;
    },
    enabled: Boolean(contractId) && !!isActive,
  });

  const amendmentsRows = React.useMemo<AmendmentRow[]>(() => {
    const amendments = amendmentsRes?.data?.data ?? [];
    const normalizeVendorStatus = (
      value?: string,
    ): AmendmentRow["vendorStatus"] => {
      const normalized = value?.toLowerCase();
      if (normalized === "accepted" || normalized === "approved")
        return "Accepted";
      if (normalized === "rejected") return "Rejected";
      return "Pending";
    };
    const normalizeStatus = (value?: string): AmendmentRow["status"] => {
      const normalized = value?.toLowerCase();
      if (normalized === "approved" || normalized === "accepted")
        return "Approved";
      if (normalized === "rejected") return "Rejected";
      return "Pending";
    };

    // console.log("amendments", amendments)

    return amendments?.map?.((amendment, index) => {
      const id = amendment._id || amendment.amendmentId || '';
      const amendmentId =
        amendment.amendmentId || amendment._id || `AM-${index + 1}`;
      const amendmentTitle = amendment.title || amendment.amendmentTitle || "-";
      return {
        id,
        amendmentId,
        amendmentTitle,
        vendorStatus: normalizeVendorStatus(amendment.vendorStatus),
        status: normalizeStatus(amendment.status),
      };
    });
  }, [amendmentsRes?.data]);

  return (
    <TabsContent value="amendments" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">Amendments</h3>
        <div className="flex items-center gap-4">
          <ExportReportSheet contractId={contractId} contractType="Contract">
            <Button
              variant="outline"
              className="rounded-xl border-[#E5E7EB] dark:border-slate-700 px-4 text-base font-semibold text-[#0F0F0F] dark:text-slate-100"
            >
              <img
                src="/assets/contract-management/amendments/share.svg"
                className="mr-2 h-5 w-5"
                alt=""
              />
              Export Report
            </Button>
          </ExportReportSheet>

          {isManager && (
            <CreateAmendmentDialog
              contractId={contractId}
              trigger={
                <Button
                  className="rounded-xl bg-[#2A4467] px-4 text-base font-semibold text-white hover:bg-[#2A4467]/90"
                  disabled={!!actionsDisabled}
                >
                  <img
                    src="/assets/contract-management/amendments/plus.svg"
                    className="mr-2 h-5 w-5"
                    alt=""
                  />
                  Create Amendment
                </Button>
              }
            />
          )}
        </div>
      </div>

      <AmendmentsStatsCards stats={statsRes?.data?.data} isLoading={isStatsLoading} />

      <AmendmentsTable
        rows={amendmentsRows}
        isLoading={isAmendmentsLoading}
        contractId={contractId}
        currency={currency}
        basePath={basePath}
        listInvalidateQueryKey={amendmentsQueryKey}
        statsInvalidateQueryKey={statsQueryKey}
        approverPoolPath={`/contract/manager/contracts/${contractId}/approvers`}
        renderManagerRejectedAction={({ detail, onSubmitted, trigger }) => (
          <CreateAmendmentDialog
            mode="edit"
            contractId={contractId}
            amendmentId={detail._id}
            updatePath={`/contract/manager/contracts/${contractId}/amendments/${detail._id}`}
            initialValues={buildEditAmendmentInitialValues(detail)}
            existingFiles={buildExistingAmendmentFiles(detail)}
            listInvalidateQueryKey={amendmentsQueryKey}
            statsInvalidateQueryKey={statsQueryKey}
            titleText="Modify Amendment"
            submitText="Resubmit Amendment"
            successText="Amendment Resubmitted Successfully"
            onSubmitted={onSubmitted}
            trigger={trigger}
          />
        )}
      />
    </TabsContent>
  );
};

export default AmendmentsTabContent;
