import { useForgeValues } from "@/lib/forge";
import {
  X,
  Upload,
  Check,
  Loader2,
  FileText,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { getSimpleFileExtension, formatFileSize } from "@/lib/fileUtils.tsx";
import { postRequest } from "@/lib/axiosInstance";
import { ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useFilesWithState,
  useAddFiles,
  useRemoveFile,
  useUpdateFileState,
  useSessionId,
  useSetSessionId,
  useClearSession,
} from "@/store/solicitationFileSlice";

// Type definitions for uploaded files
interface UploadedFile {
  id?: string; // Optional document ID for deduplication
  name?: string;
  url: string;
  type: string;
  size: string;
  originalName?: string;
  fileName?: string;
  uploadedAt?: string;
}

// Type for selected files with upload state
export interface FileWithUploadState {
  file: File;
  status: "pending" | "uploading" | "uploaded" | "failed";
  progress: number;
  uploadedData?: UploadedFile;
  error?: string;
}

// Simple Progress component
const Progress = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => (
  <div className={cn("w-full bg-gray-200 rounded-full h-2", className)}>
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-200 ease-out"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

// Custom dropzone component
const DropzoneArea = ({
  onFileSelect,
  disabled,
}: {
  onFileSelect: (files: FileList) => void;
  disabled: boolean;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled || !e.dataTransfer.files) return;

      onFileSelect(e.dataTransfer.files);
    },
    [disabled, onFileSelect]
  );

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        onFileSelect(e.target.files);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-dashed transition-all duration-200 min-h-40 flex items-center justify-center cursor-pointer",
        disabled
          ? "border-gray-300 bg-gray-50 cursor-not-allowed opacity-50"
          : isDragOver
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <div className="text-center">
        <svg
          className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400 mx-auto"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 16"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
          />
        </svg>
        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-primary">
            {disabled
              ? "Uploading files..."
              : "Drag & Drop or Click to choose file"}
          </span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
        </p>
      </div>
    </div>
  );
};

// File list item component with upload status
const FileListItem = ({
  fileState,
  onRemove,
  onRetry,
}: {
  fileState: FileWithUploadState;
  onRemove: () => void;
  onRetry: () => void;
}) => {
  const getFileIcon = (filename: string) => {
    if (!filename) return null;
    const extension = filename.split(".").pop()?.toLowerCase();
    const iconClass = "w-6 h-6";

    if (["pdf"].includes(extension || "")) {
      return (
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded flex items-center justify-center">
          <FileText className={cn(iconClass, "text-red-600")} />
        </div>
      );
    }

    if (["doc", "docx"].includes(extension || "")) {
      return (
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded flex items-center justify-center">
          <FileText className={cn(iconClass, "text-blue-600")} />
        </div>
      );
    }

    if (["xls", "xlsx", "xlsls"].includes(extension || "")) {
      return (
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded flex items-center justify-center">
          <FileText className={cn(iconClass, "text-green-600")} />
        </div>
      );
    }

    if (["zip", "rar", "7z"].includes(extension || "")) {
      return (
        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded flex items-center justify-center">
          <FileText className={cn(iconClass, "text-indigo-600")} />
        </div>
      );
    }

    if (["jpg", "jpeg", "png", "gif"].includes(extension || "")) {
      return (
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded flex items-center justify-center">
          <FileText className={cn(iconClass, "text-purple-600")} />
        </div>
      );
    }

    return (
      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/20 rounded flex items-center justify-center">
        <FileText className={cn(iconClass, "text-gray-600")} />
      </div>
    );
  };

  const getStatusIcon = () => {
    switch (fileState.status) {
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case "uploaded":
        return <Check className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (fileState.status) {
      case "uploading":
        return `Uploading... ${typeof fileState.progress === "number" ? fileState.progress.toFixed(0) : 0}%`;
      case "uploaded":
        return "Uploaded successfully";
      case "failed":
        return fileState.error || "Upload failed";
      default:
        return "Ready to upload";
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-2 border">
      <div className="flex items-center space-x-3 flex-1">
        {getFileIcon(fileState.file?.name)}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {fileState.file?.name || "Unknown file"}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>
              {getSimpleFileExtension(fileState.file?.name || "").toUpperCase()}{" "}
              • {formatFileSize(fileState.file?.size || 0)}
            </span>
            {getStatusIcon()}
            <span
              className={cn(
                fileState.status === "failed"
                  ? "text-red-600"
                  : fileState.status === "uploaded"
                  ? "text-green-600"
                  : "text-gray-500"
              )}
            >
              {getStatusText()}
            </span>
          </div>
          {fileState.status === "uploading" && (
            <Progress value={fileState.progress} className="mt-2" />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {fileState.status === "failed" && (
          <button
            type="button"
            onClick={onRetry}
            className="text-blue-600 hover:text-blue-800 transition-colors p-1"
            title="Retry upload"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          disabled={fileState.status === "uploading"}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Main file upload manager component
export const FileUploadManager = ({
  control,
  documents,
}: {
  control: any;
  documents: DocumentType[];
}) => {
  // Use persistent file state from Zustand store
  const filesWithState = useFilesWithState();
  const addFiles = useAddFiles();
  const removeFile = useRemoveFile();
  const updateFileState = useUpdateFileState();
  const sessionId = useSessionId();
  const setSessionId = useSetSessionId();
  const clearSession = useClearSession();

  const [isUploading, setIsUploading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const toast = useToastHandler();
  const { setValue } = useForgeValues({ control });

  // Initialize session on component mount
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `solicitation-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      setSessionId(newSessionId);
    }
  }, [sessionId, setSessionId]);

  // Helper function to check if a file already exists in the store using document ID
  const fileExistsInStore = useCallback(
    (docToCheck: DocumentType) => {
      // For uploaded files, we only need to check by document ID since that's unique
      return filesWithState.some((fileState) => {
        return fileState.uploadedData?.id === docToCheck._id;
      });
    },
    [filesWithState]
  );

  // Initialize existing documents from form values with deduplication
  useEffect(() => {
    if (!initialized && sessionId && documents?.length > 0) {
      // console.log('Initializing documents:', {
      //   documentsCount: documents.length,
      //   currentStoreFiles: filesWithState.length,
      //   storeFileIds: filesWithState.map(f => f.uploadedData?.id).filter(Boolean)
      // });

      // Filter out documents that already exist in the store
      const newDocuments = documents.filter((doc: DocumentType) => {
        const documentName = doc.name || doc.originalName || doc.fileName;
        if (!documentName || !doc.url) return false;
        const exists = fileExistsInStore(doc);
        return !exists;
      });
      
      // console.log('Filtering results:', { 
      //   totalExisting: documents.length,
      //   newDocuments: newDocuments.length,
      //   currentStoreFiles: filesWithState.length 
      // });

      if (newDocuments.length > 0) {
        // console.log('Adding new documents:', newDocuments.map(d => ({ name: d.name, id: d._id })));
        // Convert new documents to FileWithUploadState format
        const newFileStates = newDocuments.map((doc: DocumentType) => {
          const documentName =
            doc.name || doc.originalName || doc.fileName || "document";
          return {
          file: new File([], documentName, {
            type: doc.type || "application/octet-stream",
          }),
          status: "uploaded" as const,
          progress: 100,
          uploadedData: {
            id: doc._id, // Store the document ID for deduplication
            name: documentName,
            url: doc.url,
            type: doc.type,
            size: doc.size || "0 Bytes",
            uploadedAt: new Date().toISOString(),
          },
          };
        });

        // Add only new files to state
        addFiles(newFileStates);
      }

      setInitialized(true);
    }
  }, [initialized, sessionId, documents, addFiles]);

  // Cleanup on page unload or navigation away
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Only show warning if there are files in the session
      if (filesWithState.length > 0) {
        event.preventDefault();
        event.returnValue =
          "You have uploaded files that will be lost if you leave this page. Are you sure you want to continue?";
        return event.returnValue;
      }
    };

    const handleUnload = () => {
      // Clear session when page is actually unloaded
      clearSession();
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    // Cleanup function for component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);

      // Clear the initialized flag when component unmounts to allow proper re-initialization
      setInitialized(false);
    };
  }, [filesWithState.length, clearSession]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileSelect = useCallback(
    (fileList: FileList) => {
      const newFiles = Array.from(fileList).map((file) => ({
        file,
        status: "pending" as const,
        progress: 0,
      }));

      addFiles(newFiles);
    },
    [addFiles]
  );

  const handleRemoveFile = useCallback(
    (index: number) => {
      removeFile(index);
    },
    [removeFile]
  );

  const handleRetryFile = useCallback(
    (index: number) => {
      updateFileState(index, {
        status: "pending",
        progress: 0,
        error: undefined,
      });
    },
    [updateFileState]
  );

  const uploadSingleFileWithProgress = async (
    fileState: FileWithUploadState,
    index: number
  ) => {
    const formData = new FormData();
    formData.append("file", fileState.file);

    try {
      // Update status to uploading
      updateFileState(index, { status: "uploading", progress: 0 });

      const response = await postRequest({
        url: "/upload",
        payload: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              const currentFile = filesWithState[index];
              if (currentFile && currentFile.status === "uploading") {
                updateFileState(index, { progress });
              }
            }
          },
        },
      });

      if (response.data?.data && response.data.data.length > 0) {
        const uploadedFile = response.data.data[0];
        const currentFile = filesWithState[index];
        const uploadedName =
          uploadedFile.name ||
          uploadedFile.originalName ||
          uploadedFile.fileName ||
          currentFile?.file?.name;
        updateFileState(index, {
          status: "uploaded",
          progress: 100,
          uploadedData: {
            ...uploadedFile,
            name: uploadedName,
            size: formatFileSize(currentFile.file.size),
          },
        });
        return uploadedFile;
      }
    } catch (error) {
      const err = error as ApiResponseError;
      updateFileState(index, {
        status: "failed",
        progress: 0,
        error: err?.response?.data?.message || "Upload failed",
      });
      throw error;
    }
  };

  const handleUploadAll = async () => {
    if (filesWithState.every((f) => f.status === "uploaded")) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < filesWithState.length; i++) {
        const fileState = filesWithState[i];
        if (fileState.status === "pending" || fileState.status === "failed") {
          await uploadSingleFileWithProgress(fileState, i);
          // Small delay between uploads
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      toast.success("Upload Complete", "All files uploaded successfully");
    } catch (error) {
      toast.error("Upload Error", "Some files failed to upload. Please retry.");
    } finally {
      setIsUploading(false);
    }
  };

  // Update form state with uploaded file URLs
  useEffect(() => {
    const uploadedFiles = filesWithState
      .filter((f) => f.status === "uploaded" && f.uploadedData)
      .map((f) => f.uploadedData!);

    setValue("documents", uploadedFiles.length > 0 ? uploadedFiles : null);
  }, [filesWithState, setValue]);

  const allFilesUploaded =
    filesWithState.length > 0 &&
    filesWithState.every((f) => f.status === "uploaded");
  const hasFiles = filesWithState.length > 0;

  return (
    <div className="p-4 px-6">
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        Upload Files
      </label>

      <DropzoneArea onFileSelect={handleFileSelect} disabled={isUploading} />

      {hasFiles && (
        <div className="mt-4">
          <div className="space-y-2">
            {filesWithState.map((fileState, index) => (
              <FileListItem
                key={`${fileState.file?.name || "unknown"}-${index}`}
                fileState={fileState}
                onRemove={() => handleRemoveFile(index)}
                onRetry={() => handleRetryFile(index)}
              />
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            {!allFilesUploaded && (
              <Button
                type="button"
                onClick={handleUploadAll}
                disabled={isUploading || !hasFiles}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </>
                )}
              </Button>
            )}

            {allFilesUploaded && (
              <div className="flex items-center text-green-600">
                <Check className="h-4 w-4 mr-2" />
                All files uploaded successfully
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export interface DocumentType {
  _id: string;
  name: string;
  url: string;
  size: string;
  type: string;
  originalName: string;
  fileName: string;
}

function Step4Form({
  control,
  documents,
}: {
  control: any;
  documents: DocumentType[];
}) {
  return <FileUploadManager control={control} documents={documents} />;
}

export default Step4Form;
