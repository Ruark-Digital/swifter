import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/layouts/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  Search,
  Plus,
  FileText,
  Edit,
  Upload,
  FileIcon,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRequest,
  deleteRequest,
  putRequest,
  postRequest,
} from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import CreateAddendumDialog from "./CreateAddendumDialog";
import AddendumDetailsSheet from "./AddendumDetailsSheet";
import { useUserRole } from "@/hooks/useUserRole";
import { truncate } from "lodash";
import {
  TextInput,
  TextArea,
  TextDatePicker,
} from "@/components/layouts/FormInputs/TextInput";
import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import { TextFileUploader } from "@/components/layouts/FormInputs/TextFileInput";
import { useForge, Forge, Forger } from "@/lib/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useWatch } from "react-hook-form";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatDateTZ } from "@/lib/utils";
import { DeadlineUpdates } from "../SolicitationDetailPage";

// Addendum type definition based on API schema
type SolicitationAddendum = {
  _id: string;
  title: string;
  description?: string;
  submissionDeadline?: string;
  questionDeadline?: string;
  questions?: string;
  status: "draft" | "publish";
  files?: Array<{
    _id: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

type Addendum = {
  id: string;
  title: string;
  description?: string;
  submissionDeadline?: string;
  questionAcceptanceDeadline?: string;
  linkedQuestion: boolean;
  datePublished: string;
  status: "draft" | "publish";
};

interface AddendumsTabProps {
  solicitationId?: string;
  deadlines?: DeadlineUpdates[];
  solicitationStatus?: string;
  timezone?: string;
}

// Transform API addendum data to component format
const transformAddendumData = (
  apiAddendum: SolicitationAddendum,
  timezone?: string
): Addendum => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return formatDateTZ(dateString, "MMMM dd, yyyy KK:mm a", timezone);
  };
  return {
    id: apiAddendum._id,
    title: apiAddendum.title,
    description: apiAddendum.description,
    submissionDeadline: apiAddendum.submissionDeadline,
    questionAcceptanceDeadline: apiAddendum.questionDeadline,
    linkedQuestion: !!apiAddendum.questions,
    datePublished: formatDate(apiAddendum.createdAt),
    status: apiAddendum.status,
  };
};

// Status badge component for addendums
const AddendumStatusBadge = ({ status }: { status: Addendum["status"] }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "publish":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Map API status to human-friendly label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "publish":
        return "Published";
      case "draft":
        return "Draft";
      default:
        return status;
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} border-0 capitalize`}>
      {getStatusLabel(status)}
    </Badge>
  );
};

// Add more specific error handling
const getErrorMessage = (error: ApiResponseError) => {
  if (error?.response?.status === 403) {
    return "You don't have permission to access addendums for this solicitation.";
  }
  if (error?.response?.status === 404) {
    return "Solicitation not found.";
  }
  return error?.response?.data?.message ?? "Failed to load addendums";
};

// Edit addendum form validation schema
const editAddendumSchema = yup.object().shape({
  title: yup
    .string()
    .required("Title is required")
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must not exceed 200 characters"),
  description: yup
    .string()
    .optional()
    .max(2000, "Description must not exceed 2000 characters"),
  submissionDeadline: yup.string().optional(),
  questionAcceptanceDeadline: yup.string().optional(),
  status: yup
    .string()
    .oneOf(["draft", "publish"], "Status must be either draft or publish")
    .optional(),
  documents: yup.array().nullable().default(null),
});

type EditAddendumFormValues = {
  title: string;
  description?: string;
  submissionDeadline?: string;
  questionAcceptanceDeadline?: string;
  status?: "draft" | "publish";
  documents: any[] | null;
};

// Create useAddendums hook
const useAddendums = (solicitationId: string) => {
  return useQuery<ApiResponse<SolicitationAddendum[]>, ApiResponseError>({
    queryKey: ["addendums", solicitationId],
    queryFn: async () => {
      const endpoint = `/procurement/solicitations/${solicitationId}/addendums`;
      return await getRequest({ url: endpoint });
    },
    enabled: !!solicitationId,
  });
};

const AddendumsTab: React.FC<AddendumsTabProps> = ({
  solicitationId,
  solicitationStatus,
  deadlines,
  timezone,
}) => {
  const toast = useToastHandler();
  const queryClient = useQueryClient();
  const { isVendor, isCompanyAdmin } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selectedAddendum, setSelectedAddendum] = useState<Addendum | null>(
    null
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAddendum, setEditingAddendum] = useState<Addendum | null>(null);

  // Fetch addendums from API
  const {
    data: addendumsData,
    isLoading,
    error,
  } = useAddendums(solicitationId ?? "");

  // Delete addendum mutation
  const deleteAddendumMutation = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    string
  >({
    mutationFn: async (addendumId: string) => {
      const endpoint = `/procurement/solicitations/${solicitationId}/addendums/${addendumId}`;
      return await deleteRequest({ url: endpoint });
    },
    onSuccess: () => {
      toast.success("Success", "Addendum deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["addendums", solicitationId],
      });
    },
    onError: (error) => {
      console.error("Delete addendum error:", error);
      toast.error(
        "Error",
        error?.response?.data?.message ?? "Failed to delete addendum"
      );
    },
  });

  // Update addendum mutation
  const updateAddendumMutation = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    EditAddendumFormValues
  >({
    mutationFn: async (requestData: EditAddendumFormValues) => {
      if (!editingAddendum) throw new Error("No addendum selected for editing");
      const endpoint = `/procurement/solicitations/${solicitationId}/addendums/${editingAddendum.id}`;
      return await putRequest({ url: endpoint, payload: requestData });
    },
    onSuccess: () => {
      toast.success("Success", "Addendum updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["addendums", solicitationId],
      });
      setIsEditDialogOpen(false);
      setEditingAddendum(null);
    },
    onError: (error) => {
      console.error("Update addendum error:", error);
      toast.error(
        "Error",
        error?.response?.data?.message ?? "Failed to update addendum"
      );
    },
  });

  // Transform API data to component format
  const addendums = useMemo(() => {
    if (!addendumsData?.data?.data) return [] as Addendum[];
    return addendumsData.data.data.map((a: SolicitationAddendum) =>
      transformAddendumData(a, timezone)
    );
  }, [addendumsData, timezone]);

  // Filter addendums based on search query
  const filteredAddendums = useMemo(() => {
    if (!searchQuery) return addendums;
    return addendums.filter((addendum) =>
      addendum.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [addendums, searchQuery]);

  // Handle delete addendum
  const handleDeleteAddendum = async (addendumId: string) => {
    await deleteAddendumMutation.mutateAsync(addendumId);
  };

  // Handle edit addendum
  const handleEditAddendum = (addendum: Addendum) => {
    setEditingAddendum(addendum);
    setIsEditDialogOpen(true);
  };

  // Handle update addendum
  const handleUpdateAddendum = async (data: EditAddendumFormValues) => {
    if (!editingAddendum) return;
    await updateAddendumMutation.mutateAsync(data);
  };

  // Define addendums table columns
  const addendumColumns: ColumnDef<Addendum>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <span
          className="font-medium text-ellipsis whitespace-nowrap overflow-hidden block max-w-[200px]"
          title={row.original.title}
        >
          {truncate(row.original.title, { length: 50 })}
        </span>
      ),
    },
    {
      accessorKey: "datePublished",
      header: "Date Published",
      cell: ({ row }) => <span className="">{row.original.datePublished}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell(props) {
        return <AddendumStatusBadge status={props.row.original.status} />;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.status === "draft" && !isVendor ? (
            <>
              <Dialog
                open={
                  isEditDialogOpen && editingAddendum?.id === row.original.id
                }
                onOpenChange={(open) => {
                  if (!open) {
                    setIsEditDialogOpen(false);
                    setEditingAddendum(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="link"
                    className="text-green-600 p-0 h-auto"
                    onClick={() => handleEditAddendum(row.original)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md sm:max-h-[min(640px,80vh)] sm:max-w-lg sm:overflow-auto">
                  <EditAddendumDialog
                    addendum={editingAddendum}
                    solicitationId={solicitationId!}
                    onSubmit={handleUpdateAddendum}
                    isLoading={updateAddendumMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
              <ConfirmAlert
                type="delete"
                title="Delete Addendum"
                text="Are you sure you want to delete this addendum? This action cannot be undone."
                primaryButtonText="Delete"
                secondaryButtonText="Cancel"
                onPrimaryAction={() => handleDeleteAddendum(row.original.id)}
                trigger={
                  <Button
                    variant="link"
                    className="text-red-600 p-0 h-auto"
                    disabled={deleteAddendumMutation.isPending}
                  >
                    Delete
                  </Button>
                }
              />
            </>
          ) : (
            <Button
              variant="link"
              className="text-green-600 p-0 h-auto"
              onClick={() => {
                setSelectedAddendum(row.original);
                setIsDetailsSheetOpen(true);
              }}
            >
              View
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Memoize expensive computations
  const memoizedColumns = useMemo(
    () => addendumColumns,
    [
      deleteAddendumMutation.isPending,
      updateAddendumMutation.isPending,
      isEditDialogOpen,
      editingAddendum,
    ]
  );

  // Add debounced search
  // const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  return (
    <div className="space-y-6">
      {/* Data Table */}
      <div className="mt-6">
        <DataTable
          header={() => (
            <div className="p-4 border-b flex items-center w-full gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                Addendums
              </h2>
              <div className="relative flex-1 ">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search Addendums"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              {solicitationId && (
                (!isVendor &&
                  solicitationStatus !== "closed" &&
                  solicitationStatus !== "awarded") ||
                (solicitationStatus === "closed" && isCompanyAdmin)
              ) && (
                <Dialog
                  open={isCreateDialogOpen}
                  onOpenChange={setIsCreateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="bg-[#2A4467] hover:bg-[#1e3252] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        solicitationStatus === "draft" ||
                        (solicitationStatus === "closed" ||
                          solicitationStatus === "awarded") &&
                        !isCompanyAdmin
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Addendum
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-h-[min(640px,90vh)] overflow-auto">
                    <CreateAddendumDialog
                      solicitationId={solicitationId}
                      onClose={() => setIsCreateDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
          data={filteredAddendums}
          classNames={{
            container:
              "bg-white dark:bg-slate-950 rounded-xl px-3 border border-gray-300 dark:border-slate-600",
          }}
          columns={memoizedColumns}
          emptyPlaceholder={
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
                <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">
                No Addendums Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                {searchQuery
                  ? `No addendums match your search for "${searchQuery}". Try adjusting your search terms.`
                  : "No addendums have been created for this solicitation yet."}
              </p>
            </div>
          }
          options={{
            disableSelection: true,
            isLoading,
            totalCounts: filteredAddendums.length,
            manualPagination: false,
            setPagination,
            pagination,
          }}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center py-8">
          <div className="text-red-600 dark:text-red-400">
            {getErrorMessage(error)}
          </div>
        </div>
      )}

      {/* Addendum Details Sheet */}
      <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
        <SheetContent
          side="right"
          className="md:max-w-[50dvw] sm:w-[600px] p-0"
        >
          {selectedAddendum && (
            <AddendumDetailsSheet
              addendum={selectedAddendum}
              deadlines={deadlines || []}
              solicitationId={solicitationId!}
              timezone={timezone}
              onClose={() => setIsDetailsSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

// Edit Addendum Dialog Component
interface EditAddendumDialogProps {
  addendum: Addendum | null;
  solicitationId: string;
  onSubmit: (data: EditAddendumFormValues) => Promise<void>;
  isLoading: boolean;
}

const EditAddendumDialog: React.FC<EditAddendumDialogProps> = ({
  addendum,
  solicitationId,
  onSubmit,
  isLoading,
}) => {
  const toast = useToastHandler();

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

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

  // Fetch addendum details
  const { data: addendumData } = useQuery<
    ApiResponse<SolicitationAddendum>,
    ApiResponseError
  >({
    queryKey: ["addendum", solicitationId, addendum?.id],
    queryFn: async () =>
      await getRequest({
        url: `/procurement/solicitations/${solicitationId}/addendums/${addendum?.id}`,
      }),
    enabled: !!addendum?.id,
  });

  // Fetch solicitation details to prefill deadline fields if addendum doesn't have them
  const { data: solicitationData } = useQuery<
    ApiResponse<any>,
    ApiResponseError
  >({
    queryKey: ["solicitation", solicitationId],
    queryFn: async () =>
      await getRequest({
        url: `/procurement/solicitations/${solicitationId}/`,
      }),
    enabled: !!addendum?.id, // Only fetch when we have an addendum to edit
  });

  const solicitation = solicitationData?.data?.data;
  const addendumDetails = addendumData?.data?.data;

  const { control, reset, getValues } = useForge<EditAddendumFormValues>({
    resolver: yupResolver(editAddendumSchema),
    defaultValues: {
      title: "",
      description: "",
      submissionDeadline: "",
      status: "draft",
      documents: null,
    },
  });

  const submissionDeadlineDate = useWatch({
    name: "submissionDeadline",
    control,
  });
  const maxDate = submissionDeadlineDate
    ? new Date(submissionDeadlineDate)
    : undefined;

  // Reset form when addendum data loads
  useEffect(() => {
    if (addendumDetails) {
      // Use addendum data from API, fallback to solicitation data for deadlines if not set
      const submissionDeadline =
        solicitation?.solicitation?.submissionDeadline || "";

      const questionAcceptanceDeadline =
        solicitation?.solicitation?.questionDeadline || "";

      reset({
        title: addendumDetails.title,
        description: addendumDetails.description || "",
        submissionDeadline,
        questionAcceptanceDeadline,
        status: addendumDetails.status,
        documents: addendumDetails.files || null,
      });
    }
  }, [addendumDetails, solicitation, reset]);

  const handleFormSubmit = async (data: EditAddendumFormValues) => {
    let uploadedFiles: any[] = [];

    // Upload files first if any new files are added
    if (data.documents && data.documents.length > 0) {
      // Filter only File objects (new uploads), not existing file objects
      const newFiles = data.documents.filter(
        (file: any) => file instanceof File
      ) as File[];

      if (newFiles.length > 0) {
        const uploadResponse = await uploadFilesMutation.mutateAsync(newFiles);
        uploadedFiles = uploadResponse.data?.data || [];
      }

      // Include existing files (non-File objects)
      const existingFiles = data.documents.filter(
        (file: any) => !(file instanceof File)
      );
      uploadedFiles = [...uploadedFiles, ...existingFiles];
    }

    const payload = {
      ...data,
      submissionDeadline: data.submissionDeadline
        ? new Date(data.submissionDeadline).toISOString()
        : undefined,
      questionAcceptanceDeadline: data.questionAcceptanceDeadline
        ? new Date(data.questionAcceptanceDeadline).toISOString()
        : undefined,
      files: uploadedFiles.map((file) => ({
        name: file.name,
        url: file.url,
        size: file.size?.toString?.() || file.size,
        type: file.type,
      })),
    };
    await onSubmit(payload);
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
          Supported: PDF, DOC, DOCX, XLS, XLSX, ZIP, PNG, JPEG (Max 10MB each)
        </p>
      </div>
    </div>
  );

  const FileListItem = ({ file }: { file: File | any }) => {
    const fileName = file.name;
    const fileSize =
      file instanceof File
        ? (file.size / 1024 / 1024).toFixed(2)
        : ((file.size || 0) / 1024 / 1024).toFixed(2); // Convert to MB
    const isNewFile = file instanceof File;
    const isUploading = isNewFile && uploadingFiles.includes(fileName);
    const progress = uploadProgress[fileName] || 0;
    const hasError = uploadErrors[fileName];
    const isComplete =
      isNewFile && !isUploading && !hasError && progress === 100;

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
                  : isNewFile
                  ? "bg-blue-100"
                  : "bg-gray-100"
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
              <p className="text-xs text-gray-500">
                {fileSize} MB {!isNewFile && "(existing)"}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar for new uploads */}
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

  if (!addendum) return null;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Addendum</DialogTitle>
      </DialogHeader>

      <Forge control={control} onSubmit={handleFormSubmit}>
        <div className="space-y-4">
          <Forger
            name="title"
            component={TextInput}
            label="Title"
            placeholder="Enter addendum title (5-200 characters)"
            required
          />

          <Forger
            name="description"
            component={TextArea}
            label="Description"
            placeholder="Enter addendum description (optional, max 2000 characters)"
            rows={4}
          />

          <Forger
            name="submissionDeadline"
            component={TextDatePicker}
            showTime
            label="Submission Deadline"
            minDate={new Date()}
            placeholder="Select new submission deadline (optional)"
          />

          <Forger
            name="questionAcceptanceDeadline"
            component={TextDatePicker}
            showTime
            label="Question Acceptance Deadline"
            dependencies={[maxDate]}
            maxDate={maxDate}
            placeholder="Select new question acceptance deadline (optional)"
          />

          <div className="space-y-2">
            <Forger
              name="documents"
              component={TextFileUploader}
              element={<FileUploadElement />}
              List={FileListItem}
              label="Documents"
              placeholder="Upload documents (optional)"
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

          <Forger
            name="status"
            component={TextSelect}
            label="Status"
            placeholder="Select addendum status"
            options={[
              { value: "draft", label: "Draft" },
              { value: "publish", label: "Publish" },
            ]}
          />
        </div>

        <DialogFooter className="mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={isLoading || isUploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || isUploading}
            className="bg-[#2A4467] hover:bg-[#1e3252] text-white"
          >
            {isLoading || isUploading
              ? isUploading
                ? "Uploading files..."
                : "Updating..."
              : "Update Addendum"}
          </Button>
        </DialogFooter>
      </Forge>
    </>
  );
};

export default AddendumsTab;
