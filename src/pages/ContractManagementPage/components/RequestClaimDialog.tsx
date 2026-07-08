import React, { memo } from "react";
import { UploadCloud, X } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
import {
  TextArea,
  TextCurrencyInput,
  TextFileUploader,
  TextInput,
  TextSelect,
} from "@/components/layouts/FormInputs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest, putRequest } from "@/lib/axiosInstance";
import type { ApiResponse } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";

type Props = {
  trigger: React.ReactNode;
  createPath?: string;
  invalidateQueryKey?: readonly unknown[];
  /** "edit" resubmits a rejected claim via PUT. Requires editPath and
   *  initialClaim to prefill. Mirrors the CreateChangeDialog edit-mode
   *  contract. */
  mode?: "create" | "edit";
  editPath?: string;
  initialClaim?: {
    title?: string;
    type?: string;
    impact?: "time" | "cost" | "time_cost";
    time?: number | string;
    cost?: number | string;
    description?: string;
    files?: Array<{ name: string; url: string; type: string; size: string }>;
  };
  detailInvalidateQueryKey?: readonly unknown[];
};

type ClaimFormValues = {
  claimTitle: string;
  claimType: string;
  impactType: "time" | "cost" | "time_cost";
  timeImpact: string;
  costImpact: string;
  description: string;
  files: File[] | null;
};

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/zip": [".zip"],
  "image/png": [".png"],
  "image/jpeg": [".jpeg", ".jpg"],
} as const;

const uploadClaimFiles = async (files: File[] | null) => {
  if (!files || files.length === 0) return [];
  const formData = new FormData();
  files.forEach((file) => formData.append("file", file));
  const res = (await postRequest({
    url: "/upload",
    payload: formData,
    config: { headers: { "Content-Type": "multipart/form-data" } },
  })) as ApiResponse<
    Array<{ name: string; url: string; type: string; size: string }>
  >;
  return res?.data?.data ?? [];
};

const UploadElement = memo(() => (
  <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#9CA3AF] dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-8 text-center">
    <UploadCloud className="h-9 w-9 text-[#2A4467] dark:text-blue-300" />
    <div className="space-y-1">
      <div className="text-sm font-semibold text-[#2A4467] dark:text-blue-300">
        Drag &amp; Drop or Click to choose files
      </div>
      <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
        Supported formats: DOC, DOCX, PDF, XLS, XLSX, ZIP, PNG, JPEG
      </div>
    </div>
  </div>
));

const FilesListItem = memo(({ file }: { file: File }) => {
  const { control, setValue } = useFormContext<ClaimFormValues>();
  const value = useWatch({ control, name: "files" });
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-[#EAF1FB] dark:bg-slate-700">
          <UploadCloud className="h-5 w-5 text-[#2A4467] dark:text-blue-300" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-[#0F0F0F] dark:text-slate-100">
            {file.name}
          </div>
          <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
            {Math.ceil(file.size / 1024)} KB
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() =>
          setValue("files", (value ?? []).filter((f) => f.name !== file.name))
        }
        className="inline-flex h-8 w-8 items-center justify-center text-[#9CA3AF] dark:text-slate-400"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
});

const RequestClaimDialog: React.FC<Props> = ({
  trigger,
  createPath,
  invalidateQueryKey,
  mode = "create",
  editPath,
  initialClaim,
  detailInvalidateQueryKey,
}) => {
  const isEdit = mode === "edit" && !!editPath;
  const [open, setOpen] = React.useState(false);
  const qc = useQueryClient();
  const toast = useToastHandler();

  const stripCurrency = (raw: unknown): string => {
    if (raw == null) return "";
    return String(raw).replace(/[$,\s]/g, "");
  };

  const { control, setValue, watch, reset } = useForge<ClaimFormValues>({
    defaultValues: {
      claimTitle: initialClaim?.title ?? "",
      claimType: initialClaim?.type ?? "",
      impactType: initialClaim?.impact ?? "time",
      timeImpact:
        initialClaim?.time != null ? String(initialClaim.time) : "",
      costImpact:
        initialClaim?.cost != null ? String(initialClaim.cost) : "",
      description: initialClaim?.description ?? "",
      files: null,
    },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({
      claimTitle: initialClaim?.title ?? "",
      claimType: initialClaim?.type ?? "",
      impactType: initialClaim?.impact ?? "time",
      timeImpact:
        initialClaim?.time != null ? String(initialClaim.time) : "",
      costImpact:
        initialClaim?.cost != null ? String(initialClaim.cost) : "",
      description: initialClaim?.description ?? "",
      files: null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const impactType = watch("impactType");

  const buildPayload = async (data: ClaimFormValues) => {
    const uploaded = await uploadClaimFiles(data.files);
    const uploadedFiles = uploaded.map((f) => ({
      name: f.name,
      url: f.url,
      type: f.type,
      size: f.size,
    }));
    const files =
      uploadedFiles.length > 0
        ? uploadedFiles
        : isEdit && initialClaim?.files?.length
          ? initialClaim.files
          : undefined;
    return {
      title: data.claimTitle,
      type: data.claimType,
      impact: data.impactType,
      time:
        data.impactType === "time" || data.impactType === "time_cost"
          ? Number(stripCurrency(data.timeImpact))
          : undefined,
      cost:
        data.impactType === "cost" || data.impactType === "time_cost"
          ? Number(stripCurrency(data.costImpact))
          : undefined,
      description: data.description,
      files,
    };
  };

  const invalidateAll = async () => {
    if (invalidateQueryKey) {
      await qc.invalidateQueries({ queryKey: invalidateQueryKey });
    }
    if (detailInvalidateQueryKey) {
      await qc.invalidateQueries({ queryKey: detailInvalidateQueryKey });
    }
  };

  const createMutation = useMutation({
    mutationKey: ["create-claim", createPath],
    mutationFn: async (data: ClaimFormValues) => {
      if (!createPath) throw new Error("Create claim endpoint unavailable");
      const payload = await buildPayload(data);
      const res = await postRequest({ url: createPath, payload });
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Claim", "Claim submitted successfully");
      await invalidateAll();
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Claim", error as any);
    },
  });

  const editMutation = useMutation({
    mutationKey: ["edit-claim", editPath],
    mutationFn: async (data: ClaimFormValues) => {
      if (!editPath) throw new Error("Edit claim endpoint unavailable");
      const payload = await buildPayload(data);
      const res = await putRequest({ url: editPath, payload });
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Claim", "Claim resubmitted successfully");
      await invalidateAll();
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Claim", error as any);
    },
  });

  const activeMutation = isEdit ? editMutation : createMutation;

  const handleClaimSubmit = (data: ClaimFormValues) => {
    activeMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <div className="flex items-center justify-between px-8 pt-8">
          <DialogTitle className="text-xl font-semibold text-[#0F0F0F]">
            {isEdit ? "Resubmit Claim" : "Create Claim"}
          </DialogTitle>
        </div>
        <div className="px-8 pb-8 pt-6">
          <Forge<ClaimFormValues>
            control={control}
            onSubmit={handleClaimSubmit}
            className="space-y-5"
          >
            <Forger
              name="claimTitle"
              label="Claim Title"
              placeholder="Enter Title"
              component={TextInput}
            />
            <Forger
              name="claimType"
              label="Claim Type"
              placeholder="Select Type"
              component={TextSelect}
              options={[
                {
                  label: "Vendor-caused Delay",
                  value: "vendor_delay",
                },
                { label: "Scope Change", value: "scope_change" },
                {
                  label: "Weather Conditions",
                  value: "weather_conditions",
                },
                { label: "Force Majeure", value: "force_majeure" },
                {
                  label: "Regulatory Change",
                  value: "regulatory_change",
                },
                { label: "Error / Omission", value: "error" },
                { label: "Warranty Claim", value: "warranty" },
                {
                  label: "Other (requires explanation)",
                  value: "other",
                },
              ]}
            />
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-6">
                <button
                  type="button"
                  onClick={() => setValue("impactType", "time")}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      impactType === "time"
                        ? "border-[#2A4467] bg-[#F9FAFB]"
                        : "border-[#E5E7EB] bg-white"
                    }`}
                  >
                    {impactType === "time" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2A4467]" />
                    )}
                  </span>
                  <span className="text-sm font-semibold text-[#374151]">
                    Time Impact
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("impactType", "cost")}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      impactType === "cost"
                        ? "border-[#2A4467] bg-[#F9FAFB]"
                        : "border-[#E5E7EB] bg-white"
                    }`}
                  >
                    {impactType === "cost" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2A4467]" />
                    )}
                  </span>
                  <span className="text-sm font-semibold text-[#374151]">
                    Cost Impact
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("impactType", "time_cost")}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      impactType === "time_cost"
                        ? "border-[#2A4467] bg-[#F9FAFB]"
                        : "border-[#E5E7EB] bg-white"
                    }`}
                  >
                    {impactType === "time_cost" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2A4467]" />
                    )}
                  </span>
                  <span className="text-sm font-semibold text-[#374151]">
                    Time & Cost Impact
                  </span>
                </button>
              </div>
              {impactType === "time" && (
                <Forger
                  name="timeImpact"
                  label="Time"
                  placeholder="Enter no. of days"
                  component={TextInput}
                />
              )}
              {impactType === "cost" && (
                <Forger
                  name="costImpact"
                  label="Cost"
                  placeholder="Enter Amount"
                  component={TextCurrencyInput}
                />
              )}
              {impactType === "time_cost" && (
                <div className="grid grid-cols-2 gap-4">
                  <Forger
                    name="timeImpact"
                    label="Time"
                    placeholder="Enter Date"
                    component={TextInput}
                  />
                  <Forger
                    name="costImpact"
                    label="Cost"
                    placeholder="Enter Amount"
                    component={TextCurrencyInput}
                  />
                </div>
              )}
            </div>
            <Forger
              name="description"
              label="Description"
              placeholder="Enter Detail"
              component={TextArea}
              rows={4}
            />
            <div className="space-y-2">
              <div className="text-sm font-medium text-[#374151]">
                Supporting Documents
              </div>
              <Forger
                name="files"
                component={TextFileUploader}
                element={<UploadElement />}
                List={FilesListItem as any}
                containerClass="w-full"
                accept={ACCEPTED_FILE_TYPES as any}
                dropzoneOptions={{ multiple: true }}
              />
            </div>
            <div className="flex items-center gap-4 pt-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex-1 rounded-xl border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] hover:bg-[#E5E7EB]"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  activeMutation.isPending ||
                  (isEdit ? !editPath : !createPath)
                }
                className="h-12 flex-1 rounded-xl bg-[#2A4467] text-base font-semibold text-white hover:bg-[#1f3552]"
              >
                {activeMutation.isPending
                  ? isEdit
                    ? "Resubmitting..."
                    : "Submitting..."
                  : isEdit
                    ? "Resubmit Claim"
                    : "Submit Claim"}
              </Button>
            </div>
          </Forge>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestClaimDialog;
