import { useState } from "react";
import {
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forger, ForgeControl, useForge } from "@/lib/forge";
import {
  TextArea,
  TextInput,
  TextFileUploader,
} from "@/components/layouts/FormInputs";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileText, X } from "lucide-react";
import { formatFileSize, getSimpleFileExtension } from "@/lib/fileUtils";
import VendorReportSectionsDialog from "./VendorReportSectionsDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import type { ApiResponse, ApiResponseError } from "@/types";

type FormValues = {
  title: string;
  description?: string;
  mode: "manual" | "file";
  files?: File[];
};

const schema = yup.object({
  title: yup.string().required("Title is required"),
  description: yup.string().optional(),
  mode: yup.mixed<"manual" | "file">().oneOf(["manual", "file"]).required(),
  files: yup.mixed<File[]>().optional(),
});

const FilesListItem = ({
  file,
  value,
  onChange,
}: {
  file: File;
  value: File[];
  onChange: (name: string, files: File[]) => void;
}) => {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-[#EAF1FB]">
          <FileText className="h-5 w-5 text-[#2A4467]" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium max-w-xs text-[#0F0F0F]">
            {file.name}
          </div>
          <div className="text-xs font-medium text-[#9CA3AF]">
            {getSimpleFileExtension(file.name).toUpperCase()} •{" "}
            {formatFileSize(file.size)}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() =>
          onChange(
            "files",
            (value ?? []).filter((f) => f.name !== file.name),
          )
        }
        className="inline-flex h-8 w-8 items-center justify-center text-[#9CA3AF] hover:text-red-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export function CreateVendorReportForm({
  onSuccess,
  contractId,
}: {
  onSuccess?: () => void;
  contractId: string;
}) {
  const { control, handleSubmit, setValue, watch, reset } =
    useForge<FormValues>({
      resolver: yupResolver(schema),
      defaultValues: {
        title: "",
        description: "",
        mode: "file",
      },
    });

  const mode = watch("mode");
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const createReportMutation = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    {
      payload: {
        title: string;
        description?: string;
        files?: Array<{ name: string; url: string; type: string; size: string }>;
      };
    }
  >({
    mutationKey: ["vendor-create-report", contractId],
    mutationFn: async ({ payload }) =>
      await postRequest({
        url: `/contract/vendor/contracts/${contractId}/reports`,
        payload,
      }),
    onSuccess: () => {
      // optimistic: refetch vendor reports lists/stats
      queryClient.invalidateQueries({
        queryKey: ["vendor-reports", contractId],
      });
      queryClient.invalidateQueries({
        queryKey: ["vendor-reports-stats", contractId],
      });
    },
  });

  const submit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      let filesPayload:
        | Array<{ name: string; url: string; type: string; size: string }>
        | undefined;

      const rawFiles = (values as any).files as File[] | undefined | null;
      if (mode === "file" && rawFiles && rawFiles.length > 0) {
        const uploaded: Array<{ name: string; url: string; type: string; size: string }> = [];
        for (const file of rawFiles) {
          if (file instanceof File) {
            const formData = new FormData();
            formData.append("file", file);
            const res = await postRequest({
              url: "/upload",
              payload: formData,
              config: {
                headers: { "Content-Type": "multipart/form-data" },
              },
            });
            const data = res?.data?.data;
            if (Array.isArray(data) && data[0]) {
              uploaded.push({
                name: String(data[0].name),
                url: String(data[0].url),
                type: String(data[0].type),
                size: String(data[0].size),
              });
            } else {
              // Fallback: construct from File if API didn’t return
              uploaded.push({
                name: file.name,
                url: "",
                type: file.type || "application/octet-stream",
                size: formatFileSize(file.size),
              });
            }
          } else {
            // already-uploaded metadata (defensive)
            const anyFile = file as unknown as { name: string; url: string; type: string; size: string | number };
            uploaded.push({
              name: String(anyFile.name),
              url: String(anyFile.url),
              type: String(anyFile.type),
              size: typeof anyFile.size === "number" ? String(anyFile.size) : String(anyFile.size),
            });
          }
        }
        filesPayload = uploaded;
      }

      const payload = {
        title: values.title,
        description: values.description || "",
        ...(filesPayload ? { files: filesPayload } : {}),
      };

      await createReportMutation.mutateAsync({ payload });
      onSuccess?.();
      reset();
    } finally {
      setSubmitting(false);
    }
  });

  const [sectionsOpen, setSectionsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DialogHeader className="space-y-0">
          <DialogTitle className="text-xl font-semibold text-[#0F0F0F]">
            Create Report
          </DialogTitle>
        </DialogHeader>
      </div>

      <div className="space-y-4">
        <Forger
          name="title"
          label="Report Title"
          placeholder="Enter Title"
          containerClass="space-y-2"
          component={TextInput}
          control={control as unknown as ForgeControl<FormValues>}
        />

        <Forger
          name="description"
          label="Description"
          placeholder="Enter Detail"
          containerClass="space-y-2"
          component={TextArea}
          control={control as unknown as ForgeControl<FormValues>}
        />

        <div className="space-y-3">
          <div className="flex items-center gap-6">
            <RadioGroup
              value={mode}
              onValueChange={(val) =>
                setValue("mode", val as "manual" | "file")
              }
              className="flex items-center gap-6"
            >
              {/* <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="manual"
                  id="mode-manual"
                  className="h-5 w-5 border-2 data-[state=checked]:text-[#2A4467]"
                />
                <Label
                  htmlFor="mode-manual"
                  className="text-sm font-semibold text-[#374151]"
                >
                  Manual Input
                </Label>
              </div> */}
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="file"
                  id="mode-file"
                  className="h-5 w-5 border-2 data-[state=checked]:text-[#2A4467]"
                />
                <Label
                  htmlFor="mode-file"
                  className="text-sm font-semibold text-[#374151]"
                >
                  Upload File
                </Label>
              </div>
            </RadioGroup>
          </div>

          {mode === "file" ? (
            <Forger
              name="files"
              label=""
              component={TextFileUploader}
              control={control as unknown as ForgeControl<FormValues>}
              element={
                <div className="text-center text-sm text-slate-600">
                  <div className="font-medium">
                    Drop files here or click to upload
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    PDF, Images or Docs
                  </div>
                </div>
              }
              List={FilesListItem}
              containerClass=""
              className="border rounded-lg"
            />
          ) : (
            <>
              <VendorReportSectionsDialog
                open={sectionsOpen}
                onOpenChange={setSectionsOpen}
                control={control as unknown as ForgeControl<any>}
              />
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 rounded-xl border-[#E5E7EB] bg-[#F3F4F6] text-slate-900"
          >
            Cancel
          </Button>
        </DialogClose>
        <Button
          onClick={submit}
          disabled={submitting}
          className="h-12 flex-1 rounded-xl bg-[#2A4467] text-white"
        >
          Create Report
        </Button>
      </div>
    </div>
  );
}

export default function CreateVendorReportDialog({
  onSuccess,
  contractId,
}: {
  onSuccess?: () => void;
  contractId: string;
}) {
  return (
    <DialogContent
      className="rounded-2xl p-8"
      showCloseButton={false}
    >
      <CreateVendorReportForm onSuccess={onSuccess} contractId={contractId} />
    </DialogContent>
  );
}
