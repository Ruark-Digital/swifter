import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CloudUpload, X } from "lucide-react";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
import {
  TextArea,
  TextDatePicker,
  TextFileUploader,
  TextInput,
} from "@/components/layouts/FormInputs";
import { postRequest } from "@/lib/axiosInstance";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import { formatFileSize } from "@/lib/fileUtils";

type SubmitCapaDialogProps = {
  trigger: React.ReactNode;
  contractId: string;
  ncrId: string;
  ncrTitle?: string;
  basePath: string;
  listInvalidateQueryKey?: readonly unknown[];
  statsInvalidateQueryKey?: readonly unknown[];
};

function FileListItem({ file }: { file: File }) {
  const { setValue, getValues } = useFormContext();
  const handleRemove = () => {
    const current = (getValues("files") as File[] | undefined) || [];
    setValue(
      "files",
      current.filter((f: File) => f.name !== file.name) as any,
    );
  };
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-[#EAF1FB] dark:bg-slate-700">
          <CloudUpload className="h-5 w-5 text-[#2A4467] dark:text-blue-300" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-[#0F0F0F] dark:text-slate-100">
            {file.name}
          </div>
          <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
            {formatFileSize(file.size)}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleRemove}
        className="inline-flex h-8 w-8 items-center justify-center text-[#9CA3AF] dark:text-slate-400"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

const SubmitCapaDialog: React.FC<SubmitCapaDialogProps> = ({
  trigger,
  contractId,
  ncrId,
  ncrTitle,
  basePath,
  listInvalidateQueryKey,
  statsInvalidateQueryKey,
}) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const { control, reset, setValue } = useForge({
    defaultValues: {
      title: ncrTitle ?? "",
      timeline: undefined,
      description: "",
      files: null as File[] | null,
    },
  });

  React.useEffect(() => {
    setValue("title", ncrTitle ?? "");
  }, [ncrTitle, setValue]);

  const uploadFiles = async (fileList: File[] | null) => {
    if (!fileList || fileList.length === 0) return [];
    const formData = new FormData();
    fileList.forEach((f) => formData.append("file", f));
    const res = (await postRequest({
      url: "/upload",
      payload: formData,
      config: { headers: { "Content-Type": "multipart/form-data" } },
    })) as any;
    return res?.data?.data ?? [];
  };

  const submitCapaMutation = useMutation({
    mutationKey: [
      "contractNcrs",
      "capa",
      "create",
      contractId,
      ncrId,
      basePath,
    ],
    mutationFn: async (data: {
      title: string;
      timeline?: string;
      description?: string;
      files: File[] | null;
    }) => {
      const uploaded = await uploadFiles(data.files);
      const payload = {
        title: data.title,
        timeline: data.timeline,
        description: data.description,
        files:
          uploaded && uploaded.length > 0
            ? uploaded.map((f: any, i: number) => ({
                name: f.name,
                url: f.url,
                type: f.type,
                size: String((data.files?.[i] as File)?.size ?? "-"),
              }))
            : undefined,
      };

      const res = await postRequest({
        url: `${basePath}/${ncrId}/capa`,
        payload,
      });
      return res.data;
    },
    onSuccess: async () => {
      setOpen(false);
      reset();
      await queryClient.invalidateQueries({
        queryKey: ["contractNcrs", "detail", contractId, ncrId],
      });
      if (listInvalidateQueryKey) {
        await queryClient.invalidateQueries({ queryKey: listInvalidateQueryKey });
      }
      if (statsInvalidateQueryKey) {
        await queryClient.invalidateQueries({ queryKey: statsInvalidateQueryKey });
      }
    },
  });

  const triggerElement = React.useMemo(() => {
    if (React.isValidElement(trigger)) {
      const existingOnClick = trigger.props.onClick as
        | ((event: React.MouseEvent<HTMLElement>) => void)
        | undefined;

      return React.cloneElement(trigger, {
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          existingOnClick?.(event);
          if (!event.defaultPrevented) {
            setOpen(true);
          }
        },
      });
    }

    return (
      <Button type="button" onClick={() => setOpen(true)}>
        {trigger}
      </Button>
    );
  }, [trigger]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerElement}
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <div className="flex items-center justify-between px-8 pt-8">
          <DialogTitle className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">
            Submit Corrective Action and Preventive Action
          </DialogTitle>
        </div>
        <div className="px-8 pb-8 pt-2">
          <p className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100 mb-3">
            Corrective Action and Preventive Action
          </p>
          <Forge
            control={control}
            onSubmit={(d: any) =>
              submitCapaMutation.mutate({
                title: d.title,
                timeline:
                  d.timeline && typeof d.timeline?.toISOString === "function"
                    ? d.timeline.toISOString()
                    : d.timeline,
                description: d.description,
                files: d.files,
              })
            }
            className="space-y-5"
          >
            <Forger
              name="title"
              label="NCR Title"
              placeholder="Enter Title"
              component={TextInput}
              disabled
            />
            <Forger
              name="timeline"
              label="Timeline"
              placeholder="Enter Date"
              component={TextDatePicker}
            />
            <Forger
              name="description"
              label="Description / Response"
              placeholder="Enter Detail"
              component={TextArea}
              rows={5}
            />
            <Forger
              name="files"
              label="Upload Files"
              component={TextFileUploader}
              List={FileListItem}
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
              className="rounded-xl border-2 border-dashed border-[#9CA3AF] dark:border-slate-600 bg-white dark:bg-slate-800"
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
            <div className="flex items-center gap-4 pt-2">
              <DialogClose asChild>
                <button
                  type="button"
                  className="h-12 min-w-20 flex-1 rounded-xl border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] hover:bg-[#E5E7EB] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </DialogClose>
              <Button
                type="submit"
                disabled={submitCapaMutation.isPending}
                className="h-12 flex-1 rounded-xl bg-[#2A4467] text-base font-semibold text-white hover:bg-[#1f3552]"
              >
                {submitCapaMutation.isPending
                  ? "Submitting..."
                  : "Send Response"}
              </Button>
            </div>
          </Forge>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitCapaDialog;
