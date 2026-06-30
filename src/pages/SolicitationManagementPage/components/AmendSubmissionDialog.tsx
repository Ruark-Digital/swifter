import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TextFileUploader } from "@/components/layouts/FormInputs/TextFileInput";
import { TextArea } from "@/components/layouts/FormInputs/TextInput";
import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import { Upload, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { putRequest, postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { useForge, Forge, Forger, useForgeValues } from "@adexdsamson/forge";
import { useWatch } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

interface UploadFileResponse {
  name: string;
  url: string;
  type: string;
  size: string;
  uploadedAt: string;
}

interface AmendSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
  proposalId: string;
  requirementDocId: string;
  fileId: string;
  onAmendSuccess?: () => void;
}

// Form validation schema
const amendSubmissionSchema = yup.object({
  action: yup.string().required("Please select an action"),
  reason: yup.string().required("Please provide a reason for the amendment"),
  files: yup.array().of(yup.mixed<File>()).min(1, "Please select a file to upload"),
});

type AmendSubmissionFormData = yup.InferType<typeof amendSubmissionSchema>;

function FileUploadElement() {
  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <Upload className="h-6 w-6 text-blue-500 dark:text-blue-400 mb-4" />
      <div className="text-center">
        <p className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
          Drag & Drop or Click to choose file
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Supported formats: DOC, PDF, XLS, XLSX, ZIP, PNG, JPEG
        </p>
      </div>
    </div>
  );
}

const AmendSubmissionDialog: React.FC<AmendSubmissionDialogProps> = ({
  open,
  fileId,
  onOpenChange,
  documentName,
  proposalId,
  requirementDocId,
  onAmendSuccess,
}) => {
  const toast = useToastHandler();
  
  // Initialize form with forge
  const { control, reset, formState: { errors, isSubmitting } } = useForge<AmendSubmissionFormData>({
    resolver: yupResolver(amendSubmissionSchema),
    defaultValues: {
      action: "amend",
      reason: "",
      files: [],
    },
  });
  
  // Get setValue function from useForgeValues
  const { setValue } = useForgeValues({ control });
  
  // Watch form values
  const selectedFiles = useWatch({ control, name: "files" });
  const selectedAction = useWatch({ control, name: "action" });

  // Action options based on API documentation
  const actionOptions = [
    { label: "Amend - Replace existing files", value: "amend" },
    { label: "Update - Add new files", value: "update" },
  ];

  // Upload files mutation
  const uploadFilesMutation = useMutation<
    ApiResponse<UploadFileResponse[]>,
    ApiResponseError,
    FormData
  >({
    mutationFn: async (formData: FormData) => {
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

  // Amend submission mutation
  const amendSubmissionMutation = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    { reason: string; files: UploadFileResponse[]; fileId?: string }
  >({
    mutationFn: async ({ reason, files, fileId }) => {
      const payload: any = {
        reason,
        files: files,
      };
      
      // Add fileId if provided (for amend action)
      if (fileId) {
        payload.fileId = fileId;
      }
      
      return await putRequest({
        url: `/procurement/solicitations/proposals/${proposalId}/submissions/${requirementDocId}/${selectedAction || 'amend'}`,
        payload,
      });
    },
    onSuccess: () => {
      toast.success("Document amended successfully", "Success");
      handleClose();
      onAmendSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to amend document", "Error");
    },
  });

  const handleRemoveFile = (index: number) => {
    const currentFiles = selectedFiles || [];
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    // Update the form field using setValue from useForgeValues
    setValue("files", updatedFiles);
  };

  const onSubmit = async (data: AmendSubmissionFormData) => {
    try {
      // Handle potential undefined files array
      const files = data.files || [];
      
      if (files.length === 0) {
        toast.error("Please select a file to upload", "Error");
        return;
      }
      
      // First, upload the files
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("file", file as Blob);
      });
      
      const uploadResponse = await uploadFilesMutation.mutateAsync(formData);

      const payload: any = {
        reason: data.reason,
        files: uploadResponse.data.data || [],
      }

      if (selectedAction === "amend") {
        payload.fileId = fileId;
      }
      
      // Then, amend the submission with the uploaded file information
       await amendSubmissionMutation.mutateAsync(payload);
    } catch (error) {
      console.error("Amendment failed:", error);
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const acceptedFileTypes = {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "application/zip": [".zip"],
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
  };
  


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Amend Submission</DialogTitle>
        </DialogHeader>

        <Forge control={control} onSubmit={onSubmit}>
          <div className="space-y-6">
            {/* File to Amend */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">File to Amend</Label>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {documentName}
                </p>
              </div>
            </div>

            {/* Action Selection */}
            <Forger
              name="action"
              control={control}
              component={TextSelect}
              label={<>
                Action <span className="text-red-500 dark:text-red-400">*</span>
              </>}
              options={actionOptions}
              placeholder="Select action"
              error={errors.action?.message}
            />

            {/* New File Upload */}
            <Forger
              name="files"
              control={control}
              component={TextFileUploader}
              label={<>
                New File <span className="text-red-500 dark:text-red-400">*</span>
              </>}
              accept={acceptedFileTypes as any}
              dropzoneOptions={{
                multiple: false,
                maxFiles: 1,
              }}
              element={<FileUploadElement />}
              List={({ file, index }: { file: File; index: number }) => (
                <div className="flex items-center justify-between p-3 mt-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                      <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {file?.name || 'Unknown file'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file?.size ? (file.size / 1024).toFixed(1) : '0'} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              className="w-full"
              error={errors.files?.message}
            />


            
            {/* Reason/Note */}
            <Forger
              name="reason"
              control={control}
              component={TextArea}
              label={<>
                Reason / Note <span className="text-red-500 dark:text-red-400">*</span>
              </>}
              placeholder="Enter reason for amendment"
              rows={4}
              error={errors.reason?.message}
            />
          </div>

          <DialogFooter className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || amendSubmissionMutation.isPending || uploadFilesMutation.isPending}
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || amendSubmissionMutation.isPending || uploadFilesMutation.isPending}
              className="bg-[#2A4467] hover:bg-[#1e3147] dark:bg-[#3B5998] dark:hover:bg-[#2A4467] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || amendSubmissionMutation.isPending || uploadFilesMutation.isPending ? "Amending..." : "Amend"}
            </Button>
          </DialogFooter>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default AmendSubmissionDialog;