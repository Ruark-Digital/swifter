import React from "react";
import { UploadCloud, X } from "lucide-react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Forge, Forger, useForge } from "@/lib/forge";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TextArea,
  TextFileUploader,
  TextInput,
  TextSelect,
} from "@/components/layouts/FormInputs";
import { useFormContext, useWatch } from "react-hook-form";
import { postRequest } from "@/lib/axiosInstance";
import type { ApiResponse } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { cn } from "@/lib/utils";
import { approverApi } from "../api/approverApi";
import { useQueryClient } from "@tanstack/react-query";
import type { ContractDetail } from "@/types";
import { memo, useCallback, useMemo } from "react";

type CreateNcrFormValues = {
  title: string;
  description: string;
  responderId?: string;
  files: File[] | null;
};

const schema = yup.object({
  title: yup.string().required("NCR Title is required"),
  description: yup.string().notRequired(),
  responderId: yup.string().notRequired(),
  files: yup.mixed().nullable().notRequired(),
});

type Props = {
  contractId: string;
  trigger: React.ReactElement;
  contract?: ContractDetail;
};

const UploadElement = memo(() => {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#9CA3AF] bg-white px-4 py-10 text-center">
      <UploadCloud className="h-10 w-10 text-[#2A4467]" />
      <div className="space-y-1">
        <div className="text-sm font-semibold text-[#2A4467]">
          Drag &amp; Drop or Click to choose files
        </div>
        <div className="text-xs font-medium text-[#9CA3AF]">
          Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
        </div>
      </div>
    </div>
  );
});

const FilesListItem = memo(({ file }: { file: File }) => {
  const { control, setValue } = useFormContext<CreateNcrFormValues>();
  const value = useWatch({ control, name: "files" });
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-[#EAF1FB]">
          <UploadCloud className="h-5 w-5 text-[#2A4467]" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-[#0F0F0F]">
            {file.name}
          </div>
          <div className="text-xs font-medium text-[#9CA3AF]">
            {Math.ceil(file.size / 1024)} KB
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() =>
          setValue("files", (value ?? []).filter((f) => f.name !== file.name))
        }
        className="inline-flex h-8 w-8 items-center justify-center text-[#9CA3AF]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
});

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
    ".xlsls",
  ],
  "application/zip": [".zip"],
  "image/png": [".png"],
  "image/jpeg": [".jpeg", ".jpg"],
} as const;

const CreateNcrDialog: React.FC<Props> = ({ contractId, trigger, contract }) => {
  const [open, setOpen] = React.useState(false);
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const { control, reset } = useForge<CreateNcrFormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      title: "",
      description: "",
      responderId: "",
      files: null,
    },
  });

  const uploadFiles = useCallback(async (files: File[] | null) => {
    if (!files || files.length === 0) return [];
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const res = (await postRequest({
      url: "/upload",
      payload: formData,
      config: { headers: { "Content-Type": "multipart/form-data" } },
    })) as ApiResponse<
      Array<{
        name: string;
        url: string;
        type: string;
        size: string;
        download: string;
      }>
    >;
    return res?.data?.data ?? [];
  }, []);

  const onSubmit = useCallback(async (data: CreateNcrFormValues) => {
    try {
      const uploaded = await uploadFiles(data.files);
      const payload = {
        title: data.title,
        description: data.description,
        responders: data.responderId ? [data.responderId] : undefined,
        files:
          uploaded && uploaded.length > 0
            ? uploaded.map((f) => ({
                name: f.name,
                url: f.url,
                type: f.type,
                size: f.size,
              }))
            : undefined,
      };
      await approverApi.createNcr(contractId, payload);
      toast.success("Success", "NCR created successfully");
      queryClient.invalidateQueries({
        queryKey: ["approver", "contractNcrs", contractId],
      });
      queryClient.refetchQueries({
        queryKey: ["approver", "contractNcrs", contractId],
      });
      setOpen(false);
      reset();
    } catch (error) {
      toast.error("Error", "Failed to process files");
    }
  }, [contractId, queryClient, reset, toast, uploadFiles]);

  const responderOptions = useMemo(() => {
    const a = Array.isArray(contract?.approvers) ? contract?.approvers : [];
    const i = Array.isArray(contract?.internalTeam) ? contract?.internalTeam : [];
    const m = Array.isArray(contract?.managers) ? contract?.managers : [];
    const fromApprovers = a.map((u) => ({
      value: (u as any)?.id ?? (u as any)?._id ?? (u as any)?.email ?? "",
      label: (u as any)?.name ?? (u as any)?.email ?? "",
    }));
    const fromInternal = i.map((u) => ({
      value: (u as any)?.id ?? (u as any)?._id ?? (u as any)?.email ?? "",
      label: (u as any)?.name ?? (u as any)?.email ?? "",
    }));
    const fromManagers = m.map((u) => ({
      value: (u as any)?._id ?? (u as any)?.id ?? (u as any)?.user ?? (u as any)?.email ?? "",
      label: (u as any)?.name ?? (u as any)?.email ?? "",
    }));
    const merged = [...fromApprovers, ...fromInternal, ...fromManagers].filter(
      (opt) =>
        typeof opt.value === "string" &&
        opt.value !== "" &&
        typeof opt.label === "string" &&
        opt.label !== "",
    );
    const seen = new Set<string>();
    return merged.filter((opt) => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [contract]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "max-h-[90vh] max-w-xl gap-0 overflow-hidden rounded-2xl border-0 p-0",
        )}
      >
        <Forge control={control} onSubmit={onSubmit} className="flex max-h-[90vh] flex-col">
          <div className="flex items-center justify-between px-6 pb-6 pt-8">
            <div className="text-xl font-semibold text-[#0F0F0F]">Create NCR</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FCA5A5] text-[#EF4444]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
            <Forger
              name="title"
              component={TextInput}
              placeholder="Enter Title"
              label="NCR Title"
            />

            <Forger
              name="description"
              component={TextArea}
              placeholder="Enter Detail"
              rows={4}
              label="Description"
            />

            <Forger
              name="responderId"
              component={TextSelect}
              placeholder="Select Responder"
              label="Select Responder (Could be the issuer)"
              options={responderOptions}
            />

            <div className="space-y-4">
              <div className="text-sm font-medium text-[#6B6B6B]">Upload Files</div>
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
          </div>

          <div className="flex items-center justify-end gap-4 px-6 py-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-sm font-semibold text-[#0F0F0F]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-10 min-w-[170px] items-center justify-center rounded-xl bg-[#2A4467] px-6 text-sm font-semibold text-white"
            >
              Create NCR
            </button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNcrDialog;
