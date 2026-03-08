import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, Eye, Download, FileText, InfoIcon } from "lucide-react";
import { DocSVG } from "@/assets/icons/Doc";
import { PdfSVG } from "@/assets/icons/Pdf";
import { ExcelSVG } from "@/assets/icons/Excel";
import { ZipSVG } from "@/assets/icons/Zip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useForge } from "@/lib/forge";
import { useToastHandler } from "@/hooks/useToaster";
import { PageLoader } from "@/components/ui/PageLoader";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import * as yup from "yup";
import { useUser } from "@/store/authSlice";

// API Types based on documentation
type VendorDocument = {
  _id: string;
  name: string;
  type: string;
  url: string;
  size: string;
  uploadedAt: string;
};

// ProposalPriceAction interface based on API schema
interface ProposalPriceAction {
  component: string;
  description?: string;
  quantity: number;
  unitOfMeasurement: string;
  unitPrice: number;
  subtotal: number;
  subItems?: ProposalPriceAction[];
}

// Response interface for the API
// interface ProposalPriceBreakdownResponse {
//   message: string;
//   data: ProposalPriceAction[];
// }

type EvaluatorCriteria = {
  _id: string;
  description: string;
  title: string;
  uploads: {
    _id: string;
    title: string;
    type: string;
  }[];
  criteria: {
    status: string;
    pass_fail: string;
    weight: number;
  };
  scoring: {
    _id: string;
    progress: number;
    scoring: {
      pass_fail: "pass" | "fail";
      weight: number;
    };
    comment: string;
  };
};

type EvaluatorEvaluationDetail = {
  _id: string;
  solicitation: {
    _id: string;
    name: string;
    typeId: {
      _id: string;
      name: string;
    };
    solId: string;
  };
  status: string;
};

type SubmittedDocumentResponse = {
  documents: VendorDocument[][];
  info: {
    _id: string;
    name: string;
    status: string;
    solId: string;
    typeId: {
      name: string;
    };
  };
  pricingTable: boolean,
  proposalId: string
};

type SubmitEvaluationResponse = {
  message: string;
};

type CriteriaScorePayload = {
  comment: string;
  score: string | number;
  type: "pass_fail" | "weight";
};

// Form validation schema
const criteriaScoreSchema = yup.object({
  comment: yup.string().required("Comment is required"),
  score: yup.mixed().required("Score is required"),
  type: yup.string().oneOf(["pass_fail", "weight"]).required(),
});

// API Hooks
const useSubmittedDocuments = (
  evaluationId: string,
  evaluationGroupId: string,
  vendorId: string,
  userId: string
) => {
  return useQuery<ApiResponse<SubmittedDocumentResponse>, ApiResponseError>({
    queryKey: [
      "submitted-documents",
      evaluationId,
      evaluationGroupId,
      vendorId,
      userId
    ],
    queryFn: async () => {
      const response = await getRequest({
        url: `/evaluator/${evaluationId}/evaluation-group/${evaluationGroupId}/submitted-document/${vendorId}`,
      });
      return response;
    },
    enabled: !!evaluationId && !!evaluationGroupId && !!vendorId,
  });
};

type EvaluationCriteriaResponse = {
  criteria: EvaluatorCriteria[];
  info: EvaluatorEvaluationDetail;
  submissionStatus: "Submitted" | "In Progress";
};

const useEvaluationCriteria = (
  evaluatorId: string,
  evaluationGroupId: string,
  vendorId: string
) => {
  return useQuery<ApiResponse<EvaluationCriteriaResponse>, ApiResponseError>({
    queryKey: ["evaluation-criteria", evaluatorId, evaluationGroupId, vendorId],
    queryFn: async () => {
      const response = await getRequest({
        url: `/evaluator/${evaluatorId}/evaluation-group/${evaluationGroupId}/vendor/${vendorId}/criteria`,
      });
      return response;
    },
    enabled: !!evaluatorId && !!evaluationGroupId && !!vendorId,
  });
};

const usePricingBreakdown = (proposalId: string) => {
  return useQuery<ApiResponse< ProposalPriceAction[]>, ApiResponseError>({
    queryKey: ["pricing-breakdown", proposalId],
    queryFn: async () => {
      const response = await getRequest({
        url: `/procurement/evaluations/proposal/${proposalId}`,
      });
      return response;
    },
    enabled: !!proposalId,
  });
};

const useSubmitCriteriaScore = () => {
  const queryClient = useQueryClient();
  const toast = useToastHandler();

  return useMutation<
    ApiResponse<any>,
    ApiResponseError,
    {
      evaluationId: string;
      criteriaId: string;
      vendorId: string;
      payload: CriteriaScorePayload;
    }
  >({
    mutationFn: async ({ evaluationId, criteriaId, vendorId, payload }) => {
      const response = await postRequest({
        url: `/evaluator/${evaluationId}/criteria-score/${criteriaId}/vendor/${vendorId}`,
        payload,
      });
      return response;
    },
    onSuccess: () => {
      toast.success("Success", "Evaluation criteria score saved successfully");
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria"] });
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to save evaluation criteria score");
    },
  });
};

type RevisitCriteriaScoreResponse = {
  status: number;
  message: string;
  data: any;
};

const useRevisitCriteriaScore = () => {
  const queryClient = useQueryClient();
  const toast = useToastHandler();

  return useMutation<
    ApiResponse<RevisitCriteriaScoreResponse>,
    ApiResponseError,
    {
      evaluationId: string;
      criteriaId: string;
      vendorId: string;
      payload: CriteriaScorePayload;
    }
  >({
    mutationFn: async ({ evaluationId, criteriaId, vendorId, payload }) => {
      const response = await postRequest({
        url: `/evaluator/${evaluationId}/criteria-score/${criteriaId}/vendor/${vendorId}/revisit`,
        payload,
      });
      return response;
    },
    onSuccess: (response) => {
      const serverMessage = response?.data?.message || "Revised score submitted successfully";
      toast.success("Success", serverMessage);
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria"] });
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to revise evaluation criteria score");
    },
  });
};

const SubmittedDocumentPage: React.FC = () => {
  const user = useUser();
  const { id, groupId, vendorId } = useParams<{
    id: string;
    groupId: string;
    vendorId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // API calls
  const {
    data: documentsData,
    isLoading: documentsLoading,
    error: documentsError,
  } = useSubmittedDocuments(id || "", groupId || "", vendorId || "", user?._id || "");

  const {
    data: criteriaData,
    isLoading: criteriaLoading,
    error: criteriaError,
  } = useEvaluationCriteria(id || "", groupId || "", vendorId || "");

  // Get proposalId from bid comparison data
  const proposalId = documentsData?.data?.data?.proposalId || null

  const isPricingTableEnabled = documentsData?.data?.data?.pricingTable || false

  // Add pricing breakdown API call
  const {
    data: pricingData,
    isLoading: pricingLoading,
    error: pricingError,
  } = usePricingBreakdown(proposalId || "");
  

  const submitScoreMutation = useSubmitCriteriaScore();
  const revisitScoreMutation = useRevisitCriteriaScore();

  // Transform API data
  const documents = useMemo(() => {
    return documentsData?.data?.data?.documents || [];
  }, [documentsData]);

  const evaluationInfo = useMemo(() => {
    return documentsData?.data?.data?.info;
  }, [documentsData]);

  const criteria = useMemo(() => {
    return criteriaData?.data?.data?.criteria || [];
  }, [criteriaData]);

  const criteriaEvaluationInfo = useMemo(() => {
    return criteriaData?.data?.data?.info;
  }, [criteriaData]);

  // Transform pricing data
  const pricingBreakdown = useMemo(() => {
    const data = pricingData?.data?.data;
    return Array.isArray(data) ? data : [];
  }, [pricingData]);

  // Calculate total pricing
  const totalAmount = useMemo(() => {
    // Safeguard: Check if pricingBreakdown exists and is an array
    if (!pricingBreakdown || !Array.isArray(pricingBreakdown) || pricingBreakdown.length === 0) {
      return 0;
    }

    return pricingBreakdown.reduce((sum: number, item: ProposalPriceAction) => {
      // Safeguard: Check if item exists
      if (!item) return sum;
      
      const itemTotal = item.subtotal || 0;
      const subItemsTotal = (item.subItems || []).reduce(
        (subSum: number, subItem: ProposalPriceAction) => 
          subSum + (subItem?.subtotal || 0), 
        0
      );
      return sum + itemTotal + subItemsTotal;
    }, 0);
  }, [pricingBreakdown]);

  const [activeCriteriaId, setActiveCriteriaId] = useState<string | null>(null);
  const [editingCriteriaId, setEditingCriteriaId] = useState<string | null>(null);
  const [revisedCriteriaTimestamps, setRevisedCriteriaTimestamps] = useState<Record<string, string>>({});
  const [submittedCriteriaTimestamps, setSubmittedCriteriaTimestamps] = useState<Record<string, string>>({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Document viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<VendorDocument | null>(null);

  // State to store form values for each criteria
  const [criteriaFormStates, setCriteriaFormStates] = useState<
    Record<string, CriteriaScorePayload>
  >({});

  // Forge form setup for criteria scoring
  const { handleSubmit, reset, watch, setValue } =
    useForge<CriteriaScorePayload>({
      defaultValues: {
        comment: "",
        score: "",
        type: "pass_fail",
      },
      resolver: async (data) => {
        try {
          await criteriaScoreSchema.validate(data, { abortEarly: false });
          return { values: data, errors: {} };
        } catch (error: any) {
          const errors: Record<string, any> = {};
          error.inner?.forEach((err: any) => {
            if (err.path) errors[err.path] = { message: err.message };
          });
          return { values: {}, errors };
        }
      },
    });

  // Add mutation for submitting final evaluation
  const toast = useToastHandler();

  const submitEvaluationMutation = useMutation<
    ApiResponse<SubmitEvaluationResponse>,
    ApiResponseError
  >({
    mutationFn: async () => {
      const response = await postRequest({
        url: `/evaluator/${id}/submit-evaluation/vendor/${vendorId}`,
        payload: {},
      });
      return response;
    },
    onSuccess: (response) => {
      toast.success(
        "Success",
        response.data?.message || "Evaluation submitted successfully"
      );
      setShowSubmitDialog(false);
      // navigate(`/dashboard/evaluation/assigned/${groupId}`);
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria"] });
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to submit evaluation");
      setShowSubmitDialog(false);
    },
  });

  // Form submission handler
  const onSubmitScore = async (data: CriteriaScorePayload) => {
    if (!activeCriteriaId || !id || !vendorId) return;

    const normalizedPayload: CriteriaScorePayload = {
      ...data,
      score:
        data.type === "weight"
          ? Number(data.score)
          : data.score,
    };

    if (isEvaluationSubmitted) {
      const response = await revisitScoreMutation.mutateAsync({
        evaluationId: id!,
        criteriaId: activeCriteriaId,
        vendorId: vendorId!,
        payload: normalizedPayload,
      });
      const resData = (response as any)?.data?.data || {};
      const revisedAt = resData?.revisedAt;
      const submittedAt = resData?.submittedAt;
      if (revisedAt) {
        setRevisedCriteriaTimestamps((prev) => ({
          ...prev,
          [activeCriteriaId]: revisedAt,
        }));
      }
      if (submittedAt) {
        setSubmittedCriteriaTimestamps((prev) => ({
          ...prev,
          [activeCriteriaId]: submittedAt,
        }));
      }
    } else {
      await submitScoreMutation.mutateAsync({
        evaluationId: id!,
        criteriaId: activeCriteriaId,
        vendorId: vendorId!,
        payload: normalizedPayload,
      });
    }

    // Remove the saved form state for this criteria after successful submission
    setCriteriaFormStates((prev) => {
      const newState = { ...prev };
      delete newState[activeCriteriaId];
      return newState;
    });

    // Reset form and close
    reset();
    setActiveCriteriaId(null);
    setEditingCriteriaId(null);
  };

  // Handle criteria scoring
  const handleStartScoring = (criteriaId: string, criteriaType: string) => {
    // Save current form state before switching
    if (activeCriteriaId && activeCriteriaId !== criteriaId) {
      const currentFormData = {
        comment: watch("comment") as string,
        score:
          watch("type") === "weight"
            ? Number(watch("score"))
            : (watch("score") as string),
        type: watch("type") as "pass_fail" | "weight",
      };
      setCriteriaFormStates((prev) => ({
        ...prev,
        [activeCriteriaId]: currentFormData,
      }));
    }

    setActiveCriteriaId(criteriaId);
    setEditingCriteriaId(null);

    // Find the criteria item to get existing scoring data
    const criteriaItem = criteria.find((item) => item._id === criteriaId);
    const existingScoring = criteriaItem?.scoring;

    // Load saved form state for this criteria or use existing scoring data or defaults
    const savedState = criteriaFormStates[criteriaId];
    if (savedState) {
      reset(savedState);
    } else if (existingScoring) {
      // Pre-populate with existing scoring data from API
      // For weight-based scoring, map stored percentage (e.g., 80) to radio value (1–10) by dividing by 10
      const scoreValue =
        criteriaType === "pass_fail"
          ? existingScoring.scoring.pass_fail
          : typeof existingScoring.scoring.weight === "number" && existingScoring.scoring.weight > 0
            ? existingScoring.scoring.weight / 10
            : "";

      reset({
        comment: existingScoring.comment || "",
        score: scoreValue,
        type: criteriaType as "pass_fail" | "weight",
      });
    } else {
      reset({
        comment: "",
        score: "",
        type: criteriaType as "pass_fail" | "weight",
      });
    }
  };

  // Handle accordion close - save form state
  const handleAccordionClose = () => {
    if (activeCriteriaId) {
      const currentFormData = {
        comment: watch("comment") as string,
        score:
          watch("type") === "weight"
            ? Number(watch("score"))
            : (watch("score") as string),
        type: watch("type") as "pass_fail" | "weight",
      };
      setCriteriaFormStates((prev) => ({
        ...prev,
        [activeCriteriaId]: currentFormData,
      }));
    }
    setActiveCriteriaId(null);
  };

  // Loading state
  if (documentsLoading || criteriaLoading) {
    return (
      <PageLoader
        title="Submitted Documents"
        message="Loading evaluation documents..."
        className="p-6 min-h-full"
      />
    );
  }

  // Error state
  if (documentsError || criteriaError) {
    return (
      <div className="p-6 min-h-full">
        <div className="flex items-center justify-center py-8">
          <div className="text-red-500">
            Error: {documentsError?.message || criteriaError?.message}
          </div>
        </div>
      </div>
    );
  }

  // Function to handle going back to the evaluation detail page
  const handleBack = () => {
    navigate(`/dashboard/evaluation/assigned/${id}/${groupId}`);
  };

  // Handle document viewing
  const handleViewDocument = (document: VendorDocument) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  // Flatten pricing items for display
  const flattenPricingItems = (items: ProposalPriceAction[], level = 0): (ProposalPriceAction & { level: number; itemNumber: string })[] => {
    const result: (ProposalPriceAction & { level: number; itemNumber: string })[] = [];
    
    // Safeguard: Ensure items is an array
    if (!Array.isArray(items) || items.length === 0) {
      return result;
    }
    
    items.forEach((item, index) => {
      const itemNumber = level === 0 ? (index + 1).toString() : `${Math.floor(index / 10) + 1}.${(index % 10) + 1}`;
      result.push({ ...item, level, itemNumber });
      
      if (Array.isArray(item.subItems) && item.subItems.length > 0) {
        result.push(...flattenPricingItems(item.subItems, level + 1));
      }
    });
    
    return result;
  };

  const flattenedPricingItems = flattenPricingItems(pricingBreakdown);
  const isEvaluationSubmitted = criteriaData?.data?.data?.submissionStatus === "Submitted";
  const evaluationStatus = (evaluationInfo?.status || criteriaEvaluationInfo?.status || "").toString();
  const isEvaluationCompleted = evaluationStatus.toLowerCase() === "completed";

  return (
    <div className="p-6 min-h-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
        <span
          className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
          onClick={handleBack}
        >
          Evaluation Management
        </span>
        <ChevronRight className="w-4 h-4" />
        <span
          className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
          onClick={handleBack}
        >
          Assigned Evaluation Detail
        </span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 dark:text-gray-100 font-medium">
          Submitted Document
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">
            {evaluationInfo?.name ||
              criteriaEvaluationInfo?.solicitation?.name ||
              "Loading..."}
          </h1>
        </div>
        <Badge
          variant="secondary"
          className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700"
        >
          {evaluationInfo?.status || criteriaEvaluationInfo?.status || "Active"}
        </Badge>
      </div>

      {/* Evaluation ID and Type */}
      <div className="flex items-center gap-6 mb-8">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">
            {evaluationInfo?.solId ||
              criteriaEvaluationInfo?.solicitation?.solId ||
              ""}
          </span>{" "}
          •{" "}
          {evaluationInfo?.typeId?.name ||
            criteriaEvaluationInfo?.solicitation?.typeId?.name ||
            "RFP"}
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="requested-documents" className="w-full">
        <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 !bg-transparent p-0 w-full justify-start">
          <TabsTrigger
            value="requested-documents"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Requested Documents
          </TabsTrigger>
          <TabsTrigger
            value="evaluation-criteria"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Evaluation Criteria
          </TabsTrigger>
          <TabsTrigger
            value="pricing-breakdown"
            disabled={!isPricingTableEnabled}
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Pricing Breakdown
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requested-documents" className="mt-0">
          {/* Submitted Document Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Submitted Document
            </h2>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {documents.length > 0 ? (
              documents.map((document, index) => (
                <Document
                  document={document?.[0]}
                  key={index}
                  onViewDocument={handleViewDocument}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No documents submitted
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="evaluation-criteria" className="mt-0">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Evaluation Criteria
            </h2>

            <Accordion type="single" collapsible className="w-full pb-5">
              {criteria.length > 0 ? (
                criteria.map((criteriaItem) => (
                  <AccordionItem
                    key={criteriaItem._id}
                    value={criteriaItem._id}
                    className="border dark:border-slate-300 rounded-md mb-4"
                  >
                    <AccordionTrigger
                      className="px-4 py-4 hover:no-underline"
                      onClick={() => {
                        // Auto-activate scoring when accordion is opened
                        if (activeCriteriaId !== criteriaItem._id) {
                          handleStartScoring(
                            criteriaItem._id,
                            criteriaItem.criteria.pass_fail
                              ? "pass_fail"
                              : "weight"
                          );
                        } else {
                          // If clicking on the same accordion that's already open, close it
                          handleAccordionClose();
                        }
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-gray-900 dark:text-slate-200">
                          {criteriaItem.title}
                        </span>
                        {criteriaItem.scoring && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 border-green-200 ml-2"
                          >
                            Scored
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pt-0">
                      <div className="border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
                          <div className="p-4 md:border-r border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                              Requested Doc.
                            </h4>
                            {criteriaItem.uploads.length > 0 ? (
                              criteriaItem.uploads.map((upload, index) => (
                                <p
                                  key={index}
                                  className="text-sm text-blue-600 hover:underline cursor-pointer dark:text-slate-200"
                                >
                                  {upload.title || `Document ${index + 1}`}
                                </p>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-slate-200">
                                No documents
                              </p>
                            )}
                          </div>

                          <div className="p-4 md:col-span-2 md:border-r border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-4 dark:text-slate-200">
                              Scoring
                            </h4>

                            {activeCriteriaId === criteriaItem._id && (
                              <form onSubmit={handleSubmit(onSubmitScore)}>
                                {watch("type") === "pass_fail" ? (
                                  <div className="flex items-center">
                                    <RadioGroup
                                      value={watch("score") as string}
                                      onValueChange={(value) => {
                                        const readOnly =
                                          (isEvaluationSubmitted || !!criteriaItem.scoring?._id) &&
                                          editingCriteriaId !== criteriaItem._id;
                                        if (!readOnly) setValue("score", value);
                                      }}
                                      className="flex gap-6"
                                    >
                                      <div className="flex items-center gap-2">
                                        <RadioGroupItem
                                          value="pass"
                                          id={`${criteriaItem._id}-pass`}
                                          disabled={
                                            (isEvaluationSubmitted || !!criteriaItem.scoring?._id) &&
                                            editingCriteriaId !== criteriaItem._id
                                          }
                                        />
                                        <Label
                                          htmlFor={`${criteriaItem._id}-pass`}
                                          className="text-sm"
                                        >
                                          Pass
                                        </Label>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <RadioGroupItem
                                          value="fail"
                                          id={`${criteriaItem._id}-fail`}
                                          disabled={
                                            (isEvaluationSubmitted || !!criteriaItem.scoring?._id) &&
                                            editingCriteriaId !== criteriaItem._id
                                          }
                                        />
                                        <Label
                                          htmlFor={`${criteriaItem._id}-fail`}
                                          className="text-sm"
                                        >
                                          Fail
                                        </Label>
                                      </div>
                                    </RadioGroup>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex flex-col">
                                      <div className="flex items-center justify-end mb-2">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <InfoIcon className="w-4 h-4 text-gray-500 cursor-pointer" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <div className="space-y-1">
                                                <div className="font-medium">Scoring Legend</div>
                                                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                                  <div key={n} className="text-xs text-gray-600 dark:text-gray-300">
                                                    {n} = {n * 10}% of the weight
                                                  </div>
                                                ))}
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>

                                      <RadioGroup
                                        value={watch("score")?.toString()}
                                        onValueChange={(value) => {
                                          const readOnly =
                                            (isEvaluationSubmitted || !!criteriaItem.scoring?._id) &&
                                            editingCriteriaId !== criteriaItem._id;
                                          if (!readOnly) setValue("score", parseInt(value));
                                        }}
                                        className="flex gap-8 justify-center mb-1"
                                      >
                                        {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                                          <div
                                            key={score}
                                            className="flex flex-col items-center gap-1"
                                          >
                                            <RadioGroupItem
                                              value={score.toString()}
                                              id={`${criteriaItem._id}-${score}`}
                                              disabled={
                                                (isEvaluationSubmitted || !!criteriaItem.scoring?._id) &&
                                                editingCriteriaId !== criteriaItem._id
                                              }
                                            />
                                            <Label
                                              htmlFor={`${criteriaItem._id}-${score}`}
                                              className="text-sm dark:text-slate-200"
                                            >
                                              {score}
                                            </Label>
                                          </div>
                                        ))}
                                      </RadioGroup>
                                      <div className="flex justify-between px-4 mt-1">
                                        <span className="text-xs text-gray-500 dark:text-slate-200">Low</span>
                                        <span className="text-xs text-gray-500 dark:text-slate-200">High</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </form>
                            )}
                          </div>

                          <div className="p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 dark:text-slate-200">
                              Scoring Type
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-slate-200 ">
                              {criteriaItem.criteria.pass_fail
                                ? "Pass/Fail"
                                : "Weight"}
                            </p>
                            {criteriaItem.criteria.weight && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500 dark:text-slate-200">
                                  {Number(criteriaItem.criteria.weight).toFixed(0)}%
                                </span>
                              </div>
                            )}

                            {/* Display current score if exists */}
                            {criteriaItem.scoring && (
                              <div className="mt-3 p-2 bg-blue-50 dark:bg-slate-800 rounded-md">
                                <h5 className="text-xs font-medium text-blue-700 mb-1 dark:text-slate-200">
                                  Current Score
                                </h5>
                                <p className="text-sm text-blue-600 dark:text-slate-200">
                                  {criteriaItem.criteria.pass_fail
                                    ? criteriaItem.scoring.scoring.pass_fail
                                    : criteriaItem.scoring.scoring.weight}
                                </p>
                                {submittedCriteriaTimestamps[criteriaItem._id] && (
                                  <p className="text-xs text-gray-600 mt-1 dark:text-gray-300">
                                    Submitted at: {new Date(submittedCriteriaTimestamps[criteriaItem._id]).toLocaleString()}
                                  </p>
                                )}
                                {revisedCriteriaTimestamps[criteriaItem._id] && (
                                  <p className="text-xs text-green-600 mt-1 dark:text-green-300">
                                    Revised at: {new Date(revisedCriteriaTimestamps[criteriaItem._id]).toLocaleString()}
                                  </p>
                                )}
                                {criteriaItem.scoring.comment && (
                                  <p
                                    className="text-xs text-blue-500 mt-1 truncate dark:text-slate-200"
                                    title={criteriaItem.scoring.comment}
                                  >
                                    Comment: "{criteriaItem.scoring.comment}"
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <Separator className="my-0" />

                        <div className="p-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 dark:text-slate-200">
                            Description
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-slate-200">
                            {criteriaItem.description}
                          </p>
                        </div>

                        {activeCriteriaId === criteriaItem._id && (
                          <>
                            <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200">
                              <h4 className="text-sm font-medium text-gray-700 mb-2 dark:text-slate-200">
                                Comments (Required)
                              </h4>
                              <Textarea
                                value={(watch("comment") as string) || ""}
                                onChange={(e) =>
                                  setValue("comment", e.target.value)
                                }
                                disabled={
                                  (isEvaluationSubmitted || !!criteriaItem.scoring?._id) &&
                                  editingCriteriaId !== criteriaItem._id
                                }
                                className="w-full dark:text-slate-200"
                                rows={3}
                                placeholder="Enter your comments here..."
                              />
                            </div>

                            {!isEvaluationSubmitted ? (
                              !criteriaItem.scoring?._id ? (
                                <div className="p-4 flex justify-end gap-2 border-t border-gray-200">
                                  <Button
                                    variant="outline"
                                    className="px-4"
                                    onClick={() => {
                                      handleAccordionClose();
                                      reset();
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    className="text-white px-4"
                                    onClick={handleSubmit(onSubmitScore)}
                                    disabled={submitScoreMutation.isPending}
                                  >
                                    {submitScoreMutation.isPending
                                      ? "Saving..."
                                      : "Save Score"}
                                  </Button>
                                </div>
                              ) : (
                                editingCriteriaId === criteriaItem._id ? (
                                  <div className="p-4 flex justify-end gap-2 border-t border-gray-200">
                                    <Button
                                      variant="outline"
                                      className="px-4"
                                      onClick={() => {
                                        setEditingCriteriaId(null);
                                        const type = criteriaItem.criteria.pass_fail ? "pass_fail" : "weight";
                                        handleStartScoring(criteriaItem._id, type);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      className="text-white px-4"
                                      onClick={handleSubmit(onSubmitScore)}
                                      disabled={submitScoreMutation.isPending}
                                    >
                                      {submitScoreMutation.isPending
                                        ? "Updating..."
                                        : "Update Score"}
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="p-4 flex justify-end gap-2 border-t border-gray-200">
                                    <Button
                                      variant="outline"
                                      className="px-4"
                                      onClick={() => {
                                        setEditingCriteriaId(criteriaItem._id);
                                        const type = criteriaItem.criteria.pass_fail ? "pass_fail" : "weight";
                                        const existingScoring = criteriaItem.scoring;
                                        if (existingScoring) {
                                          const scoreValue =
                                            type === "pass_fail"
                                              ? existingScoring.scoring.pass_fail
                                              : typeof existingScoring.scoring.weight === "number" && existingScoring.scoring.weight > 0
                                                ? existingScoring.scoring.weight / 10
                                                : "";
                                          reset({
                                            comment: existingScoring.comment || "",
                                            score: scoreValue,
                                            type: type as "pass_fail" | "weight",
                                          });
                                        }
                                      }}
                                    >
                                      Edit Score
                                    </Button>
                                  </div>
                                )
                              )
                            ) : (
                              isEvaluationCompleted && editingCriteriaId === criteriaItem._id ? (
                                <div className="p-4 flex justify-end gap-2 border-t border-gray-200">
                                  <Button
                                    variant="outline"
                                    className="px-4"
                                    onClick={() => {
                                      setEditingCriteriaId(null);
                                      const type = criteriaItem.criteria.pass_fail ? "pass_fail" : "weight";
                                      handleStartScoring(criteriaItem._id, type);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    className="text-white px-4"
                                    onClick={handleSubmit(onSubmitScore)}
                                    disabled={revisitScoreMutation.isPending}
                                  >
                                    {revisitScoreMutation.isPending ? "Resubmitting..." : "Revise Score"}
                                  </Button>
                                </div>
                              ) : isEvaluationCompleted ? (
                                <div className="p-4 flex justify-end gap-2 border-t border-gray-200">
                                  <Button
                                    variant="outline"
                                    className="px-4"
                                    onClick={() => {
                                      setEditingCriteriaId(criteriaItem._id);
                                      const type = criteriaItem.criteria.pass_fail ? "pass_fail" : "weight";
                                      const existingScoring = criteriaItem.scoring;
                                      if (existingScoring) {
                                        const scoreValue =
                                          type === "pass_fail"
                                            ? existingScoring.scoring.pass_fail
                                            : typeof existingScoring.scoring.weight === "number" && existingScoring.scoring.weight > 0
                                              ? existingScoring.scoring.weight / 10
                                              : "";
                                        reset({
                                          comment: existingScoring.comment || "",
                                          score: scoreValue,
                                          type: type as "pass_fail" | "weight",
                                        });
                                      }
                                    }}
                                  >
                                    Revise Score
                                  </Button>
                                </div>
                              ) : null
                            )}
                          </>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-slate-300">
                    No criteria available
                  </p>
                </div>
              )}
            </Accordion>

            {criteriaData?.data.data.submissionStatus === "In Progress" && (
              <div className="mt-8 flex justify-end gap-2">
                <Button variant="outline" className="px-4" onClick={handleBack}>
                  Back to Evaluation
                </Button>
                {/* <Button variant="outline" className="px-4" onClick={handleBack}>
                Reset All
              </Button> */}
                <Button
                  className="text-white px-4"
                  onClick={() => setShowSubmitDialog(true)}
                >
                  Submit Evaluation
                </Button>

                <ConfirmAlert
                  open={showSubmitDialog}
                  onClose={(open) => setShowSubmitDialog(open)}
                  title="Submit Evaluation"
                  text="Are you sure you want to submit this evaluation? This action cannot be undone."
                  type="info"
                  primaryButtonText="Submit"
                  secondaryButtonText="Cancel"
                  onPrimaryAction={() => {
                    submitEvaluationMutation.mutate();
                  }}
                  onSecondaryAction={() => setShowSubmitDialog(false)}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pricing-breakdown" className="mt-0">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Pricing Breakdown
            </h2>

            {pricingLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500 dark:text-gray-400">
                  Loading pricing breakdown...
                </div>
              </div>
            ) : pricingError ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-red-500">
                  Error loading pricing breakdown: {pricingError.message}
                </div>
              </div>
            ) : flattenedPricingItems.length > 0 ? (
              <div className="space-y-4">
                {/* Pricing Table */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Component
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {flattenedPricingItems.map((item, index) => (
                          <tr key={index} className={item.level > 0 ? "bg-gray-50 dark:bg-gray-800 " : ""}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 max-w-md">
                              <span style={{ paddingLeft: `${item.level * 20}px` }}>
                                {item.itemNumber}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 max-w-md">
                              <span className="text-wrap" style={{ paddingLeft: `${item.level * 20}px` }}>
                                {item.component}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-md">
                              {item.description || "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 max-w-md">
                              {item.quantity.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 max-w-md">
                              {item.unitOfMeasurement}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 max-w-md">
                              ${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium max-w-md">
                              ${item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total Amount */}
                <div className="flex justify-end">
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Total Amount:
                      </span>
                      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No pricing breakdown available
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

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
          fileType={selectedDocument.type}
        />
      )}
    </div>
  );
};

export default SubmittedDocumentPage;

const Document = ({
  document,
  onViewDocument,
}: {
  document: VendorDocument;
  onViewDocument: (document: VendorDocument) => void;
}) => {
  // Get file icon based on type
  const getFileIcon = (type: string) => {
    const fileType = type;
    switch (fileType) {
      case "DOC":
      case "DOCX":
        return <DocSVG className="w-10 h-10" />;
      case "PDF":
        return <PdfSVG className="w-10 h-10" />;
      case "XLS":
      case "XLSX":
        return <ExcelSVG className="w-10 h-10" />;
      case "ZIP":
        return <ZipSVG className="w-10 h-10" />;
      default:
        return <FileText className="w-10 h-10" />;
    }
  };

  return (
    <Card className="border hover:shadow-md transition-shadow bg-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10">{getFileIcon(document.type)}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {document.name.length > 40 ? document.name.substring(0, 40) + '...' : document.name}
              </h4>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{document.type}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{document.size}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 bg-gray-100 rounded-full hover:bg-gray-200"
              title="View"
              onClick={() => onViewDocument(document)}
            >
              <Eye className="w-4 h-4 text-gray-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 bg-blue-100 rounded-full hover:bg-blue-200"
              title="Download"
              onClick={() => {
                const link = window.document.createElement("a");
                link.href = document.url;
                link.download = document.name;
                link.click();
              }}
            >
              <Download className="w-4 h-4 text-blue-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
