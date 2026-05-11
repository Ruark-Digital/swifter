import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TextArea,
  TextCurrencyInput,
  TextFileUploader,
  TextInput,
  TextSelect,
} from "@/components/layouts/FormInputs";
import Spinner from "@/components/ui/Spinner";
import { Forge, Forger, useForge } from "@/lib/forge";
import { formatFileSize, getSimpleFileExtension } from "@/lib/fileUtils";
import { useToastHandler } from "@/hooks/useToaster";
import { postRequest } from "@/lib/axiosInstance";
import type { ApiResponse, ApiResponseError } from "@/types";
import type { UploadURLs } from "@/pages/ContractManagementPage/lib/contractChanges";
import { Check, CloudUpload, FileText, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useWatch } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

type MsaUpdateSavingsFormValues = {
  title: string;
  amount: string;
  category: string;
  description: string;
  files: File[] | null;
};

const validationSchema = yup.object().shape({
  title: yup.string().required("Title is required"),
  amount: yup.string().required("Amount is required"),
  category: yup.string().required("Category is required"),
  description: yup.string().optional(),
  files: yup.mixed().nullable(),
});

const UploadElement = () => {
  return (
    <div className="flex flex-col items-center gap-3">
      <CloudUpload className="h-12 w-12 text-[#2A4467]" />
      <div className="space-y-1 text-center">
        <p className="text-base font-semibold text-[#2A4467]">
          Drag &amp; Drop or Click to choose files
        </p>
        <p className="text-sm text-[#6B7280]">
          Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
        </p>
      </div>
    </div>
  );
};

const MsaUpdateSavingsDialog: React.FC<{
  trigger: React.ReactElement;
  contractId: string;
}> = ({ trigger, contractId }) => {
  const [open, setOpen] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const toastHandler = useToastHandler();
  const queryClient = useQueryClient();
  const savingsQueryKey = useUserQueryKey(["msa-payment-savings", contractId]);

  const { control, reset, setValue } = useForge<MsaUpdateSavingsFormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      title: "",
      amount: "",
      category: "",
      description: "",
      files: null,
    },
  });

  const value = useWatch({ control, name: "files" }) as File[];

  const { mutateAsync: uploadFile } = useMutation<
    ApiResponse<UploadURLs[]>,
    ApiResponseError,
    { file: File }
  >({
    mutationKey: ["msa-uploadSavingFile"],
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
    mutationKey: ["msa-createPaymentSaving", contractId],
    mutationFn: async (payload: any) => {
      const res = await postRequest({
        url: `/contract/manager/msa-contract/${contractId}/payment-savings`,
        payload,
      });
      return res.data as { message?: string };
    },
    onSuccess: async () => {
      setOpen(false);
      setSuccessOpen(true);
      reset();
      await queryClient.invalidateQueries({ queryKey: savingsQueryKey });
    },
    onError: (error: ApiResponseError) => {
      toastHandler.error("Error", error);
    },
  });

  const handleSubmit = async (data: MsaUpdateSavingsFormValues) => {
    setIsSubmitting(true);
    try {
      let uploadedFiles: {
        name: string;
        url: string;
        type: string;
        size: string;
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
                size: res.data?.data?.[0].size ?? "",
              };
            }
            return null;
          })
          .filter(Boolean) as any;
      }

      const payload = {
        title: data.title,
        amount: Number(data.amount),
        category: data.category,
        description: data.description,
        files: uploadedFiles,
      };

      await createMutation.mutateAsync(payload);
    } catch (error) {
      toastHandler.error(
        "Submission Failed",
        "An error occurred while submitting the form. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileListItem = ({ file }: { file: File }) => {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">
              {getSimpleFileExtension(file.name).toUpperCase()} •{" "}
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            setValue(
              "files",
              (value || []).filter((v: File) => v.name !== file.name),
            )
          }
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <>
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
        <DialogContent
          showCloseButton={false}
          className="max-h-[90vh] w-full max-w-xl gap-0 overflow-hidden rounded-2xl border-0 p-0"
        >
          <DialogTitle className="sr-only">Update Savings Realized</DialogTitle>
          <Forge
            control={control}
            onSubmit={handleSubmit}
            className="flex max-h-[90vh] flex-col"
          >
            <div className="flex items-center justify-between px-8 pb-2 pt-8">
              <div className="text-xl font-semibold text-[#0F0F0F]">
                Update Savings Realized
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setOpen(false)}
                disabled={isSubmitting}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#EF4444] disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-8 pb-8 pt-6">
              <Forger
                name="title"
                label="Title"
                placeholder="Enter Title"
                component={TextInput}
              />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Forger
                  name="amount"
                  label="Amount"
                  placeholder="Enter Amount"
                  component={TextCurrencyInput}
                />
                <Forger
                  name="category"
                  label="Category"
                  placeholder="Select Category"
                  component={TextSelect}
                  options={[
                    { label: "Direct Negotiations", value: "Direct Negotiations" },
                    { label: "Indirect Savings", value: "Indirect Savings" },
                    { label: "Cost Avoidance", value: "Cost Avoidance" },
                    { label: "Value Engineering", value: "Value Engineering" },
                    {
                      label: "Working Capital Optimization",
                      value: "Working Capital Optimization",
                    },
                    {
                      label: "Total Cost Of Ownership Savings",
                      value: "Total Cost Of Ownership Savings",
                    },
                    {
                      label: "Spend Under Management Savings.",
                      value: "Spend Under Management Savings.",
                    },
                  ]}
                />
              </div>
              <Forger
                name="description"
                label="Description"
                placeholder="Enter Amount"
                component={TextArea}
                rows={5}
              />
              <div className="space-y-4">
                <div className="text-sm font-medium text-[#6B6B6B]">
                  Upload Files
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

            <div className="flex items-center justify-end gap-4 px-8 pb-8">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="inline-flex h-11 min-w-[140px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 min-w-[170px] items-center justify-center rounded-xl bg-[#2A4467] px-6 text-base font-semibold text-white disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="h-4 w-4 text-white" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  "Update"
                )}
              </button>
            </div>
          </Forge>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-full max-w-md rounded-2xl border-0 px-8 py-10"
        >
          <DialogTitle className="sr-only">Savings Updated Successfully</DialogTitle>
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#22C55E] text-[#22C55E]">
              <Check className="h-8 w-8" />
            </div>
            <div className="text-base font-semibold text-[#0F0F0F]">
              Savings Updated Successfully
            </div>
            <div className="flex w-full items-center gap-4">
              <button
                type="button"
                onClick={() => setSuccessOpen(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setSuccessOpen(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#2A4467] text-base font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MsaUpdateSavingsDialog;
