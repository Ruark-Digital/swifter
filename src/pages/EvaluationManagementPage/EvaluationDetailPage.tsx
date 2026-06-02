import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  Share2,
  Users,
  FileText,
  Edit,
  ChevronDown,
  ArrowRightIcon,
  Trash2,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { DataTable } from "@/components/layouts/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import EvaluationScorecardSheet from "./components/EvaluationScorecardSheet";
import { ProposalPriceBreakdownSheet } from "./components/ProposalPriceBreakdownSheet";
import CriteriaScorecardSheet from "./components/CriteriaScorecardSheet";
import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";
import {
  useEvaluationDetail,
  useEvaluationEvaluators,
  // useEvaluationCriteria,
  // useEvaluationGroups,
  useEvaluationBidComparison,
  useReleaseEvaluationGroup,
  useWithholdEvaluationGroup,
  useDeleteEvaluationGroup,
  // useDeleteEvaluationCriteria,
  BidComparisonItem,
} from "./hooks/useEvaluationDetailApi";
import EditEvaluationDialog from "./components/EditEvaluationDialog";
import { PageLoader } from "@/components/ui/PageLoader";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import { useToastHandler } from "@/hooks/useToaster";
import { ApiResponseError } from "@/types";
import {
  getEvaluationStatusLabel,
  getEvaluationStatusColorClass,
} from "@/lib/evaluationStatusUtils";
import { formatDateTZ } from "@/lib/utils";
import { truncate } from "lodash";

// Component Types

type Evaluator = {
  _id: string;
  name: string;
  email: string;
  progress: number;
  evaluationGroups: string[]; // consolidated list of groups
  criteriaAssigned: number;
  status: "Completed" | "Pending";
};

type BidComparison = {
  id: string;
  vendorName: string;
  totalPrice: number;
  submissionDate: string;
  score: number;
  rank: number;
  rankType: "first" | "second" | "third" | "other";
};

type Document = {
  _id: string;
  document: string;
  assignedGroup: string;
  vendorsSubmitted: string;
};

// Mock data generators for features not yet implemented in API

// Mock data function removed - now using real API data

// Status badge component for evaluators
const EvaluatorStatusBadge = ({ status }: { status: Evaluator["status"] }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200";
    }
  };

  return <Badge className={`${getStatusColor(status)} border`}>{status}</Badge>;
};

// Status badge component for evaluation groups
const EvaluationGroupStatusBadge = ({ status }: { status: string }) => {
  return (
    <Badge className={`${getEvaluationStatusColorClass(status)} border`}>
      {getEvaluationStatusLabel(status)}
    </Badge>
  );
};

// Rank badge component for bid comparison
const RankBadge = ({
  rank,
  rankType,
}: {
  rank: number;
  rankType: BidComparison["rankType"];
}) => {
  const getRankColor = (rankType: BidComparison["rankType"]) => {
    switch (rankType) {
      case "first":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200";
      case "second":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200";
      case "third":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200";
      case "other":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200";
    }
  };

  const getRankText = (rank: number, rankType: BidComparison["rankType"]) => {
    if (rankType === "first") return "1st";
    if (rankType === "second") return "2nd";
    if (rankType === "third") return "3rd";
    return `${rank}`;
  };

  return (
    <Badge className={`${getRankColor(rankType)} border`}>
      {getRankText(rank, rankType)}
    </Badge>
  );
};

const EvaluationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <div>Evaluation not found</div>;
  }
  return <EvaluationDetailPageContent id={id} />;
};

const EvaluationDetailPageContent: React.FC<{ id: string }> = ({ id }) => {
  // API queries
  const {
    data: evaluationResponse,
    isLoading: evaluationLoading,
    error: evaluationError,
  } = useEvaluationDetail(id);

  const evaluation = evaluationResponse?.data?.data;
  const isOwner = evaluation?.owner || false;
  const { data: evaluatorsResponse } = useEvaluationEvaluators(id);

  // State for dialog management
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [withholdDialogOpen, setWithholdDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  // const [criteriaDeleteDialogOpen, setCriteriaDeleteDialogOpen] =
  //   useState(false);
  // const [selectedCriteriaId, setSelectedCriteriaId] = useState<string>("");

  // State for tab management
  const [activeTab, setActiveTab] = useState("overview");

  // Toast handler
  const toastHandlers = useToastHandler();

  // Mutation hooks
  const releaseGroupMutation = useReleaseEvaluationGroup();
  const withholdGroupMutation = useWithholdEvaluationGroup();
  const deleteGroupMutation = useDeleteEvaluationGroup();
  // const deleteCriteriaMutation = useDeleteEvaluationCriteria();

  // Export bid comparison mutation
  const exportBidComparisonMutation = useMutation<
    Blob,
    Error,
    { type: "pdf" | "docx" }
  >({
    mutationFn: async ({ type }) => {
      const response = await getRequest({
        url: `/procurement/evaluations/${id}/bid-comparison/export?type=${type}`,
        config: { responseType: "blob" },
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `evaluation-bid-comparison-${id}.${variables.type}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toastHandlers.success(
        "Export Successful",
        `Bid comparison exported as ${variables.type.toUpperCase()} successfully`
      );
    },
    onError: (error) => {
      toastHandlers.error(
        "Export Failed",
        error.message || "An error occurred during export"
      );
    },
  });

  const handleExportBidComparison = (type: "pdf" | "docx") => {
    exportBidComparisonMutation.mutate({ type });
  };

  // Download submission instruction (requirement) PDF
  const downloadRequirementMutation = useMutation<Blob, Error, void>({
    mutationFn: async () => {
      const response = await getRequest({
        url: `/procurement/evaluations/${id}/download-requirement`,
        config: { responseType: "blob" },
      });
      return response.data;
    },
    onSuccess: (data) => {
      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `submission-instruction-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toastHandlers.success(
        "Download Ready",
        "Submission instruction downloaded successfully"
      );
    },
    onError: (error) => {
      toastHandlers.error(
        "Download Failed",
        error.message || "An error occurred while downloading"
      );
    },
  });

  // Preview submission instruction (open in new tab)
  const previewRequirementMutation = useMutation<Blob, Error, void>({
    mutationFn: async () => {
      const response = await getRequest({
        url: `/procurement/evaluations/${id}/download-requirement`,
        config: { responseType: "blob" },
      });
      return response.data;
    },
    onSuccess: (data) => {
      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      // It's generally safe to revoke after a short delay to let the new tab load
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toastHandlers.success(
        "Preview Ready",
        "Opening submission instruction preview"
      );
    },
    onError: (error) => {
      toastHandlers.error(
        "Preview Failed",
        error.message || "An error occurred while opening the preview"
      );
    },
  });

  // Send evaluation requirements to proponents
  const sendRequirementMutation = useMutation<any, Error, void>({
    mutationFn: async () => {
      const response = await getRequest({
        url: `/procurement/evaluations/${id}/send-requirement`,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toastHandlers.success(
        "Requirements Sent",
        data?.data?.message ||
          "Submission requirements sent successfully to all proponents"
      );
    },
    onError: (error) => {
      toastHandlers.error(
        "Send Failed",
        error.message || "An error occurred while sending requirements"
      );
    },
  });

  // Handle release group
  const handleReleaseGroup = async () => {
    try {
      const result = await releaseGroupMutation.mutateAsync({
        evaluationGroupId: selectedGroupId,
        evaluationId: id,
      });

      if (result.status === 200) {
        toastHandlers.success("Release Group", "Group released successfully");
        setReleaseDialogOpen(false);
      } else {
        toastHandlers.error("Release Group", "Failed to release group");
      }
    } catch (error) {
      const err = error as ApiResponseError;
      toastHandlers.error("Release Group", err);
    }
  };

  // Handle withhold group
  const handleWithholdGroup = async () => {
    try {
      const result = await withholdGroupMutation.mutateAsync({
        evaluationGroupId: selectedGroupId,
        evaluationId: id,
      });
      if (result.status === 200) {
        toastHandlers.success("Withhold Group", "Group withheld successfully");
        setWithholdDialogOpen(false);
      } else {
        toastHandlers.error("Withhold Group", "Failed to withhold group");
      }
    } catch (error) {
      const err = error as ApiResponseError;
      toastHandlers.error("Withhold Group", err);
    }
  };

  // Handle delete group
  const handleDeleteGroup = async () => {
    try {
      const result = await deleteGroupMutation.mutateAsync({
        evaluationId: id,
        groupId: selectedGroupId,
      });
      if (result.status === 204) {
        toastHandlers.success("Delete Group", "Group deleted successfully");
        setDeleteDialogOpen(false);
      } else {
        toastHandlers.error("Delete Group", "Failed to delete group");
      }
    } catch (error) {
      const err = error as ApiResponseError;
      toastHandlers.error("Delete Group", err);
    }
  };

  // Handle delete criteria
  // const handleDeleteCriteria = async () => {
  //   try {
  //     const result = await deleteCriteriaMutation.mutateAsync({
  //       evaluationId: id,
  //       criteriaId: selectedCriteriaId,
  //     });

  //     if (result.status === 204) {
  //       toastHandlers.success(
  //         "Delete Criteria",
  //         "Criteria deleted successfully"
  //       );
  //       setCriteriaDeleteDialogOpen(false);
  //     } else {
  //       toastHandlers.error("Delete Criteria", "Failed to delete criteria");
  //     }
  //   } catch (error) {
  //     const err = error as ApiResponseError;
  //     toastHandlers.error("Delete Criteria", err);
  //   }
  // };

  /**
   * Map evaluator API response to a table-ready list.
   * Builds one row per evaluator and includes group names.
   *
   * @returns {Evaluator[]} Consolidated evaluator list with group membership.
   * @example
   * const rows = evaluators; // used by DataTable in Overview tab
   */
  const evaluators = useMemo(() => {
    const data = evaluatorsResponse?.data?.data;
    if (!data || !Array.isArray(data.groups)) return [];

    return data.groups.map((e) => {
      const evaluationGroups = Array.isArray(e.groups)
        ? e.groups.map((g) => g.groupName).filter(Boolean)
        : [];

      const progress = typeof e.progress === "number" ? e.progress : 0;
      const criteriaAssigned =
        typeof e.totalScorings === "number" ? e.totalScorings : 0;
      const status = (
        e.status === "Completed" ? "Completed" : "Pending"
      ) as Evaluator["status"];

      return {
        _id: e.id,
        name: e.name,
        email: e.email,
        evaluationGroups,
        criteriaAssigned,
        progress,
        status,
      };
    });
  }, [evaluatorsResponse]);

  const criteria = useMemo(() => {
    if (!evaluation?.criterias) return [];
    return evaluation.criterias.map((criterion) => ({
      _id: criterion._id,
      criteria: criterion.title,
      description: criterion.description,
      passFail: criterion.criteria.pass_fail || "-",
      weight: criterion.criteria.weight || "-",
      progress: criterion.progress || "-",
      consensus: (criterion as any).consensus,
      evaluationGroup: criterion.evaluationGroup || "-",
    }));
  }, [evaluation?.criterias]);

  // Mock data for features not yet implemented
  const documents = useMemo(() => {
    if (!evaluation?.requiredDocuments) return [];
    return evaluation.requiredDocuments.map((doc, index) => ({
      _id: `${index + 1}`,
      document: doc.title,
      assignedGroup: doc.groupName,
      vendorsSubmitted: `${doc.vendor}/${doc.vendorCount}`,
    }));
  }, [evaluation?.requiredDocuments]);
  const { data: bidComparisonData, isLoading: isBidComparisonLoading } =
    useEvaluationBidComparison(id);

  // Transform API data to match UI structure
  const bidComparison = useMemo(() => {
    if (!bidComparisonData?.data?.data) return [];

    return bidComparisonData.data.data.map(
      (item: BidComparisonItem, index: number) => ({
        id: item.proposalId,
        vendorName: item.vendorName || "Unknown Vendor",
        totalPrice: item.total || 0,
        submissionDate: item.submission
          ? new Date(item.submission).toLocaleDateString()
          : "N/A",
        score: item.score || 0,
        rank: item.rank || index + 1,
        rankType:
          item.rank === 1
            ? ("first" as const)
            : item.rank === 2
            ? ("second" as const)
            : item.rank === 3
            ? ("third" as const)
            : ("other" as const),
      })
    );
  }, [bidComparisonData]);

  // Loading state
  if (evaluationLoading) {
    return (
      <PageLoader
        title="Evaluation Details"
        message="Loading evaluation details..."
        className="p-6 min-h-full"
      />
    );
  }

  // Error state
  if (evaluationError || !evaluation) {
    return (
      <div className="flex items-center justify-center h-64">
        Error loading evaluation details
      </div>
    );
  }

  // Define documents table columns
  const documentsColumns: ColumnDef<Document>[] = [
    {
      accessorKey: "document",
      header: "Document",
    },
    {
      accessorKey: "assignedGroup",
      header: "Assigned Group",
    },
    {
      accessorKey: "vendorsSubmitted",
      header: "Vendors Submitted",
    },
  ];

  // Define criteria table columns
  const criteriaColumns: ColumnDef<any>[] = [
    {
      id: "expander",
      header: "",
      size: 40,
      cell: ({ row }) => {
        if (!row.getCanExpand()) return null;
        return (
          <button
            onClick={row.getToggleExpandedHandler()}
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {row.getIsExpanded() ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        );
      },
    },
    {
      accessorKey: "criteria",
      header: "Criteria",
      cell: ({ row }) => (
        <div className=" ">
          <div className="font-medium">{row.original.criteria}</div>
        </div>
      ),
    },
    {
      accessorKey: "passFail",
      header: "Pass/Fail",
      cell: ({ row }) => {
        const value = row.original.passFail;
        if (value === "-")
          return <span className="text-muted-foreground">-</span>;
        return (
          <Badge
            className={`${"bg-green-100 text-green-800 hover:bg-green-100 border-green-200"} border`}
          >
            Pass/Fail
          </Badge>
        );
      },
    },
    {
      accessorKey: "weight",
      header: "Weight",
      cell: ({ row }) => {
        const value = row.original.weight;
        return value === "-" ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          <span>{value}</span>
        );
      },
    },
    {
      accessorKey: "evaluationGroup",
      header: "Evaluation Group",
      cell: ({ row }) => {
        const group = row.original.evaluationGroup;
        return (
          <div
            className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-[280px]"
            title={group}
          >
            {group}
          </div>
        );
      },
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        return (
          <span className="font-medium">
            {row.original.progress?.toFixed?.(0) || 0}%
          </span>
        );
      },
    },
    {
      accessorKey: "consensus",
      header: "Consensus",
      cell: ({ row }) => {
        const p = row.original.progress;
        const progressNum = typeof p === "number" ? p : Number(p) || 0;
        if (progressNum !== 100)
          return <span className="text-muted-foreground">-</span>;
        const val = row.original.consensus ?? false;
        const label = typeof val === "boolean" ? (val ? "Yes" : "No") : "Yes";
        return <span className="font-medium">{label}</span>;
      },
    },

    {
      id: "actions",
      header: "Actions",
      cell({ row }) {
        const p = row.original.progress;
        const progressNum = typeof p === "number" ? p : Number(p) || 0;
        if (progressNum !== 100)
          return <span className="text-muted-foreground">-</span>;

        return (
          <div className="flex items-center gap-2">
            <CriteriaScorecardSheet
              evaluationId={id!}
              criteriaId={row.original._id}
            />
          </div>
        );
      },
    },
  ];

  // Define bid comparison table columns
  const bidComparisonColumns: ColumnDef<BidComparison>[] = [
    {
      accessorKey: "vendorName",
      header: "Vendor Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.vendorName}</div>
      ),
    },
    {
      accessorKey: "totalPrice",
      header: "Total Price",
      cell: ({ row }) => (
        <span className="font-medium">
          ${row.original.totalPrice.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "submissionDate",
      header: "Submission Date",
    },
    {
      accessorKey: "score",
      header: "Score",
      cell: ({ row }) => (
        <span className="font-medium">
          {Number(row.original.score).toFixed(0)}%
        </span>
      ),
    },
    {
      accessorKey: "rank",
      header: "Rank",
      cell: ({ row }) => (
        <RankBadge rankType={row.original.rankType} rank={row.original.rank} />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const proposalId = row.original.id; // This maps to proposalId from the bid comparison data
        const vendorName = row.original.vendorName;

        return (
          <ProposalPriceBreakdownSheet
            proposalId={proposalId}
            vendorName={vendorName}
            submissionDate={row.original.submissionDate}
            evaluationScore={row.original.score?.toString()}
            rank={row.original.rank.toString()}
          />
        );
      },
    },
  ];

  // Define evaluators table columns
  const evaluatorsColumns: ColumnDef<Evaluator>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "evaluationGroups",
      header: "Evaluation Group",
      cell: ({ row }) => {
        const groups: string[] = row.original.evaluationGroups || [];
        const text = groups.length ? groups.join(", ") : "-";
        return (
          <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
            {truncate(text, { length: 60 })}
          </div>
        );
      },
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        return (
          <span className="font-medium">
            {row.original.progress?.toFixed?.(0)}%
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <EvaluatorStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell({ row }) {
        const p = row.original.progress;
        const progressNum = typeof p === "number" ? p : Number(p) || 0;
        if (progressNum !== 100)
          return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-2">
            <EvaluationScorecardSheet
              evaluatorId={row.original._id}
              solicitationId={evaluation?.solicitation?._id || ""}
              timezone={evaluation?.timezone}
            />
          </div>
        );
      },
    },
  ];

  return (
    <main id="main-content" className="p-6 min-h-full" role="main">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
        <span>Evaluations</span>
        <ChevronRight className="h-4 w-4" />
        <span>My Evaluations</span>
        <ChevronRight className="h-4 w-4" />
        <span>Evaluation Details</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 dark:text-gray-100 font-medium">
          {evaluation?.solicitation?.name || "Loading..."}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">
            {evaluation?.solicitation?.name}
          </h1>
        </div>
        <Badge
          className={getEvaluationStatusColorClass(evaluation?.status || "")}
        >
          {getEvaluationStatusLabel(evaluation?.status || "")}
        </Badge>
      </div>

      {/* Evaluation ID and Type */}
      <div className="flex items-center gap-6 mb-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{evaluation?.evalId}</span> •{" "}
          {evaluation?.solicitation?.type}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="link" className="mb-7 space-x-2">
            Action
            <ArrowRightIcon
              className="dark:text-gray-200"
              size={16}
              aria-hidden="true"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => downloadRequirementMutation.mutate()}
              disabled={downloadRequirementMutation.isPending}
            >
              <span> Download Submission Instruction</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => previewRequirementMutation.mutate()}
              disabled={previewRequirementMutation.isPending}
            >
              <span>Preview</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => sendRequirementMutation.mutate()}
              disabled={sendRequirementMutation.isPending}
            >
              <span>Publish Submission Instruction</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 !bg-transparent p-0 w-full justify-start">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="evaluationGroup"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Evaluation Groups
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Requested Documents
          </TabsTrigger>
          <TabsTrigger
            value="criteria"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Evaluation Criteria
          </TabsTrigger>
          <TabsTrigger
            value="evaluators"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Evaluators
          </TabsTrigger>
          <TabsTrigger
            value="comparison"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Bid Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Evaluation Details Section */}
          <div className="">
            <div className="py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Evaluation Details
                </h2>
                <div className="flex items-center gap-3">
                  <ExportReportSheet evaluationId={id} />
                  {isOwner && (
                    <EditEvaluationDialog evaluationId={id} page="overview">
                      <Button>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Evaluation
                      </Button>
                    </EditEvaluationDialog>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Start Date
                    </h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {evaluation?.startDate
                        ? formatDateTZ(
                            evaluation.startDate,
                            "MMMM dd, yyyy hh:mm a",
                            evaluation?.timezone
                          )
                        : "N/A"}{" "}
                      {evaluation?.timezone}
                    </p>
                  </div>

                  <Card
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setActiveTab("comparison")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Invited Vendors
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {evaluation?.vendorCount || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </Card>

                  <Card
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setActiveTab("criteria")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Criteria
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {evaluation?.criteriaCount || criteria.length}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </Card>

                  <Card
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setActiveTab("documents")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Documents
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {evaluation?.documents || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      End Date
                    </h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {evaluation?.endDate
                        ? formatDateTZ(
                            evaluation.endDate,
                            "MMMM dd, yyyy hh:mm a",
                            evaluation?.timezone
                          )
                        : "N/A"}{" "}
                      {evaluation?.timezone}
                    </p>
                  </div>

                  <Card
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setActiveTab("evaluationGroup")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Evaluation Groups
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {evaluation?.groups || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </Card>

                  <Card
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setActiveTab("evaluators")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Evaluators
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {evaluation?.solicitationDetails?.evaluators
                            ?.length || evaluators.length}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evaluationGroup" className="space-y-6">
          {/* Evaluation Group Header */}
          <div className="flex items-center justify-between pt-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Evaluation Groups
            </h2>
            {isOwner && (
              <EditEvaluationDialog evaluationId={id} page="groups">
                <Button
                  variant="outline"
                  className="text-gray-600 dark:text-gray-400"
                >
                  Edit Evaluation Groups
                </Button>
              </EditEvaluationDialog>
            )}
          </div>

          {/* Loading state */}
          {(!evaluation?.evaluationGroups ||
            evaluation.evaluationGroups.length === 0) && (
            <div className="flex items-center justify-center h-64 border rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                No evaluation groups found
              </p>
            </div>
          )}

          {/* Evaluation Groups from API */}
          {evaluation?.evaluationGroups?.map((group, index) => (
            <Card
              key={index}
              className="border border-gray-200 dark:border-gray-700"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {group.groupName}
                  </h3>
                  <div className="flex gap-2">
                    {isOwner && (
                      <ConfirmAlert
                        type="delete"
                        title="Delete Group"
                        text={`This will permanently delete the evaluation group and its assignments. This action cannot be undone.`}
                        primaryButtonText="Delete"
                        secondaryButtonText="Cancel"
                        isLoading={deleteGroupMutation.isPending}
                        onPrimaryAction={handleDeleteGroup}
                        open={
                          deleteDialogOpen && selectedGroupId === group.groupId
                        }
                        onClose={(open) => {
                          setDeleteDialogOpen(open);
                          if (!open) setSelectedGroupId("");
                        }}
                        trigger={
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => {
                              setSelectedGroupId(group.groupId);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                    )}
                    {isOwner && group.status === "Withhold" && (
                      <ConfirmAlert
                        type="success"
                        title="Release Group"
                        text={`This action will unseal the proposal documents, the evaluators will be notified to begin review and evaluation of the proposal.`}
                        primaryButtonText="Release"
                        secondaryButtonText="Cancel"
                        isLoading={releaseGroupMutation.isPending}
                        onPrimaryAction={handleReleaseGroup}
                        open={
                          releaseDialogOpen && selectedGroupId === group.groupId
                        }
                        onClose={(open) => {
                          setReleaseDialogOpen(open);
                          if (!open) setSelectedGroupId("");
                        }}
                        trigger={
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {
                              setSelectedGroupId(group.groupId);
                              setReleaseDialogOpen(true);
                            }}
                          >
                            Release Group
                          </Button>
                        }
                      />
                    )}
                    {isOwner && group.status === "Release" && (
                      <ConfirmAlert
                        type="warning"
                        title="Withhold Group"
                        text={`This action will enable the evaluators assigned to this group and criteria to evaluate`}
                        primaryButtonText="Withhold"
                        secondaryButtonText="Cancel"
                        isLoading={withholdGroupMutation.isPending}
                        onPrimaryAction={handleWithholdGroup}
                        open={
                          withholdDialogOpen &&
                          selectedGroupId === group.groupId
                        }
                        onClose={(open) => {
                          setWithholdDialogOpen(open);
                          if (!open) setSelectedGroupId("");
                        }}
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20"
                            onClick={() => {
                              setSelectedGroupId(group.groupId);
                              setWithholdDialogOpen(true);
                            }}
                          >
                            Withhold Group
                          </Button>
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-6 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Requested Document ({group.documentTitles.length})
                    </h4>
                    {group.documentTitles.length > 0 ? (
                      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                        {group.documentTitles.map((doc, idx) => (
                          <li key={idx}>• {doc}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">
                        No documents assigned
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Assigned Criteria ({group.criteriaDetails.length})
                    </h4>
                    {group.criteriaDetails.length > 0 ? (
                      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                        {group.criteriaDetails.map((criteria, idx) => (
                          <li key={idx}>• {criteria.title}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">
                        No criteria assigned
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Evaluators ({group.evaluators.length})
                    </h4>
                    {group.evaluators.length > 0 ? (
                      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                        {group.evaluators.map((evaluator, idx) => (
                          <li key={idx}>• {evaluator.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">
                        No evaluators assigned
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Progress
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {/* Placeholder for progress - would need additional API data */}
                      {group.averageProgress?.toFixed(0) ?? 0}%
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Status
                    </h4>
                    <EvaluationGroupStatusBadge status={group.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Requested Documents
              </h2>
              {isOwner && (
                <EditEvaluationDialog evaluationId={id} page="documents">
                  <Button variant="outline" size="sm">
                    Edit Requested Document
                  </Button>
                </EditEvaluationDialog>
              )}
            </div>

            <Card>
              <CardContent className="p-0 rounded-xl">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                    Requested Documents
                  </h3>
                </div>
                <div className="p-6">
                  <DataTable
                    data={documents}
                    columns={documentsColumns}
                    classNames={{
                      tCell: "text-center",
                      tHead: "text-center",
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="criteria" className="space-y-6">
          <div className="space-y-3 pt-5">
            <div className="pb-4 w-full">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Evaluation Criteria
                </h2>
                {isOwner && (
                  <EditEvaluationDialog evaluationId={id} page="criteria">
                    <Button
                      variant="outline"
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Criteria
                    </Button>
                  </EditEvaluationDialog>
                )}
              </div>
            </div>

            <DataTable
              data={criteria}
              columns={criteriaColumns}
              header={() => (
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700 w-full">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Evaluation Criteria
                    </h2>
                  </div>
                </div>
              )}
              options={{
                disableSelection: true,
                enableExpanding: true,
                getRowCanExpand: () => true,
                renderSubComponent: ({ row }) => (
                  <div className="pl-16 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <div className="font-medium mb-1">Description</div>
                    <div>{row.original.description || "-"}</div>
                  </div>
                ),
              }}
              classNames={{
                container: "bg-white dark:bg-slate-950 rounded-xl px-3",
                // tCell: "text-center",
                // tHead: "text-center",
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="evaluators" className="space-y-6">
          <div className="space-y-6 pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Evaluators
              </h2>
              <EditEvaluationDialog evaluationId={id} page="groups">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Evaluators
                </Button>
              </EditEvaluationDialog>
            </div>
            <DataTable
              data={evaluators}
              columns={evaluatorsColumns}
              header={() => (
                <div className="px-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Evaluators
                  </h2>
                </div>
              )}
              options={{
                disablePagination: true,
                disableSelection: true,
                isLoading: false,
                totalCounts: evaluators.length,
                manualPagination: false,
                setPagination: () => {},
                pagination: { pageIndex: 0, pageSize: 10 },
              }}
              classNames={{
                container:
                  "border-b border-gray-200 dark:border-gray-700 px-3 rounded-xl bg-white dark:bg-slate-950",
                table: "w-full",
                tHeader: "bg-gray-50 dark:bg-gray-800 px-4",
                tHeadRow: "border-b border-gray-200 dark:border-gray-700",
                tBody: "bg-white dark:bg-gray-900",
                tRow: "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800",
                tCell: "px-6 py-4 text-sm",
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="">
            <div className="py-4 ">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Bid Comparison
                </h2>
                <div className="flex items-center gap-4">
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                          disabled={exportBidComparisonMutation.isPending}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          {exportBidComparisonMutation.isPending
                            ? "Exporting..."
                            : "Export"}
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                          Export Bid Comparison
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleExportBidComparison("pdf")}
                        >
                          Export as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExportBidComparison("docx")}
                        >
                          Export as DOCX
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>

            <DataTable
              data={bidComparison}
              columns={bidComparisonColumns}
              header={() => (
                <div className="mt-4 flex items-center justify-between gap-4 w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Price Comparison
                    </span>
                  </div>
                </div>
              )}
              options={{
                disablePagination: true,
                disableSelection: true,
                isLoading: isBidComparisonLoading,
                totalCounts: bidComparison.length,
                manualPagination: false,
                setPagination: () => {},
                pagination: { pageIndex: 0, pageSize: 10 },
              }}
              classNames={{
                container: "bg-white dark:bg-slate-950 rounded-xl px-3",
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default EvaluationDetailPage;

// ...
