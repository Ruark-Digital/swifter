import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Upload,
  Users,
  FileIcon,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { TextDatePicker } from "@/components/layouts/FormInputs/TextInput";
import { TextArea } from "@/components/layouts/FormInputs/TextInput";
import { TextFileUploader } from "@/components/layouts/FormInputs/TextFileInput";
import { Progress } from "@/components/ui/progress";
import { Forge, Forger, useForge } from "@/lib/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postRequest, getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserRole } from "@/hooks/useUserRole";
import { cn, formatDateTZ } from "@/lib/utils";
import { format } from "date-fns";

// Base schema for form validation - deadline fields are now optional
const baseSchema = {
  // title: yup.string().required("Title is required"),
  description: yup.string().required("Description is required"),
  submissionDeadline: yup.date().optional().nullable(),
  questionAcceptanceDeadline: yup.date().optional().nullable(),
  bidIntentDeadline: yup.date().optional().nullable(),
  documents: yup.array().nullable().default(null),
};

// Create conditional schema based on reply mode
const createSchema = (isReplyMode: boolean) => {
  if (isReplyMode) {
    return yup.object().shape({
      ...baseSchema,
      question: yup.string().required("Question is required"),
    });
  }
  return yup.object().shape(baseSchema);
};

type FormValues = {
  // title: string;
  description: string;
  submissionDeadline?: Date;
  questionAcceptanceDeadline?: Date;
  bidIntentDeadline?: Date;
  documents: any[] | null;
  question?: string;
};

interface CreateAddendumDialogProps {
  solicitationId: string;
  questionId?: string; // Optional questionId for reply mode
  onClose: () => void;
}

const CreateAddendumDialog: React.FC<CreateAddendumDialogProps> = ({
  solicitationId,
  questionId,
  onClose,
}) => {
  const isReplyMode = !!questionId;
  const formRef = useRef<any>(null);
  const toast = useToastHandler();
  const queryClient = useQueryClient();
  const { isVendor } = useUserRole();

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  // Fetch solicitation details to auto-populate deadline fields
  const { data: solicitationData } = useQuery<
    ApiResponse<any>,
    ApiResponseError
  >({
    queryKey: ["solicitation", solicitationId],
    queryFn: async () =>
      await getRequest({ url: `/procurement/solicitations/${solicitationId}` }),
  });

  const solicitation = solicitationData?.data?.data;

  // Helper to get solicitation timezone (supports different shapes)
  // const getSolicitationTimezone = (): string | undefined => {
  //   return (
  //     solicitation?.solicitation?.timezone ||
  //     solicitation?.timezone ||
  //     undefined
  //   );
  // };

  // Helper function to format date for input (timezone-aware)
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return undefined as unknown as Date;
    const formatted = formatDateTZ(dateString, "yyyy-MM-dd'T'HH:mm");
    return new Date(formatted);
  };

  const { control, reset, getValues, watch } = useForge<FormValues>({
    resolver: yupResolver(createSchema(isReplyMode)) as any,
    defaultValues: {
      // title: "",
      description: "",
      documents: null,
      submissionDeadline: undefined,
      questionAcceptanceDeadline: undefined,
      bidIntentDeadline: undefined,
      question: "",
    },
  });

  // Auto-populate deadline fields when solicitation data is loaded
  useEffect(() => {
    if (solicitation) {
      reset({
        // title: "",
        description: "",
        documents: null,
        submissionDeadline: formatDateForInput(
          solicitation?.solicitation?.submissionDeadline || ""
        ),
        questionAcceptanceDeadline: formatDateForInput(
          solicitation?.solicitation?.questionDeadline || ""
        ),
        bidIntentDeadline: formatDateForInput(
          solicitation?.solicitation?.bidIntentDeadline || ""
        ),
        question: "",
      });
    }
  }, [solicitation]);

  const submissionDeadlineDate = watch("submissionDeadline");

  const maxDate = submissionDeadlineDate
    ? new Date(submissionDeadlineDate as unknown as Date)
    : undefined;

  // console.log({ maxDate, submissionDeadlineDate, values: getValues() })

  // File upload mutation with progress tracking
  const uploadFilesMutation = useMutation<
    ApiResponse<any[]>,
    ApiResponseError,
    File[]
  >({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("file", file);
      });

      // Reset upload states
      setUploadProgress({});
      setUploadingFiles(files.map((f) => f.name));
      setUploadErrors({});

      return await postRequest({
        url: "/upload",
        payload: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );

              // Update progress for all files being uploaded
              const newProgress: Record<string, number> = {};
              files.forEach((file) => {
                newProgress[file.name] = percentCompleted;
              });
              setUploadProgress(newProgress);
            }
          },
        },
      });
    },
    onSuccess: () => {
      // Mark all files as complete
      setUploadingFiles([]);
      toast.success("Success", "Files uploaded successfully");
    },
    onError: (error) => {
      // Mark upload as failed
      setUploadingFiles([]);
      const errorMessage =
        error?.response?.data?.message ?? "Failed to upload files";
      toast.error("Upload Error", errorMessage);

      // Set error for all files
      const currentFiles = getValues().documents || [];
      const newErrors: Record<string, string> = {};
      currentFiles.forEach((file: File) => {
        newErrors[file.name] = errorMessage;
      });
      setUploadErrors(newErrors);
    },
  });

  // Create addendum mutation
  const createAddendumMutation = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    { data: FormValues; status: "draft" | "publish" }
  >({
    mutationFn: async ({ data, status }) => {
      let uploadedFiles: any[] = [];

      // Upload files first if any
      if (data.documents && data.documents.length > 0) {
        const uploadResponse = await uploadFilesMutation.mutateAsync(
          data.documents
        );
        uploadedFiles = uploadResponse.data?.data || [];
      }

      const payload = {
        // title: data.title,
        description: data.description,
        submissionDeadline: data.submissionDeadline
          ? format(data.submissionDeadline, "yyyy-MM-dd'T'HH:mm:ss")
          : undefined,
        bidIntentDeadline: data.bidIntentDeadline
          ? format(data.bidIntentDeadline, "yyyy-MM-dd'T'HH:mm:ss")
          : undefined,
        questionDeadline: data.questionAcceptanceDeadline
          ? format(data.questionAcceptanceDeadline, "yyyy-MM-dd'T'HH:mm:ss")
          : undefined,
        status: status === "publish" ? "publish" : "draft",
        files: uploadedFiles.map((file) => ({
          name: file.name,
          url: file.url,
          size: file.size.toString(),
          type: file.type,
        })),
      };

      // Use different API endpoint based on user role
      const endpoint = isVendor
        ? `/vendor/solicitations/${solicitationId}/addendums` // Vendor-specific endpoint
        : `/procurement/solicitations/${solicitationId}/addendums`; // Default procurement endpoint

      return await postRequest({
        url: endpoint,
        payload,
      });
    },
    onSuccess: (_, variables) => {
      const action =
        variables.status === "draft" ? "saved as draft" : "published";
      toast.success("Success", `Addendum ${action} successfully`);
      // Auto-fetch addendum after successful creation
      queryClient.invalidateQueries({
        queryKey: ["addendums", solicitationId],
      });
      queryClient.refetchQueries({
        queryKey: ["addendums", solicitationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["solicitation", solicitationId],
      });
      queryClient.refetchQueries({
        queryKey: ["solicitation", solicitationId],
      });
      onClose();
    },
    onError: (error) => {
      // console.error("Create addendum error:", error);
      toast.error(
        "Error",
        error?.response?.data?.message ?? "Failed to create addendum"
      );
    },
  });

  // Reply addendum to question mutation
  const replyAddendumMutation = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    { data: FormValues; status: "draft" | "publish" }
  >({
    mutationFn: async ({ data, status }) => {
      let uploadedFiles: any[] = [];

      // Upload files first if any
      if (data.documents && data.documents.length > 0) {
        const uploadResponse = await uploadFilesMutation.mutateAsync(
          data.documents
        );
        uploadedFiles = uploadResponse.data?.data || [];
      }

      const payload = {
        // title: data.title,
        description: data.description,
        submissionDeadline: data.submissionDeadline
          ? format(data.submissionDeadline, "yyyy-MM-dd'T'HH:mm:ss")
          : undefined,
        questionDeadline: data.questionAcceptanceDeadline
          ? format(data.questionAcceptanceDeadline, "yyyy-MM-dd'T'HH:mm:ss")
          : undefined,
        bidIntentDeadline: data.bidIntentDeadline
          ? format(data.bidIntentDeadline, "yyyy-MM-dd'T'HH:mm:ss")
          : undefined,
        question: data.question,
        status: status,
        files: uploadedFiles.map((file) => ({
          name: file.name,
          url: file.url,
          size: file.size.toString(),
          type: file.type,
        })),
      };

      // Reply addendum to question endpoint
      const endpoint = `/procurement/solicitations/${solicitationId}/addendums/${questionId}`;

      return await postRequest({
        url: endpoint,
        payload,
      });
    },
    onSuccess: (_, variables) => {
      const action =
        variables.status === "draft" ? "saved as draft" : "published";
      toast.success("Success", `Reply addendum ${action} successfully`);
      // Auto-fetch addendum after successful creation
      queryClient.invalidateQueries({
        queryKey: ["addendums", solicitationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["questions", solicitationId],
      });
      queryClient.refetchQueries({
        queryKey: ["addendums", solicitationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["solicitation", solicitationId],
      });
      queryClient.refetchQueries({
        queryKey: ["solicitation", solicitationId],
      });
      onClose();
    },
    onError: (error) => {
      // console.error("Reply addendum error:", error);
      toast.error(
        "Error",
        error?.response?.data?.message ?? "Failed to reply with addendum"
      );
    },
  });

  const handleSaveAsDraft = async () => {
    const data = getValues();
    await createAddendumMutation.mutateAsync({ data, status: "draft" });
  };

  const handlePublishAddendum = async (data: FormValues) => {
    if (isReplyMode) {
      await replyAddendumMutation.mutateAsync({ data, status: "publish" });
    } else {
      await createAddendumMutation.mutateAsync({ data, status: "publish" });
    }
  };

  const handleBack = () => {
    onClose();
  };

  const FileUploadElement = () => (
    <div className="flex flex-col items-center justify-center p-8">
      <Upload className="h-12 w-12 text-blue-500 mb-4" />
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900 mb-2">
          Upload Documents
        </p>
        <p className="text-sm text-gray-600 mb-4">
          <span className="font-medium text-blue-600 cursor-pointer hover:text-blue-700">
            Click to browse
          </span>{" "}
          or drag and drop files here
        </p>
        <p className="text-xs text-gray-500">
          Supported: PDF, DOC, DOCX, XLS, XLSX, ZIP, PNG, JPEG
        </p>
      </div>
    </div>
  );

  const FileListItem = ({ file }: { file: File }) => {
    const fileName = file.name;
    const fileSize = (file.size / 1024 / 1024).toFixed(2); // Convert to MB
    const isUploading = uploadingFiles.includes(fileName);
    const progress = uploadProgress[fileName] || 0;
    const hasError = uploadErrors[fileName];
    const isComplete = !isUploading && !hasError && progress === 100;

    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                "p-2 rounded-full",
                hasError
                  ? "bg-red-100"
                  : isComplete
                  ? "bg-green-100"
                  : "bg-blue-100"
              )}
            >
              {hasError ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : isComplete ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <FileIcon className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fileName}
              </p>
              <p className="text-xs text-gray-500">{fileSize} MB</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {isUploading && (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Uploading...</span>
              <span className="text-xs text-gray-700 font-medium">
                {typeof progress === "number" ? progress.toFixed(0) : 0}%
              </span>
            </div>
            <Progress value={progress} className="h-2" variant="default" />
          </div>
        )}

        {/* Error message */}
        {hasError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {hasError}
          </div>
        )}

        {/* Success indicator */}
        {isComplete && (
          <div className="mt-2 flex items-center text-xs text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Upload complete
          </div>
        )}
      </div>
    );
  };

  const acceptedFileTypes = {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
    "application/vnd.ms-excel": [".xls"],
    "application/zip": [".zip"],
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
  };

  const isUploading =
    uploadFilesMutation.isPending || uploadingFiles.length > 0;

  return (
    <div className="w-full">
      {/* Header */}
      <DialogHeader className="flex flex-row items-center justify-between ">
        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-200">
          {isReplyMode ? "Response with Addendum" : "Create Addendum"}
        </DialogTitle>
      </DialogHeader>

      <Forge control={control} onSubmit={handlePublishAddendum} ref={formRef}>
        {/* Form Content */}
        <div className="space-y-6 mt-3">
          {/* Description */}
          <div className="relative">
            <Forger
              name="description"
              component={TextArea}
              label="Description"
              placeholder="Enter Detail"
              rows={4}
            />
            <div className="absolute bottom-3 right-3">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </div>

          {/* Question field - only show in reply mode */}
          {isReplyMode && (
            <Forger
              name="question"
              component={TextArea}
              label="Question"
              placeholder="Enter the question or clarification"
              rows={3}
            />
          )}

          {/* Upload Documents */}
          <div className="space-y-2">
            <Forger
              name="documents"
              component={TextFileUploader}
              label="Upload New/Revised Documents"
              containerClass="dark:border-gray-200"
              element={<FileUploadElement />}
              List={FileListItem}
              accept={acceptedFileTypes as any}
              dropzoneOptions={{
                multiple: true,
                maxFiles: 10,
              }}
            />
            {/* Upload status indicator */}
            {isUploading && (
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span>Uploading files...</span>
              </div>
            )}
          </div>

          {/* Submission Deadline */}
          <Forger
            name="submissionDeadline"
            component={TextDatePicker}
            label="Submission Deadline Date & Time"
            placeholder="Select Date"
            minDate={new Date()}
            showTime
          />

          {/* Question Acceptance Deadline */}
          <Forger
            name="questionAcceptanceDeadline"
            component={TextDatePicker}
            label="Question Acceptance Deadline Date & Time"
            placeholder="Select Date & Time"
            minDate={new Date()}
            dependencies={[maxDate]}
            maxDate={maxDate}
            showTime
          />

          {/* Bid Intent Deadline */}
          <Forger
            name="bidIntentDeadline"
            component={TextDatePicker}
            label="Bid Intent Deadline Date & Time"
            placeholder="Select Date & Time"
            minDate={new Date()}
            dependencies={[maxDate]}
            maxDate={maxDate}
            showTime
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-5">
          {!isReplyMode && (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSaveAsDraft()}
              className="text-gray-700 border-gray-300"
              disabled={
                createAddendumMutation.isPending ||
                replyAddendumMutation.isPending ||
                isUploading
              }
            >
              {createAddendumMutation.isPending ||
              replyAddendumMutation.isPending ||
              isUploading
                ? "Saving..."
                : "Save as Draft"}
            </Button>
          )}
          {isReplyMode && <div className="w-10 h-10"></div>}
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="text-gray-700 border-gray-300"
              disabled={
                createAddendumMutation.isPending ||
                replyAddendumMutation.isPending ||
                isUploading
              }
            >
              Back
            </Button>
            <Button
              type="submit"
              className="bg-[#2A4467] hover:bg-[#1e3252] text-white"
              disabled={
                createAddendumMutation.isPending ||
                replyAddendumMutation.isPending ||
                isUploading
              }
            >
              {createAddendumMutation.isPending ||
              replyAddendumMutation.isPending ||
              isUploading
                ? isUploading
                  ? "Uploading files..."
                  : isReplyMode
                  ? "Publishing Reply..."
                  : "Publishing..."
                : isReplyMode
                ? "Publish Reply"
                : "Publish Addendum"}
            </Button>
          </div>
        </div>
      </Forge>
    </div>
  );
};

export default CreateAddendumDialog;
