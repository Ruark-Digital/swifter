import React from "react";
import { UploadCloud, X } from "lucide-react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
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
import { getRequest, postRequest } from "@/lib/axiosInstance";
import type { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  basePath: string;
  /** Contract-scoped personnel endpoint (role-branched by the caller, same as
   *  the RFI tab). Responder options are fetched from here; the `contract`
   *  prop's approvers/internalTeam/personnel are only a fallback. */
  personnelPath?: string;
  listInvalidateQueryKey?: readonly unknown[];
  statsInvalidateQueryKey?: readonly unknown[];
};

type PersonnelEntry = {
  _id?: string;
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

const UploadElement = memo(() => {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#9CA3AF] dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-10 text-center">
      <UploadCloud className="h-10 w-10 text-[#2A4467] dark:text-blue-300" />
      <div className="space-y-1">
        <div className="text-sm font-semibold text-[#2A4467] dark:text-blue-300">
          Drag &amp; Drop or Click to choose files
        </div>
        <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
          Supported formats: DOC, DOCX, PDF, XLS, XLSX, ZIP, PNG, JPEG
        </div>
      </div>
    </div>
  );
});

const FilesListItem = memo(({ file, index }: { file: File; index?: number }) => {
  // TextFileUploader passes { file, control, index } to the List slot, so we
  // pull the live value via useWatch and splice by index. Index is safer than
  // name-based filter because dropzone allows duplicate filenames.
  const { setValue } = useFormContext<CreateNcrFormValues>();
  const value = useWatch({ name: "files" }) as File[] | null | undefined;

  const handleRemove = () => {
    if (typeof index !== "number") return;
    const next = (value ?? []).filter((_, i) => i !== index);
    setValue("files", next.length > 0 ? next : null, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

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
        onClick={handleRemove}
        className="inline-flex h-8 w-8 items-center justify-center text-[#9CA3AF] dark:text-slate-400 hover:text-red-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
});

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
    ".xlsls",
  ],
  "application/zip": [".zip"],
  "image/png": [".png"],
  "image/jpeg": [".jpeg", ".jpg"],
} as const;

const CreateNcrDialog: React.FC<Props> = ({
  contractId,
  trigger,
  contract,
  basePath,
  personnelPath,
  listInvalidateQueryKey,
  statsInvalidateQueryKey,
}) => {
  const [open, setOpen] = React.useState(false);
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  // Responder list comes from the contract-scoped personnel endpoint (same
  // source the RFI tab uses), fetched only while the dialog is open.
  const { data: personnelRes } = useQuery<
    ApiResponse<PersonnelEntry[]>,
    ApiResponseError
  >({
    queryKey: ["ncr-responder-personnel", personnelPath],
    queryFn: async () => await getRequest({ url: personnelPath as string }),
    enabled: open && !!personnelPath,
  });

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
    files.forEach((file) => formData.append("file", file));
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

  const createNcrMutation = useMutation({
    mutationKey: ["contractNcrs", "create", contractId, basePath],
    mutationFn: async (data: CreateNcrFormValues) => {
      const uploaded = await uploadFiles(data.files);
      const sizeMap = new Map<string, number>(
        (data.files ?? []).map((f) => [f.name, f.size]),
      );
      const payload: any = {
        title: data.title,
        description: data.description,
        responder: data.responderId,
        files:
          uploaded && uploaded.length > 0
            ? uploaded.map((f) => ({
                name: f.name,
                url: f.url,
                type: f.type,
                size: String(sizeMap.get(f.name) ?? 0),
              }))
            : undefined,
      };
      
      const res = await postRequest({
        url: basePath,
        payload
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Success", "NCR created successfully");
      queryClient.invalidateQueries({
        queryKey: listInvalidateQueryKey ?? ["contractNcrs", contractId],
      });
      if (statsInvalidateQueryKey) {
        queryClient.invalidateQueries({ queryKey: statsInvalidateQueryKey });
      }
      setOpen(false);
      reset();
    },
    onError: () => {
      toast.error("Error", "Failed to create NCR");
    },
  });

  const onSubmit = useCallback(
    (data: CreateNcrFormValues) => {
      createNcrMutation.mutate(data);
    },
    [createNcrMutation],
  );

  const responderOptions = useMemo(() => {
    const toOption = (u: PersonnelEntry) => {
      const fullName = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
      return {
        value: u?._id ?? u?.id ?? u?.email ?? "",
        label: u?.name ?? (fullName || u?.email) ?? "",
      };
    };

    // Primary source: the contract-scoped personnel endpoint.
    const personnel = Array.isArray(personnelRes?.data?.data)
      ? personnelRes?.data?.data ?? []
      : [];
    let options = personnel.map(toOption);

    // The personnel endpoint doesn't consistently include vendor-side
    // personnel (e.g. Vendor PM) for every role, so always merge in the
    // contract prop's vendor personnel too — dedup below handles overlap.
    const vendorPersonnel = Array.isArray(contract?.personnel)
      ? contract?.personnel
      : Array.isArray(contract?.vendorPersonnel)
      ? contract?.vendorPersonnel
      : [];
    options = [...options, ...vendorPersonnel.map((u) => toOption(u as PersonnelEntry))];

    // Fallback: derive from the contract detail object when personnel hasn't
    // loaded / returned nothing (e.g. endpoint unavailable for a role).
    if (options.length === 0) {
      const a = Array.isArray(contract?.approvers) ? contract?.approvers : [];
      const i = Array.isArray(contract?.internalTeam) ? contract?.internalTeam : [];
      options = [...a, ...i, ...vendorPersonnel].map((u) => toOption(u as PersonnelEntry));
    }

    const valid = options.filter(
      (opt) =>
        typeof opt.value === "string" &&
        opt.value !== "" &&
        typeof opt.label === "string" &&
        opt.label !== "",
    );
    const seen = new Set<string>();
    return valid.filter((opt) => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [personnelRes?.data?.data, contract]);

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
            <div className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">Create NCR</div>
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
              <div className="text-sm font-medium text-[#6B6B6B] dark:text-slate-300">Upload Files</div>
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
              className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 text-sm font-semibold text-[#0F0F0F] dark:text-slate-100 hover:bg-[#E5E7EB] dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createNcrMutation.isPending}
              className="inline-flex h-10 min-w-[170px] items-center justify-center rounded-xl bg-[#2A4467] px-6 text-sm font-semibold text-white"
            >
              {createNcrMutation.isPending ? "Submitting..." : "Create NCR"}
            </button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNcrDialog;
