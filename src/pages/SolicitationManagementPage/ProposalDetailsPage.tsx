import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useGoBack } from "@/hooks/useGoBack";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Share2,
  Eye,
  Download,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AmendSubmissionDialog from "./components/AmendSubmissionDialog";
import ReadOnlyProposalDialog from "./components/ReadOnlyProposalDialog";
import AmendProposalDialog from "./components/AmendProposalDialog";
import { DataTable } from "@/components/layouts/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import { putRequest, getRequest } from "@/lib/axiosInstance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastHandler } from "@/hooks/useToaster";
import { ApiResponse, ApiResponseError } from "@/types";
import { useState } from "react";
import { isAfter, parseISO, isValid } from "date-fns";
import { formatCurrency, formatDateInZoneAbbrev, formatDateTZ } from "@/lib/utils";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import { getFileExtension, isViewableFile } from "@/lib/fileUtils.tsx";
import EvaluationScorecardSheet from "@/pages/EvaluationManagementPage/components/EvaluationScorecardSheet";

// Define the evaluator data type
type EvaluatorData = {
  id: string;
  evaluatorName: string;
  email: string;
  assignedDate: string;
  submittedDate: string;
  status: "Completed" | "Pending";
  totalScore: string;
  commentSummary: string;
};

// Define types for evaluator score API response
type EvaluatorScoreData = {
  email: string;
  name: string;
  dateAssigned: string | null;
  dateSubmitted: string;
  status: string;
  averageScore: number | null;
  _id?: string; // Add evaluatorId if available in API response
};

type ViewEvaluatorScore = {
  averageScore: number;
  allEvaluators: number;
  submittedEvaluators: number;
  evaluators: EvaluatorScoreData[];
};

export interface VendorProposalData {
  proposalDetails: ProposalDetails;
  overview: Overview;
  submittedDocument: SubmittedDocument[];
}

export interface Criteria {
  title: string;
  criteria: CriteriaClass;
  scoring: {
    pass_fail?: string;
    weight?: number;
  };
}

export interface CriteriaClass {}

export interface Overview {
  evaluation: number;
  uploads: number;
  criteria: Criteria[];
}

export interface ProposalDetails {
  id: string;
  name: string;
  vendor: string;
  contact: string;
  ref: string;
  total: number;
  submissiion: string;
  status: string;
  score: number;
  allEvaluators: number;
}

export interface SubmittedDocument {
  name: string;
  url: string;
  type: string;
  size: string;
  uploadedAt: Date;
  _id: string;
  requiredDocId: string;
}

export interface Amendment {
  _id: string;
  proposal: {
    _id: string;
    solicitation: {
      _id: string;
      name: string;
      solId: string;
    };
    vendor: {
      _id: string;
      name: string;
    };
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  reason: string;
  newFiles: Array<{
    name: string;
    url: string;
    size: string;
    type: string;
  }>;
  oldFiles: Array<{
    name: string;
    url: string;
    size: string;
    type: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const ProposalDetailsPage: React.FC = () => {
  const { id, proposalId } = useParams<{ id: string; proposalId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const toastHandlers = useToastHandler();
  const currency = "USD";
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showAmendDialog, setShowAmendDialog] = useState(false);
  const [selectedDocumentForAmend, setSelectedDocumentForAmend] =
    useState<SubmittedDocument | null>(null);
  const [showReadOnlyProposalDialog, setShowReadOnlyProposalDialog] =
    useState(false);
  const [showAmendProposalDialog, setShowAmendProposalDialog] = useState(false);

  // Document viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);

  // Get vendor ID from location state
  const vendorId = location.state?.vendorId || proposalId;

  // Handle document viewing
  const handleViewDocument = (file: {
    url: string;
    name: string;
    type: string;
  }) => {
    setSelectedDocument(file);
    setViewerOpen(true);
  };

  // Fetch solicitation data
  const { data: solicitationData } = useQuery<
    ApiResponse<{
      solicitation: {
        name: string;
        _id: string;
        submissionDeadline: string;
        status: string;
        timezone?: string;
      };
      owner?: boolean; // Optional owner flag may be provided by API
    }>,
    ApiResponseError
  >({
    queryKey: ["solicitation", id],
    queryFn: () =>
      getRequest({
        url: `/procurement/solicitations/${id}`,
      }),
    enabled: !!id,
  });

  // Fetch vendor proposal data
  const { data: proposalData, isLoading: isLoadingProposal } = useQuery<
    ApiResponse<VendorProposalData>,
    ApiResponseError
  >({
    queryKey: ["vendor-proposal", id, vendorId],
    queryFn: () =>
      getRequest({
        url: `/procurement/solicitations/${id}/vendor-proposal/${vendorId}`,
      }),
    enabled: !!(id && vendorId),
  });

  // Fetch evaluator scores data
  const {
    data: evaluatorScoresData,
    isLoading: isLoadingEvaluatorScores,
    error: evaluatorScoresError,
  } = useQuery<ApiResponse<ViewEvaluatorScore>, ApiResponseError>({
    queryKey: ["evaluator-scores", id],
    queryFn: () =>
      getRequest({
        url: `/procurement/solicitations/${id}/vendor/${vendorId}/evaluator-score`,
      }),
    enabled: !!id,
  });

  const proposal = proposalData?.data?.data;
  const submittedDocument = proposalData?.data?.data?.submittedDocument || [];
  const solicitation = solicitationData?.data?.data?.solicitation;
  // Owner flag provided by API on solicitation details
  const isOwner = solicitationData?.data?.data?.owner;
  const criterias = proposalData?.data?.data?.overview?.criteria || [];
  const evaluatorScores = evaluatorScoresData?.data?.data;

  // Transform evaluator scores data for DataTable
  const evaluatorTableData: EvaluatorData[] =
    evaluatorScores?.evaluators?.map((evaluator, index) => ({
      id: evaluator._id || `evaluator-${index}`,
      evaluatorName: evaluator.name,
      email: evaluator.email,
      assignedDate: evaluator.dateAssigned
        ? formatDateInZoneAbbrev(
            evaluator.dateAssigned,
            "MMM d, yyyy KK:mm a",
            solicitation?.timezone
          )
        : "N/A",
      submittedDate: evaluator.dateSubmitted
        ? formatDateInZoneAbbrev(
            evaluator.dateSubmitted,
            "MMM d, yyyy KK:mm a",
            solicitation?.timezone
          )
        : "N/A",
      status: evaluator.status === "completed" ? "Completed" : "Pending",
      totalScore:
        evaluator.averageScore != null
          ? `${evaluator.averageScore.toFixed(0)}%`
          : "N/A",
      commentSummary: "View details for comments", // Placeholder as API doesn't provide comment summary
    })) || [];

  const handleBack = useGoBack(`/dashboard/solicitation/${id}`);

  const handleExport = async (type: "pdf" | "docx" = "pdf") => {
    if (!proposal) return;

    try {
      const response = await getRequest({
        url: `/procurement/solicitations/${id}/vendor-proposal/${vendorId}/export?type=${type}`,
        config: {
          responseType: "blob",
        },
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data], {
        type:
          type === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename with vendor name and current date
      const vendorName = proposal.proposalDetails.vendor || "vendor";
      const currentDate = new Date().toISOString().split("T")[0];
      link.download = `${vendorName}_proposal_${currentDate}.${type}`;

      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toastHandlers.success(
        "Export",
        `Proposal exported successfully as ${type.toUpperCase()}`
      );
    } catch (error) {
      const err = error as ApiResponseError;
      toastHandlers.error(
        "Export",
        err.response?.data.message ||
          "Failed to export proposal. Please try again."
      );
    }
  };

  const awardVendorMutation = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    string
  >({
    mutationFn: (vendorId: string) =>
      putRequest({
        url: `/procurement/solicitations/${id}/award-vendor/${vendorId}`,
      }),
    onSuccess: (result) => {
      toastHandlers.success(
        "Award Vendor",
        result.data.message ?? "Vendor awarded successfully"
      );
      setShowAwardModal(false);
      queryClient.invalidateQueries({ queryKey: ["vendor-proposal", id] });
      queryClient.invalidateQueries({ queryKey: ["evaluator-scores", id] });
      queryClient.invalidateQueries({ queryKey: ["solicitation", id] });
    },
    onError: (error) => {
      toastHandlers.error("Award Vendor", error);
    },
  });

  // Add remind evaluator mutation
  const remindEvaluatorMutation = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    string
  >({
    mutationFn: (evaluatorId: string) =>
      putRequest({
        url: `/procurement/solicitations/${id}/remind-evaluator/${evaluatorId}`,
      }),
    onSuccess: (result) => {
      toastHandlers.success(
        "Remind Evaluator",
        result.data.message ?? "Reminder sent successfully"
      );
    },
    onError: (error) => {
      toastHandlers.error("Remind Evaluator", error);
    },
  });

  // Download archive submission mutation
  const downloadArchiveMutation = useMutation<Blob, ApiResponseError, void>({
    mutationFn: async () => {
      const response = await getRequest({
        url: `/procurement/solicitations/${proposal?.proposalDetails?.id}/archive-submission`,
        config: { responseType: "blob" },
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Create download link
      const blob = new Blob([data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename with vendor name and current date
      const vendorName = proposal?.proposalDetails.vendor || "vendor";
      const currentDate = new Date().toISOString().split("T")[0];
      link.download = `${vendorName}_submission_archive_${currentDate}.zip`;

      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toastHandlers.success(
        "Download Complete",
        "Submission archive downloaded successfully"
      );
    },
    onError: (error) => {
      toastHandlers.error(
        "Download Failed",
        error.response?.data.message ||
          "Failed to download submission archive. Please try again."
      );
    },
  });

  const handleAwardVendor = () => {
    setShowAwardModal(true);
  };

  const handleConfirmAward = () => {
    awardVendorMutation.mutate(vendorId);
  };

  const handleSubmitForVendor = () => {
    // Navigate to submit proposal page with modified endpoint context
    navigate(`/dashboard/solicitations/${id}/submit-proponent`, {
      state: {
        vendorId: vendorId,
        isSubmitForVendor: true,
        endpoint: `/procurement/solicitations/${id}/submit-vendor/${vendorId}`,
      },
    });
  };

  // Handle remind evaluator
  const handleRemindEvaluator = (evaluatorId: string) => {
    remindEvaluatorMutation.mutate(evaluatorId);
  };

  // Handle view evaluator score card
  // const handleViewEvaluator = (evaluatorId: string) => {
  //   // Navigate to evaluator score card page
  //   navigate(
  //     `/procurement/solicitations/${id}/evaluator-score-card/${evaluatorId}`
  //   );
  // };

  // Define columns for the evaluator scores table
  const evaluatorColumns: ColumnDef<EvaluatorData>[] = [
    {
      accessorKey: "evaluatorName",
      header: "Evaluator Name",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900 dark:text-white">
            {row.original.evaluatorName}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400 underline cursor-pointer">
            {row.original.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Assigned: {row.original.assignedDate}
          </div>
          <div className="text-sm text-gray-900 dark:text-white">
            Submitted: {row.original.submittedDate}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant="secondary"
            className={`${
              status === "Completed"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            }`}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "totalScore",
      header: "Total Score",
      cell: ({ row }) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {row.original.totalScore}
        </div>
      ),
    },
    // {
    //   accessorKey: "commentSummary",
    //   header: "Comment Summary",
    //   cell: ({ row }) => (
    //     <div className="text-gray-900 dark:text-white">
    //       {row.original.commentSummary}
    //     </div>
    //   ),
    // },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        if (!isOwner) return null;
        const status = row.original.status;
        return (
          <div className="flex items-center space-x-2">
            {status === "Completed" ? (
              <EvaluationScorecardSheet
                evaluatorId={row.original.id}
                solicitationId={id || ""}
                timezone={solicitation?.timezone}
              />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-0 h-auto font-normal"
                onClick={() => handleRemindEvaluator(row.original.id)}
                disabled={remindEvaluatorMutation.isPending}
              >
                {remindEvaluatorMutation.isPending ? "Sending..." : "Remind"}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // Define columns for the submitted documents table
  const documentsColumns: ColumnDef<SubmittedDocument>[] = [
    {
      accessorKey: "name",
      header: "Requested Doc",
      cell: ({ row }) => {
        const document = row.original;

        return (
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {document.name || "Untitled Document"}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Document Type",
      cell: ({ row }) => {
        const document = row.original;

        return (
          <Badge variant="secondary" className="text-xs">
            {document.type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "uploadedAt",
      header: "Date Submitted",
      cell: ({ row }) => {
        const document = row.original;
        return (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {document.uploadedAt
              ? formatDateInZoneAbbrev(
                  document.uploadedAt,
                  "MMM d, yyyy h:mm a",
                  solicitation?.timezone
                )
              : "N/A"}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        if (!isOwner) return null;
        const document = row.original;
        const isDocFile = isViewableFile(document.name, document.type);

        return (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isDocFile ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        handleViewDocument({
                          url: document.url,
                          name: document.name,
                          type: document.type,
                        });
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        if (document.url) {
                          if (document.type?.toLowerCase() === "pricing") {
                            // For pricing documents, open read-only proposal dialog
                            setShowReadOnlyProposalDialog(true);
                          } else {
                            // For other documents, use document viewer
                            handleViewDocument(document);
                          }
                        }
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>

                    {document.type?.toLowerCase() === "pricing" && (
                      <DropdownMenuItem
                        onClick={() => {
                          setShowAmendProposalDialog(true);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Amend
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                {!isDocFile && document.type?.toLowerCase() !== "pricing" && (
                  <DropdownMenuItem
                    onClick={() => {
                      if (document.url) {
                        const link = window.document.createElement("a");
                        link.href = document.url;
                        link.download = document.name || "download";
                        window.document.body.appendChild(link);
                        link.click();
                        window.document.body.removeChild(link);
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                )}

                {isDocFile && (
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedDocumentForAmend(document);
                      setShowAmendDialog(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Amend
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Define columns for the amendments table
  const amendmentsColumns: ColumnDef<Amendment>[] = [
    {
      id: "expander",
      header: "",
      cell: ({ row }) => {
        if (!isOwner) return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => row.toggleExpanded()}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        );
      },
    },
    {
      accessorKey: "newFiles",
      header: "Amended Doc.",
      cell: ({ row }) => {
        const amendment = row.original;
        const fileName = amendment.newFiles?.[0]?.name || "N/A";
        return (
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {fileName}
          </div>
        );
      },
    },
    // {
    //   accessorKey: "oldFiles",
    //   header: "Original Submission",
    //   cell: ({ row }) => {
    //     const amendment = row.original;
    //     const originalFileName = amendment.oldFiles?.[0]?.name || "N/A";
    //     return (
    //       <div className="text-sm text-gray-600 dark:text-gray-300">
    //         {originalFileName}
    //       </div>
    //     );
    //   },
    // },
    {
      accessorKey: "createdBy",
      header: "Amended by",
      cell: ({ row }) => {
        const amendment = row.original;
        return (
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {amendment.createdBy?.name || "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date Amended",
      cell: ({ row }) => {
        const amendment = row.original;
        return (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {amendment.createdAt
              ? formatDateTZ(amendment.createdAt, "MMM d, yyyy h:mm a")
              : "N/A"}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        if (!isOwner) return null;
        const amendment = row.original;

        const handleViewDocument = (file: {
          name: string;
          url: string;
          type: string;
        }) => {
          setSelectedDocument({
            url: file.url,
            name: file.name,
            type: file.type,
          });
          setViewerOpen(true);
        };

        const handleDownloadDocument = (file: {
          name: string;
          url: string;
        }) => {
          const link = document.createElement("a");
          link.href = file.url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        return (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {amendment.newFiles?.[0] && (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleViewDocument(amendment.newFiles[0])}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View New Document
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleDownloadDocument(amendment.newFiles[0])
                      }
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download New Document
                    </DropdownMenuItem>
                  </>
                )}
                {amendment.oldFiles?.[0] && (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleViewDocument(amendment.oldFiles[0])}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Original Document
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleDownloadDocument(amendment.oldFiles[0])
                      }
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Original Document
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Create useAmendments hook for fetching amendments data
  const useAmendments = (proposalId: string) => {
    return useQuery<
      ApiResponse<{ history: Amendment[]; count: number }>,
      ApiResponseError
    >({
      queryKey: ["amendments", proposalId],
      queryFn: async () => {
        const endpoint = `/procurement/solicitations/proposals/${proposalId}/submission-history`;
        return await getRequest({ url: endpoint });
      },
      enabled: !!proposalId,
    });
  };

  // Fetch amendments data
  const {
    data: amendmentsData,
    isLoading: isLoadingAmendments,
    error: amendmentsError,
  } = useAmendments(proposal?.proposalDetails?.id || "");

  // Use amendments data from API
  const amendments = amendmentsData?.data?.data?.history || [];

  return (
    <div className="p-6 space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            onClick={handleBack}
            className="text-sm text-gray-500 dark:text-gray-400 space-x-2 cursor-pointer"
          >
            Solicitations &gt; {solicitation?.name || "Loading..."} &gt; Vendors
            &gt; {proposal?.proposalDetails?.vendor || "Loading..."}&#39;s
            Proposal Details
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Title and Export */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Proposal Details
          </h1>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Export</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("docx")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as DOCX
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Loading State */}
        {isLoadingProposal && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              Loading proposal details...
            </div>
          </div>
        )}

        {/* Error State */}
        {/* {proposalError && (
          <div className="flex items-center justify-center py-8">
            <div className="text-red-500">
              Error loading proposal details. Please try again.
            </div>
          </div>
        )} */}

        {/* Proposal Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Solicitation Name
              </label>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {solicitation?.name || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Contact
              </label>
              <p className="text-base text-blue-600 dark:text-blue-400 underline cursor-pointer">
                {proposal?.proposalDetails?.contact || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Submission Deadline
              </label>
              <p className="text-base text-gray-900 dark:text-white">
                {solicitation?.submissionDeadline
                  ? formatDateTZ(
                      new Date(solicitation?.submissionDeadline),
                      "MMMM d, yyyy KK:mm a"
                    )
                  : "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Evaluation Score (Avg score)
              </label>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {proposal?.proposalDetails?.score != null
                  ? `${proposal.proposalDetails.score.toFixed(0)}%`
                  : "N/A"}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Vendor Name
              </label>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {proposal?.proposalDetails?.vendor || "N/A"}
              </p>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Reference Number
              </label>
              <p className="text-base text-gray-900 dark:text-white">
                {proposal?.proposalDetails?.ref || "N/A"}
              </p>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block">
                Status
              </label>
              <Badge
                variant="secondary"
                className={`${
                  proposal?.proposalDetails?.status === "submit"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                }`}
              >
                {proposal?.proposalDetails?.status === "submit"
                  ? "Submitted"
                  : proposal?.proposalDetails?.status || "N/A"}
              </Badge>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Amount
              </label>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {formatCurrency(
                  proposal?.proposalDetails?.total || 0,
                  "en-US",
                  currency
                ) || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Award Vendor and Submit for Vendor Buttons */}
        {isOwner && (
          <div className="flex justify-start gap-3">
            <Button
              onClick={handleSubmitForVendor}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={
                (!solicitation?.submissionDeadline
                  ? true
                  : (() => {
                      try {
                        const deadline = parseISO(
                          solicitation.submissionDeadline
                        );
                        return (
                          !isValid(deadline) || !isAfter(new Date(), deadline)
                        );
                      } catch {
                        return true;
                      }
                    })()) ||
                solicitation?.status === "closed" ||
                solicitation?.status === "awarded"
              }
            >
              Submit for Vendor
            </Button>
            {proposal && (
              <Button
                onClick={handleAwardVendor}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={
                  proposal?.proposalDetails?.status !== "submit" ||
                  solicitation?.status === "closed" ||
                  solicitation?.status === "awarded"
                }
              >
                Award Vendor
              </Button>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 !bg-transparent p-0 w-full justify-start">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Submitted Documents
            </TabsTrigger>
            <TabsTrigger
              value="scores"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Evaluator Scores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Submission Details */}
            <h4 className="text-xl font-medium mt-5 text-gray-900 dark:text-white">
              Submission Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Submission Date
                </label>
                <p className="text-base text-gray-900 dark:text-white">
                  {proposal?.proposalDetails?.submissiion
                    ? formatDateTZ(
                        proposal.proposalDetails.submissiion,
                        "MMMM d, yyyy KK:mm a",
                        solicitation?.timezone
                      )
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Vendor Contact
                </label>
                <p className="text-base text-blue-600 dark:text-blue-400 underline cursor-pointer">
                  {proposal?.proposalDetails?.contact || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Documents Uploaded
                </label>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {proposal?.submittedDocument?.length || 0}
                </p>
              </div>
            </div>

            {/* Evaluation Summary */}
            <h4 className="text-xl font-medium text-gray-900 dark:text-white">
              Evaluation Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Average Score
                </label>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {proposal?.proposalDetails?.score != null
                    ? `${proposal.proposalDetails.score.toFixed(0)}%`
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Evaluation
                </label>
                <p className="text-base text-gray-900 dark:text-white">
                  {proposal?.overview?.evaluation != null
                    ? `${proposal.overview.evaluation.toFixed(0)}%`
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Criteria Breakdown */}
            <h4 className="text-xl font-medium text-gray-900 dark:text-white">
              Criteria Breakdown
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {criterias.map((criteria, index) => (
                <div key={index}>
                  {criteria.scoring?.weight && (
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {criteria.title}
                    </label>
                  )}
                  {criteria.scoring?.pass_fail && (
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {criteria.title}
                    </label>
                  )}
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    Avg:{" "}
                    {criteria.scoring?.pass_fail ||
                      (typeof criteria.scoring?.weight === "number"
                        ? `${criteria.scoring.weight.toFixed(0)}%`
                        : "N/A")}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <h4 className="text-xl mt-5 font-medium text-gray-900 dark:text-white">
              Submitted Documents
            </h4>
            {/* Download Archive Button */}
            {isOwner && (
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => downloadArchiveMutation.mutate()}
                  disabled={downloadArchiveMutation.isPending}
                  variant={"ghost"}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadArchiveMutation.isPending
                    ? "Downloading..."
                    : "Download Submission Archive"}
                </Button>
              </div>
            )}

            {/* Nested Tabs for Documents */}
            <Tabs defaultValue="original-submission" className="w-full">
              <TabsList className="h-auto rounded-none  !bg-gray-200 dark:border-gray-600 p- w-full justify-start">
                <TabsTrigger
                  value="original-submission"
                  className="data-[state=active]:shadow data-[state=active]:dark:bg-gray-600 data-[state=active]:dark:text-slate-100 relative py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:!bg-white flex-none px-3"
                >
                  Original Submission
                </TabsTrigger>
                <TabsTrigger
                  value="amendments"
                  className="data-[state=active]:shadow data-[state=active]:dark:bg-gray-600 data-[state=active]:dark:text-slate-100 relative py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:!bg-white flex-none px-3"
                >
                  Amendments
                  {amendments && amendments.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {amendments.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="original-submission"
                className="space-y-4 mt-6"
              >
                {/* Original Documents Table */}
                {submittedDocument.length > 0 ? (
                  <DataTable
                    data={submittedDocument}
                    columns={documentsColumns}
                    options={{
                      disablePagination: true,
                      disableSelection: true,
                      isLoading: false,
                      totalCounts: submittedDocument.length,
                      manualPagination: false,
                      setPagination: () => {},
                      pagination: { pageIndex: 0, pageSize: 10 },
                    }}
                    classNames={{
                      table: "border-separate border-spacing-y-2",
                      tHeader: "bg-gray-50 dark:bg-slate-800",
                      tHead:
                        "text-left font-medium text-gray-700 dark:text-gray-300 py-3 px-4",
                      tRow: "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg",
                      tCell: "py-4 px-4 text-sm",
                    }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No documents submitted yet.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="amendments" className="space-y-4 mt-6">
                {isLoadingAmendments ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      Loading amendments...
                    </p>
                  </div>
                ) : amendmentsError ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 dark:text-red-400">
                      Error loading amendments. Please try again.
                    </p>
                  </div>
                ) : amendments && amendments.length > 0 ? (
                  <DataTable
                    data={amendments}
                    columns={amendmentsColumns}
                    options={{
                      disablePagination: true,
                      disableSelection: true,
                      isLoading: isLoadingAmendments,
                      totalCounts: amendments.length,
                      manualPagination: false,
                      setPagination: () => {},
                      pagination: { pageIndex: 0, pageSize: 10 },
                      enableExpanding: true,
                      getRowCanExpand: () => true,
                      renderSubComponent: ({ row }) => {
                        const amendment = row.original;
                        return (
                          <div className="p-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-900 dark:text-gray-100">
                                Reason / Note:
                              </h5>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {amendment.reason || "No reason provided"}
                              </p>
                            </div>
                          </div>
                        );
                      },
                    }}
                    classNames={{
                      table: "border-separate border-spacing-y-2",
                      tHeader: "bg-gray-50 dark:bg-slate-800",
                      tHead:
                        "text-left font-medium text-gray-700 dark:text-gray-300 py-3 px-4",
                      tRow: "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg",
                      tCell: "py-4 px-4 text-sm",
                      expandedRow:
                        "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg",
                      expandedCell: "p-0",
                    }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No amendments submitted yet.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="scores" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-medium text-gray-900 dark:text-white">
                  Evaluators
                </h4>
                {evaluatorScores && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {evaluatorScores.submittedEvaluators} of{" "}
                    {evaluatorScores.allEvaluators} evaluators submitted
                    {evaluatorScores.averageScore && (
                      <span className="ml-4">
                        Average Score:{" "}
                        <span className="font-medium">
                          {evaluatorScores.averageScore}/100
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Loading State */}
              {isLoadingEvaluatorScores && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">
                    Loading evaluator scores...
                  </div>
                </div>
              )}

              {/* Error State */}
              {evaluatorScoresError && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-red-500">
                    Error loading evaluator scores. Please try again.
                  </div>
                </div>
              )}

              {/* Data Table */}
              {!isLoadingEvaluatorScores && !evaluatorScoresError && (
                <DataTable
                  data={evaluatorTableData}
                  columns={evaluatorColumns}
                  options={{
                    disablePagination: true,
                    disableSelection: true,
                    isLoading: isLoadingEvaluatorScores,
                    totalCounts: evaluatorTableData.length,
                    manualPagination: false,
                    setPagination: () => {},
                    pagination: { pageIndex: 0, pageSize: 10 },
                  }}
                  classNames={{
                    table: "border-separate border-spacing-y-2",
                    tHeader: "bg-gray-50 dark:bg-slate-800",
                    tHead:
                      "text-left font-medium text-gray-700 dark:text-gray-300 py-3 px-4",
                    tRow: "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg",
                    tCell: "py-4 px-4 text-sm",
                  }}
                />
              )}

              {/* Empty State */}
              {!isLoadingEvaluatorScores &&
                !evaluatorScoresError &&
                evaluatorTableData.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No evaluators assigned to this solicitation yet.
                    </p>
                  </div>
                )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Award Vendor Confirmation Modal */}
      {isOwner && (
        <ConfirmAlert
          open={showAwardModal}
          onClose={setShowAwardModal}
          onPrimaryAction={handleConfirmAward}
          title="Award Vendor"
          text="Are you sure you want to award this vendor? This action cannot be undone."
          primaryButtonText="Award Vendor"
          secondaryButtonText="Cancel"
          type="award"
          showSecondaryButton={true}
          isLoading={awardVendorMutation.isPending}
        />
      )}

      {/* Amend Submission Dialog */}
      {selectedDocumentForAmend && (
        <AmendSubmissionDialog
          open={showAmendDialog}
          onOpenChange={setShowAmendDialog}
          documentName={selectedDocumentForAmend.name}
          proposalId={proposal?.proposalDetails?.id ?? ""}
          requirementDocId={selectedDocumentForAmend.requiredDocId}
          fileId={selectedDocumentForAmend._id}
          onAmendSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["vendor-proposal", id, vendorId],
            });
            queryClient.invalidateQueries({ queryKey: ["amendments"] });
            setShowAmendDialog(false);
            setSelectedDocumentForAmend(null);
          }}
        />
      )}

      {/* Read-Only Proposal Dialog */}
      <ReadOnlyProposalDialog
        open={showReadOnlyProposalDialog}
        onOpenChange={setShowReadOnlyProposalDialog}
        proposalId={proposal?.proposalDetails?.id ?? ""}
      />

      {/* Amend Proposal Dialog */}
      <AmendProposalDialog
        open={showAmendProposalDialog}
        onOpenChange={setShowAmendProposalDialog}
        proposalId={proposal?.proposalDetails?.id ?? ""}
      />

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedDocument(null);
          }}
          fileUrl={selectedDocument.url}
          fileName={selectedDocument.name}
          fileType={getFileExtension(
            selectedDocument.name,
            selectedDocument.type
          )}
        />
      )}
    </div>
  );
};

export default ProposalDetailsPage;
