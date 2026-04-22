import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Forge, useForge } from "@/lib/forge";
import * as yup from "yup";
import { cn } from "@/lib/utils";
import Step1Form from "./Step1Form";
import Step2Form from "./Step2Form";
import Step3Form from "./Step3Form";
import Step4Form from "./Step4Form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, putRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import timezones from "@/assets/timezones.json";
import { useEvaluationDetail } from "../hooks/useEvaluationDetailApi";
import { PageLoader } from "@/components/ui/PageLoader";
import { format } from "date-fns";

// Form validation schemas for each step
const step1Schema = yup.object({
  solicitation: yup.string().required("Solicitation is required"),
  timezone: yup.string().required("Timezone is required"),
  start_date: yup.string().required("Evaluation start date is required"),
  end_date: yup.string().required("Evaluation end date is required"),
});

const step2Schema = yup.object({
  group: yup
    .array()
    .of(
      yup.object({
        id: yup.string().optional(),
        name: yup.string().required("Group name is required"),
        evaluators: yup
          .array()
          .of(
            yup.object({
              label: yup.string().required("Label is required"),
              value: yup.string().required("Value is required"),
            })
          )
          .min(1, "At least one evaluator is required"),
      })
    )
    .min(1, "At least one evaluation group is required"),
});

const step3Schema = yup.object({
  documents: yup
    .array()
    .of(
      yup.object({
        id: yup.string().optional(),
        title: yup.string().required("Document title is required"),
        type: yup.string().required("Document type is required"),
        group: yup.string().required("Evaluation group is required"),
        required: yup.boolean(),
        multiple: yup.boolean(),
      })
    )
    .min(1, "At least one requested document is required"),
});

const step4Schema = yup.object({
  criteria: yup
    .array()
    .of(
      yup.object({
        id: yup.string().optional(),
        title: yup.string().required("Criteria title is required"),
        description: yup.string().required("Description is required"),
        type: yup
          .string()
          .oneOf(
            ["pass_fail", "weight"] as const,
            "Type must be either pass_fail or weight"
          )
          .required("Type selection is required"),
        score: yup.mixed().required("Score is required"),
        group: yup.string().required("Evaluation group is required"),
      })
    )
    .min(1, "At least one evaluation criteria is required"),
});

type Step1FormData = yup.InferType<typeof step1Schema>;
type Step2FormData = yup.InferType<typeof step2Schema>;
type Step3FormData = yup.InferType<typeof step3Schema>;
type Step4FormData = yup.InferType<typeof step4Schema>;

export type EditEvaluationFormData = Step1FormData &
  Step2FormData &
  Step3FormData &
  Step4FormData;

// API Types
type UpdateEvaluationPayload = {
  id: string; // Required field according to API docs
  timezone?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
  status: "published" | "draft";
  group?: Array<{
    name: string;
    evaluators: string[];
  }>;
  documents?: Array<{
    title: string;
    type: string;
    group: string;
    required: boolean;
  }>;
  criteria?: Array<{
    title: string;
    description: string;
    type: "pass_fail" | "weight";
    score: string | number;
    group: string;
  }>;
};

type UpdateEvaluationDraftPayload = {
  id: string;
  solicitation?: string;
  timezone?: string;
  start_date?: string;
  end_date?: string;
  group?: Array<{
    name: string;
    evaluators: string[];
  }>;
  documents?: Array<{
    title: string;
    type: string;
    group: string;
    required: boolean;
    multiple?: boolean;
  }>;
  criteria?: Array<{
    title: string;
    description: string;
    type: "pass_fail" | "weight";
    score: string | number;
    group: string;
  }>;
};

interface EditEvaluationDialogProps {
  evaluationId: string;
  children?: React.ReactNode;
  page: "overview" | "groups" | "documents" | "criteria";
}

const EditEvaluationDialog = ({
  evaluationId,
  children,
  page,
}: EditEvaluationDialogProps) => {
  const toast = useToastHandler();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(() => {
    switch (page) {
      case "overview":
        return 1;
      case "groups":
        return 2;
      case "documents":
        return 3;
      case "criteria":
        return 4;
      default:
        return 1;
    }
  });

  // Fetch current evaluation data
  const {
    data: evaluationData,
    isLoading: isLoadingEvaluation,
    isSuccess,
  } = useEvaluationDetail(evaluationId);

  // Fetch available solicitations
  const { data: solicitationsData } = useQuery<
    ApiResponse<{ _id: string; name: string }[]>,
    ApiResponseError
  >({
    queryKey: ["getSolicitations"],
    queryFn: async () =>
      await getRequest({ url: "/procurement/evaluations/solicitations" }),
    enabled: open, // Only fetch when dialog is open
  });

  const { mutateAsync: updateEvaluation, isPending: isUpdatingEvaluation } =
    useMutation<ApiResponse<any>, ApiResponseError, UpdateEvaluationPayload>({
      mutationKey: ["updateEvaluation", evaluationId],
      mutationFn: async (evaluationData) =>
        await putRequest({
          url: `/procurement/evaluations`,
          payload: { ...evaluationData, id: evaluationId },
        }),
      onSuccess: () => {
        // Invalidate and refetch evaluation data
        queryClient.invalidateQueries({
          queryKey: ["evaluation-detail", evaluationId],
        });
        queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      },
    });

  const { mutateAsync: saveToDraft, isPending: isSavingToDraft } = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    UpdateEvaluationDraftPayload
  >({
    mutationKey: ["saveEvaluationToDraft", evaluationId],
    mutationFn: async (draftData) =>
      await putRequest({
        url: `/procurement/evaluations`,
        payload: { ...draftData, id: evaluationId, status: "draft" },
      }),
    onSuccess: () => {
      // Invalidate and refetch evaluation data
      queryClient.invalidateQueries({
        queryKey: ["evaluation-detail", evaluationId],
      });
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });

  // Transform solicitations data for dropdown options
  const solicitationOptions =
    solicitationsData?.data?.data?.map((solicitation) => ({
      label: solicitation.name,
      value: solicitation._id,
    })) || [];

  // Single form instance for all steps
  const forge = useForge<EditEvaluationFormData>({
    defaultValues: {
      solicitation: "",
      timezone: "",
      start_date: "",
      end_date: "",
      group: [{ name: "", evaluators: [] }],
      documents: [
        { title: "", type: "", group: "", required: false, multiple: false },
      ],
      criteria: [
        {
          title: "",
          description: "",
          type: "pass_fail",
          score: 0,
          group: "",
        },
      ],
    },
  });

  // Update form values when evaluation data is loaded
  useEffect(() => {
    if (isSuccess) {
      const payload: EditEvaluationFormData = {
        solicitation: evaluationData?.data?.data?.solicitation?._id || "",
        timezone: evaluationData?.data?.data?.timezone || "",
        start_date: evaluationData?.data?.data?.startDate || "",
        end_date: evaluationData?.data?.data?.endDate || "",
        group: [],
        documents: [],
      };
      // Set basic evaluation info

      // Set groups data
      if (evaluationData?.data?.data?.evaluators?.length > 0) {
        const groups = evaluationData?.data?.data?.evaluators.map(
          (group: any) => ({
            id: group.groupId,
            name: group.groupName,
            evaluators:
              group.evaluators?.map((evaluator: any) => ({
                label: evaluator.name,
                value: evaluator._id,
              })) || [],
          })
        );

        payload.group = groups;
      }

      // Set documents data
      if (evaluationData?.data?.data?.requiredDocuments?.length > 0) {
        const documents = evaluationData.data.data.requiredDocuments.map(
          (doc: any) => ({
            id: doc._id,
            title: doc.title || "",
            type: doc?.type || "DOC", // default type
            group: doc.groupName || "",
            required: true, // required documents are always required
            multiple: false, // default value
          })
        );

        payload.documents = documents;
      }

      // Set criteria data
      if (evaluationData?.data?.data?.criterias?.length > 0) {
        const criteria = evaluationData.data.data.criterias.map(
          (criterion: any) => ({
            id: criterion._id,
            title: criterion?.title || "",
            description: criterion?.description || "",
            type: criterion.criteria?.pass_fail ? "pass_fail" : "weight",
            score:
              criterion.criteria?.weight ||
              criterion.criteria?.pass_fail ||
              "pass",
            group: criterion.evaluationGroup || "",
          })
        );

        payload.criteria = criteria.map((criterion) => ({
          ...criterion,
          type: criterion.type as "pass_fail" | "weight",
        }));
      }

      forge.reset(payload);
    }
  }, [evaluationData, isSuccess]);

  const onSubmit = async (data: EditEvaluationFormData) => {
    try {
      const payload: UpdateEvaluationPayload = {
        id: evaluationId,
        timezone: data.timezone || undefined,
        start_date: data.start_date
          ?  format(data.start_date, "yyyy-MM-dd'T'HH:mm:ss")
          : undefined,
        end_date: data.end_date
          ? format(data.end_date, "yyyy-MM-dd'T'HH:mm:ss")
          : undefined,
        group:
          data.group?.map((item) =>
            item?.id
              ? {
                  id: item.id,
                  name: item.name,
                  evaluators:
                    item.evaluators
                      ?.filter((evaluator) => evaluator !== undefined)
                      .map((it) => it.value) ?? [],
                }
              : {
                  name: item.name,
                  evaluators:
                    item.evaluators
                      ?.filter((evaluator) => evaluator !== undefined)
                      .map((it) => it.value) ?? [],
                }
          ) ?? undefined,
        documents:
          data.documents?.map((doc) =>
            doc.id
              ? {
                  id: doc.id,
                  title: doc.title,
                  type: doc.type,
                  group: doc.group,
                  required: !!doc.required,
                }
              : {
                  title: doc.title,
                  type: doc.type,
                  group: doc.group,
                  required: !!doc.required,
                }
          ) || undefined,
        criteria:
          data.criteria?.map((c) => {
            const base = {
              id: c.id,
              title: c.title,
              description: c.description,
              type: c.type as "pass_fail" | "weight",
              group: c.group,
            } as const;
            if (c.type === "pass_fail") {
              return {
                ...base,
                score:
                  c.score === "pass" || c.score === "fail" ? c.score : "pass",
              };
            }
            const num =
              typeof c.score === "number"
                ? c.score
                : parseFloat(String(c.score));
            return { ...base, score: isNaN(num) ? 0 : num };
          }) || undefined,
        status: "published",
      };

      await updateEvaluation({
        ...payload,
      });
      toast.success(
        "Evaluation Updated",
        "Evaluation has been updated successfully"
      );
      setOpen(false);
      setCurrentStep(1);
    } catch (error) {
      console.error("Error updating evaluation:", error);
      const err = error as ApiResponseError;
      toast.error(
        "Update Failed",
        err?.response?.data?.message ?? "Failed to update evaluation"
      );
    }
  };

  const timezoneOptions = timezones;

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveToDraft = async () => {
    try {
      const formData = forge.getValues();
      const draftData: Partial<UpdateEvaluationDraftPayload> = {
        id: evaluationId,
      };

      // Only include fields with actual values
      if (
        formData.solicitation &&
        typeof formData.solicitation === "string" &&
        formData.solicitation.trim()
      ) {
        // draftData.solicitation = formData.solicitation;
      }

      if (
        formData.timezone &&
        typeof formData.timezone === "string" &&
        formData.timezone.trim()
      ) {
        draftData.timezone = formData.timezone;
      }

      if (formData.start_date) {
        draftData.start_date = formData.start_date;
      }

      if (formData.end_date) {
        draftData.end_date = formData.end_date;
      }

      if (formData.group && formData.group.length > 0) {
        const validGroups = formData.group
          .filter((group) => group.name && group.name.trim())
          .map((group) => ({
            name: group.name,
            evaluators:
              group.evaluators
                ?.filter((evaluator) => evaluator !== undefined)
                .map((item) => item.value)
                .filter((value) => value && value.trim()) || [],
          }))
          .filter((group) => group.evaluators.length > 0);

        if (validGroups.length > 0) {
          draftData.group = validGroups;
        }
      }

      if (formData.documents && formData.documents.length > 0) {
        const validDocuments = formData.documents
          .filter((document) => document.title && document.title.trim())
          .map((document) => ({
            title: document.title,
            type: document.type,
            group: document.group,
            required: document.required ?? false,
            multiple: document.multiple ?? false,
          }));

        if (validDocuments.length > 0) {
          draftData.documents = validDocuments;
        }
      }

      if (formData.criteria && formData.criteria.length > 0) {
        const validCriteria = formData.criteria
          .filter((criteria) => criteria.title && criteria.title.trim())
          .map((criteria) => ({
            title: criteria.title,
            description: criteria.description,
            type: criteria.type as "pass_fail" | "weight",
            score:
              criteria.type === "weight"
                ? parseInt(criteria.score as string)
                : String(criteria.score),
            group: criteria.group,
          }));

        if (validCriteria.length > 0) {
          draftData.criteria = validCriteria;
        }
      }

      await saveToDraft(draftData as UpdateEvaluationDraftPayload);
      toast.success(
        "Draft Saved",
        "Evaluation has been saved as draft successfully"
      );
      setOpen(false);
      setCurrentStep(1);
    } catch (error) {
      console.error("Error saving draft:", error);
      const err = error as ApiResponseError;
      toast.error(
        "Save Failed",
        err?.response?.data?.message ?? "Failed to save evaluation as draft"
      );
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Step 1 of 4: Evaluation Setup";
      case 2:
        return "Step 2 of 4: Evaluation Groups";
      case 3:
        return "Step 3 of 4: Requested Documents";
      case 4:
        return "Step 4 of 4: Evaluation Criteria";
      default:
        return "Step 1 of 4: Evaluation Setup";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-[#2A4467] hover:bg-[#1e3147] text-white px-6 py-2 rounded-lg flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Evaluation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={cn("max-h-[90vh] overflow-y-auto p-0", {
          "max-w-5xl": [2, 3, 4].includes(currentStep),
        })}
      >
        {/* Custom Header with Close Button */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-200">
              Edit Evaluation
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">{getStepTitle()}</p>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingEvaluation ? (
          <PageLoader
            showHeader={false}
            message="Loading evaluation data..."
            className="p-8"
          />
        ) : (
          /* Form Content */
          <Forge control={forge.control} onSubmit={onSubmit}>
            {currentStep === 1 && (
              <Step1Form
                isEdit
                solicitationOptions={solicitationOptions}
                timezoneOptions={timezoneOptions}
              />
            )}

            {currentStep === 2 && <Step2Form control={forge.control} isEdit />}

            {currentStep === 3 && <Step3Form control={forge.control} isEdit />}

            {currentStep === 4 && <Step4Form control={forge.control} />}

            {/* Footer Buttons */}
            <div
              className={cn("flex items-center justify-end pt-6 px-6 py-6", {
                "justify-between": currentStep > 1,
              })}
            >
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveToDraft}
                  disabled={isSavingToDraft}
                  size={"lg"}
                  className="px-8 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  {isSavingToDraft ? "Saving..." : "Save to Draft"}
                </Button>
              )}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="px-8 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Back
                </Button>
                <Button
                  type={currentStep === 4 ? "submit" : "button"}
                  onClick={
                    currentStep === 4
                      ? undefined
                      : () => setCurrentStep((prev) => prev + 1)
                  }
                  disabled={currentStep === 4 && isUpdatingEvaluation}
                  className="px-8 py-2 bg-[#2A4467] hover:bg-[#1e3147] text-white rounded-lg"
                >
                  {currentStep === 4
                    ? isUpdatingEvaluation
                      ? "Updating..."
                      : evaluationData?.data?.data?.status === "draft"
                      ? "Publish"
                      : "Update Evaluation"
                    : "Continue"}
                </Button>
              </div>
            </div>
          </Forge>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditEvaluationDialog;
