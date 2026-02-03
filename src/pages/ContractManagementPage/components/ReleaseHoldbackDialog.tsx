import React from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useFormContext, useWatch } from "react-hook-form";
import { Forge, Forger, useForge } from "@/lib/forge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TextArea, TextFileUploader, TextInput, TextSelect } from "@/components/layouts/FormInputs";

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
          <div className="text-xs font-medium text-[#9CA3AF]">{Math.ceil(file.size / 1024)} KB</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setValue("files", (value ?? []).filter((f) => f.name !== file.name))}
        className="inline-flex h-8 w-8 items-center justify-center text-[#9CA3AF]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ReleaseHoldbackDialog: React.FC<ReleaseHoldbackDialogProps> = ({ trigger }) => {
  const [open, setOpen] = React.useState(false);

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

  const onSubmit = (data: ReleaseHoldbackFormValues) => {
    void data;
    setOpen(false);
    reset();
  };

  const amountPlaceholder = releaseType === "Full Release" ? "Enter Title" : "Enter Amount";
  const isFullRelease = releaseType === "Full Release";

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
        className="max-h-[90vh] max-w-xl gap-0 overflow-hidden rounded-2xl border-0 p-0"
      >
        <Forge control={control} onSubmit={onSubmit} className="flex max-h-[90vh] flex-col">
          <div className="flex items-center justify-between px-6 pb-6 pt-8">
            <div className="text-xl font-semibold text-[#0F0F0F]">Release Holdback</div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
            <Forger
              name="releaseType"
              component={TextSelect}
              label="Release Type"
              placeholder="Partial  Release"
              options={[
                { label: "Partial  Release", value: "Partial Release" },
                { label: "Full Release", value: "Full Release" },
              ]}
            />

            <Forger
              name="amountToBeReleased"
              component={TextInput}
              placeholder={amountPlaceholder}
              disabled={isFullRelease}
              label="Amount to be Released"
            />

            <Forger
              name="description"
              component={TextArea}
              placeholder="Enter Title"
              rows={4}
              label="Description"
            />

            <div className="space-y-4">
              <div className="text-sm font-medium text-[#6B6B6B]">Upload Files</div>
              <Forger
                name="files"
                component={TextFileUploader}
                element={<UploadElement />}
                List={FilesListItem as any}
                containerClass="w-full"
                accept={
                  {
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
                  } as any
                }
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
              Back
            </button>
            <button
              type="submit"
              className="inline-flex h-10 min-w-[170px] items-center justify-center rounded-xl bg-[#2A4467] px-6 text-sm font-semibold text-white"
            >
              Release Holdback
            </button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default ReleaseHoldbackDialog;
