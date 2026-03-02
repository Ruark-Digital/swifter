import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CloudUpload, X } from "lucide-react";
import { Forge, Forger, useForge } from "@/lib/forge";
import {
  TextArea,
  TextDatePicker,
  TextFileUploader,
  TextInput,
  TextSelect,
} from "@/components/layouts/FormInputs";
import { postRequest } from "@/lib/axiosInstance";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approverApi } from "../api/approverApi";
import { useWatch } from "react-hook-form";
import { formatFileSize } from "@/lib/fileUtils";

type SubmitCapaDialogProps = {
  trigger: React.ReactNode;
  contractId: string;
  ncrId: string;
  ncrTitle?: string;
};

const SubmitCapaDialog: React.FC<SubmitCapaDialogProps> = ({
  trigger,
  contractId,
  ncrId,
  ncrTitle,
}) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const { control, reset, setValue } = useForge({
    defaultValues: {
      title: ncrTitle ?? "",
      timeline: undefined,
      description: "",
      responderId: "",
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
      "approver",
      "contractNcrs",
      "capa",
      "create",
      contractId,
      ncrId,
    ],
    mutationFn: async (data: {
      title: string;
      timeline?: string;
      description?: string;
      responderId?: string;
      files: File[] | null;
    }) => {
      const uploaded = await uploadFiles(data.files);
      const payload = {
        title: data.title,
        timeline: data.timeline,
        description: data.description,
        responders: data.responderId ? [data.responderId] : undefined,
        files:
          uploaded && uploaded.length > 0
            ? uploaded.map((f: any, i: number) => ({
                name: f.name,
                url: f.url,
                type: f.type,
                size: String((data.files?.[i] as File)?.size ?? '-'),
              }))
            : undefined,
      };
      return await approverApi.createNcrCapa(contractId, ncrId, payload);
    },
    onSuccess: async () => {
      setOpen(false);
      reset();
      await queryClient.invalidateQueries({
        queryKey: ["approver", "contractNcrs", "detail", contractId, ncrId],
      });
    },
  });

  const FileListItem = ({ file }: { file: File; control: unknown }) => {
    const value = useWatch({ control, name: "files" }) as File[] | null;
    return (
      <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-white p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#EAF1FB]">
            <CloudUpload className="h-5 w-5 text-[#2A4467]" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-[#0F0F0F]">
              {file.name}
            </div>
            <div className="text-xs font-medium text-[#9CA3AF]">
              {formatFileSize(file.size)}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            setValue(
              "files",
              (value ?? []).filter((f) => f.name !== file.name) as any,
            )
          }
          className="inline-flex h-8 w-8 items-center justify-center text-[#9CA3AF]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <div className="flex items-center justify-between px-8 pt-8">
          <DialogTitle className="text-xl font-semibold text-[#0F0F0F]">
            Submit CAPA
          </DialogTitle>
          <DialogClose asChild>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FCA5A5] text-[#EF4444]"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </div>
        <div className="px-8 pb-8 pt-2">
          <p className="text-sm font-semibold text-[#0F0F0F] mb-3">
            Corrective & Preventive Action Plan
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
                responderId: d.responderId,
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
              name="responderId"
              label="Select Responder (Could be the issuer)"
              placeholder="Select Responder"
              component={TextSelect}
              options={[]}
            />
            <Forger
              name="files"
              label="Upload Files"
              component={TextFileUploader}
              List={FileListItem}
              element={
                <div className="flex flex-col items-center gap-3">
                  <CloudUpload className="h-12 w-12 text-[#2A4467]" />
                  <div className="space-y-1 text-center">
                    <p className="text-base font-semibold text-[#2A4467]">
                      Drag & Drop or Click to choose files
                    </p>
                    <p className="text-sm text-[#6B7280]">
                      Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
                    </p>
                  </div>
                </div>
              }
              className="rounded-xl border-2 border-dashed border-[#9CA3AF] bg-white"
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
                  className="h-12 min-w-20 flex-1 rounded-xl border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] hover:bg-[#E5E7EB]"
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
