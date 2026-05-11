import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload as UploadIcon, X, CheckCircle, AlertCircle, FileIcon } from "lucide-react";
import { TextFileUploader } from "@/components/layouts/FormInputs/TextFileInput";
import { Control } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { cn } from "@/lib/utils";

interface UploadFileResponse {
  name: string;
  url: string;
  type: string;
  size: string;
  uploadedAt: string;
}

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilesUploaded?: (
    files: UploadFileResponse[],
    requiredDocumentId: string
  ) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  control?: Control<any>;
  requiredDocumentId?: string;
  type: string
}

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  open,
  onOpenChange,
  onFilesUploaded,
  acceptedTypes = [".pdf", ".doc", ".docx", ".xls", ".xlsx"],
  requiredDocumentId,
  type
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadFileResponse[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const toast = useToastHandler();

  // Upload files mutation with progress tracking
  const uploadFilesMutation = useMutation<
    ApiResponse<UploadFileResponse[]>,
    ApiResponseError,
    { formData: FormData; fileName: string }
  >({
    mutationKey: ["uploadFiles"],
    mutationFn: async ({ formData, fileName }) => {
      setUploadingFiles(prev => [...prev, fileName]);
      setUploadErrors(prev => ({ ...prev, [fileName]: "" }));
      
      try {
        const response = await postRequest({
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
                setUploadProgress(prev => ({
                  ...prev,
                  [fileName]: percentCompleted
                }));
              }
            },
          },
        });
        
        setUploadingFiles(prev => prev.filter(f => f !== fileName));
        setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));
        return response;
      } catch (error) {
        setUploadingFiles(prev => prev.filter(f => f !== fileName));
        setUploadErrors(prev => ({ 
          ...prev, 
          [fileName]: error instanceof Error ? error.message : "Upload failed" 
        }));
        throw error;
      }
    },
  });

  const isUploading = uploadingFiles.length > 0;

  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type ${fileExtension} is not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }
    
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return `File size exceeds 50MB limit. Current size: ${formatFileSize(file.size)}`;
    }
    
    return null;
  };

  const handleFileSelect = (files: File[] | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const errors: Record<string, string> = {};

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors[file.name] = error;
        toast.error("File Validation Error", `${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setUploadErrors(prev => ({ ...prev, ...errors }));

      // Create temporary preview objects
      const newFiles: UploadFileResponse[] = validFiles.map((file) => ({
        name: file.name,
        type: file.type,
        size: formatFileSize(file.size),
        url: URL.createObjectURL(file), 
        uploadedAt: new Date().toISOString(),
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("No Files", "Please select files to upload");
      return;
    }

    const uploadPromises = selectedFiles.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        const response = await uploadFilesMutation.mutateAsync({ 
          formData, 
          fileName: file.name 
        });
        return { file, response };
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        throw { file, error };
      }
    });

    try {
      const results = await Promise.allSettled(uploadPromises);
      const successful = results
        .filter((result): result is PromiseFulfilledResult<{ file: File; response: any }> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value.response);
      
      const failed = results
        .filter((result): result is PromiseRejectedResult => 
          result.status === 'rejected'
        );

      if (successful.length > 0) {
        const allUploadedFiles = successful.flatMap(response => 
          response.data?.data || []
        );
        
        if (onFilesUploaded && allUploadedFiles.length > 0) {
          onFilesUploaded(allUploadedFiles.map(item => ({
            ...item,
            type
          })), requiredDocumentId || "");
        }

        toast.success("Success", `${successful.length} file(s) uploaded successfully`);
        
        if (failed.length === 0) {
          onOpenChange(false);
          resetState();
        }
      }

      if (failed.length > 0) {
        toast.error("Upload Failed", `${failed.length} file(s) failed to upload`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload Failed", "An unexpected error occurred during upload");
    }
  };

  const resetState = () => {
    setUploadedFiles([]);
    setSelectedFiles([]);
    setUploadProgress({});
    setUploadingFiles([]);
    setUploadErrors({});
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetState();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Select files to upload. Supported formats:{" "}
            {acceptedTypes.join(", ")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <TextFileUploader
            value={selectedFiles}
            onChange={handleFileSelect}
            dropzoneOptions={{
              multiple: true,
              maxFiles: 10,
              onDragEnter: () => setIsDragOver(true),
              onDragLeave: () => setIsDragOver(false),
              onDrop: () => setIsDragOver(false)
            }}
            accept={
              acceptedTypes
                ? acceptedTypes.reduce((acc, type) => {
                    acc[type] = [type];
                    return acc;
                  }, {} as Record<string, string[]>)
                : {}
            }
            label="Upload Files"
            className="w-full border border-dashed rounded-2xl"
            // containerClass="border border-dashed rounded-2xl"
            element={
              <div className={cn(
                "flex flex-col items-center space-y-4 p-8 transition-colors duration-200",
                isDragOver && "bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-600"
              )}>
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200",
                  isDragOver 
                    ? "bg-blue-200 dark:bg-blue-800/30" 
                    : "bg-blue-100 dark:bg-blue-900/20"
                )}>
                  <UploadIcon className={cn(
                    "w-8 h-8 transition-colors duration-200",
                    isDragOver 
                      ? "text-blue-700 dark:text-blue-300" 
                      : "text-blue-600 dark:text-blue-400"
                  )} />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {isDragOver ? "Drop files here" : "Drag & Drop or Click to choose files"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Supported formats: {acceptedTypes.join(", ")}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Maximum file size: 50MB • Maximum files: 10
                  </p>
                </div>
              </div>
            }
            List={({ file }: { file: File | UploadFileResponse }) => {
              const fileName = file.name;
              const fileSize = file instanceof File 
                ? formatFileSize(file.size) 
                : formatFileSize(parseInt(String((file as UploadFileResponse).size || 0)) || 0);
              const fileIndex = uploadedFiles.findIndex(
                (f) => f.name === fileName
              );
              
              const isUploading = uploadingFiles.includes(fileName);
              const progress = uploadProgress[fileName] || 0;
              const hasError = uploadErrors[fileName];
              const isCompleted = progress === 100 && !isUploading && !hasError;
              
              return (
                <div className={cn(
                  "p-4 rounded-lg border transition-colors duration-200",
                  hasError 
                    ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" 
                    : isCompleted 
                    ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5">
                        {hasError ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <FileIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {fileName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                            {fileSize}
                          </p>
                        </div>
                        
                        {/* Progress bar for uploading files */}
                        {isUploading && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                Uploading...
                              </span>
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                {typeof progress === "number" ? progress.toFixed(0) : 0}%
                              </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        )}
                        
                        {/* Error message */}
                        {hasError && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {hasError}
                          </p>
                        )}
                        
                        {/* Success message */}
                        {isCompleted && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Upload completed successfully
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Remove button - disabled during upload */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(fileIndex)}
                      disabled={isUploading}
                      className={cn(
                        "ml-2 flex-shrink-0",
                        isUploading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            }}
          />
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            className=""
            disabled={isUploading || selectedFiles.length === 0}
          >
            <UploadIcon className="w-4 h-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload Files"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog;
