import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Forge, useForge } from "@/lib/forge";
import * as yup from "yup";
import { cn } from "@/lib/utils";
import Step1Form from "./Step1Form";
import Step2Form from "./Step2Form";
import Step3Form from "./Step3Form";
import Step4Form from "./Step4Form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import timezones from "@/assets/timezones.json";
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

export type CreateEvaluationFormData = Step1FormData &
  Step2FormData &
  Step3FormData &
  Step4FormData;

// API Types
type EvaluationDraft = {
  id: string;
  title: string;
  solicitation: string;
  timezone: string;
  start_date: string;
  end_date: string;
  group: Array<{
    name: string;
    evaluators: string[];
  }>;
  documents: Array<{
    title: string;
    type: string;
    group: string;
    required: boolean;
    multiple: boolean;
  }>;
  criteria: Array<{
    title: string;
    description: string;
    type: "pass_fail" | "weight";
    score: string | number;
    group: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

type CreateEvaluationDraftPayload = {
  solicitation: string;
  timezone: string;
  start_date: string;
  end_date: string;
  group: Array<{
    name: string;
    evaluators: string[];
  }>;
  documents: Array<{
    title: string;
    type: string;
    group: string;
    required: boolean;
    multiple: boolean;
  }>;
  criteria: Array<{
    title: string;
    description: string;
    type: "pass_fail" | "weight";
    score: string | number;
    group: string;
  }>;
};

const CreateEvaluationDialog = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  // API Hooks
  const { data: drafts } = useQuery<
    ApiResponse<EvaluationDraft[]>,
    ApiResponseError
  >({
    queryKey: ["getEvaluationDrafts"],
    queryFn: async () =>
      await getRequest({ url: "/procurement/evaluations/drafts" }),
    enabled: open, // Only fetch when dialog is open
  });

  // Fetch available solicitations
  const { data: solicitationsData } = useQuery<
    ApiResponse<
      {
        _id: string;
        name: string;
        submissionDeadline: string;
        questionDeadline: string;
        bidIntentDeadline: string;
        status: string
      }[]
    >,
    ApiResponseError
  >({
    queryKey: ["getSolicitations"],
    queryFn: async () =>
      await getRequest({ url: "/procurement/evaluations/solicitations" }),
    enabled: open, // Only fetch when dialog is open
  });

  const { mutateAsync: saveDraft, isPending: isSavingDraft } = useMutation<
    ApiResponse<EvaluationDraft>,
    ApiResponseError,
    CreateEvaluationDraftPayload
  >({
    mutationKey: ["createEvaluationDraft"],
    mutationFn: async (draftData) =>
      await postRequest({
        url: "/procurement/evaluations/drafts",
        payload: draftData,
      }),
  });

  const { mutateAsync: createEvaluation, isPending: isCreatingEvaluation } =
    useMutation<
      ApiResponse<any>,
      ApiResponseError,
      Omit<CreateEvaluationFormData, "group"> & {
        group: { name: string; evaluators: string[] }[];
      }
    >({
      mutationKey: ["createEvaluation"],
      mutationFn: async (evaluationData) =>
        await postRequest({
          url: "/procurement/evaluations",
          payload: evaluationData,
        }),
    });

  // Transform solicitations data for dropdown options
  const solicitationOptions =
    solicitationsData?.data?.data?.map((solicitation) => ({
      label: solicitation.name,
      value: solicitation._id,
    })) || [];

  // Single form instance for all steps
  const forge = useForge<CreateEvaluationFormData>({
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

  // Update forge state when drafts are fetched
  useEffect(() => {
    if (drafts?.data && drafts.data.data.length > 0) {
      // Use the first draft as default (you can modify this logic as needed)
      const firstDraft = drafts.data.data[0];

      // Update form values with draft data
      forge.setValue("solicitation", firstDraft.solicitation);
      forge.setValue("timezone", firstDraft.timezone);
      forge.setValue("start_date", firstDraft.start_date);
      forge.setValue("end_date", firstDraft.end_date);
      forge.setValue(
        "group",
        firstDraft.group.map((group) => ({
          name: group.name,
          evaluators: group.evaluators.map((evaluator) => ({
            label: evaluator,
            value: evaluator,
          })),
        }))
      );
      forge.setValue("documents", firstDraft.documents || []);
      forge.setValue(
        "criteria",
        firstDraft.criteria.map((criteria) => ({
          ...criteria,
        }))
      );
    }
  }, [drafts]);

  const onSubmit = async (data: CreateEvaluationFormData) => {
    try {
      const payload: Omit<CreateEvaluationFormData, "group"> & {
        group: { name: string; evaluators: string[] }[];
      } = {
        ...data,
        start_date: format(data.start_date, "yyyy-MM-dd'T'HH:mm:ss") || "",
        end_date: format(data.end_date, "yyyy-MM-dd'T'HH:mm:ss") || "",
        group:
          data.group?.map((item) => ({
            name: item.name,
            evaluators:
              item.evaluators
                ?.filter((evaluator) => evaluator !== undefined)
                .map((item) => item.value) ?? [],
          })) ?? [],
        criteria:
          data.criteria?.map((criteria) => ({
            ...criteria,
            score:
              criteria.type === "weight"
                ? parseInt(criteria.score as string)
                : String(criteria.score),
          })) || [],
      }

      await createEvaluation(payload);

      // Invalidate and refetch evaluations list
      await queryClient.invalidateQueries({
        queryKey: ["getEvaluations"]
      });
      
      // Also invalidate drafts in case they need to be updated
      await queryClient.invalidateQueries({
        queryKey: ["getEvaluationDrafts"]
      });
      await queryClient.invalidateQueries({
        queryKey: ["evaluations-list"]
      });
      await queryClient.invalidateQueries({
        queryKey: ["assigned-evaluations-list"]
      });
      await queryClient.invalidateQueries({
        queryKey: ["my-evaluations-list"]
      });

      toast.success(
        "Evaluation Created",
        "Evaluation has been created successfully"
      );
      setOpen(false);
      setCurrentStep(1);
      forge.reset();
    } catch (error) {
      console.error("Error creating evaluation:", error);
      const err = error as ApiResponseError;
      toast.error(
        "Creation Failed",
        err?.response?.data?.message ?? "Failed to create evaluation"
      );
    }
  };
  const timezoneOptions = timezones;

  const handleSaveAsDraft = async () => {
    try {
      const formData = forge.getValues();
      const draftData: Partial<CreateEvaluationDraftPayload> = {};
      // console.log({ formData })

      // Only include fields with actual values
      if (formData.solicitation && typeof formData.solicitation === 'string' && formData.solicitation.trim()) {
        draftData.solicitation = formData.solicitation;
      }
      
      if (formData.timezone && typeof formData.timezone === 'string' && formData.timezone.trim()) {
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
            ...document,
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
            ...criteria,
            score:
              criteria.type === "weight"
                ? parseInt(criteria.score as string)
                : String(criteria.score),
          }));
        
        if (validCriteria.length > 0) {
          draftData.criteria = validCriteria;
        }
      }

      await saveDraft(draftData as CreateEvaluationDraftPayload);
      // Immediately refetch evaluation lists and drafts after successful save
      await queryClient.refetchQueries({ queryKey: ["getEvaluations"], type: "active" });
      await queryClient.refetchQueries({ queryKey: ["evaluations-list"], type: "active" });
      await queryClient.refetchQueries({ queryKey: ["assigned-evaluations-list"], type: "active" });
      await queryClient.refetchQueries({ queryKey: ["my-evaluations-list"], type: "active" });
      await queryClient.refetchQueries({ queryKey: ["getEvaluationDrafts"], type: "active" });
      toast.success(
        "Draft Saved",
        "Evaluation draft has been saved successfully"
      );
      setOpen(false);
      setCurrentStep(1);
      forge.reset();
    } catch (error) {
      console.error("Error saving draft:", error);
      const err = error as ApiResponseError;
      toast.error(
        "Save Failed",
        err?.response?.data?.message ?? "Failed to save draft"
      );
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // const handleCancel = () => {
  //   setOpen(false);
  //   setCurrentStep(1);
  //   forge.reset();
  // };

  // Validate the current step before proceeding to the next
  const validateCurrentStep = async () => {
    try {
      const currentValues = forge.getValues();

      switch (currentStep) {
        case 1:
          await step1Schema.validate(
            {
              solicitation: currentValues.solicitation,
              timezone: currentValues.timezone,
              start_date: currentValues.start_date,
              end_date: currentValues.end_date,
            },
            { abortEarly: false }
          );
          break;
        case 2:
          await step2Schema.validate(
            { group: currentValues.group },
            { abortEarly: false }
          );
          break;
        case 3:
          await step3Schema.validate(
            { documents: currentValues.documents },
            { abortEarly: false }
          );
          break;
        case 4:
          await step4Schema.validate(
            { criteria: currentValues.criteria },
            { abortEarly: false }
          );
          break;
        default:
          return true;
      }
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        // Set form errors
        error.inner.forEach((err) => {
          forge.setError(err.path as any, {
            type: "validation",
            message: err.message,
          });
        });

        toast.error(
          "Validation Error",
          "Please fix the errors before proceeding"
        );
      }
      return false;
    }
  };

  // Handle next step with validation
  const handleNextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
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
        <Button className="bg-[#2A4467] hover:bg-[#1e3147] text-white px-6 py-2 rounded-lg flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Evaluation
        </Button>
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
              Create Evaluation
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">{getStepTitle()}</p>
          </div>
        </div>

        {/* Form Content */}
        <Forge control={forge.control} onSubmit={onSubmit} >
          {currentStep === 1 && (
            <Step1Form
              solicitationOptions={solicitationOptions}
              timezoneOptions={timezoneOptions}
              solicitationsData={solicitationsData?.data?.data}
            />
          )}

          {currentStep === 2 && <Step2Form control={forge.control} />}

          {currentStep === 3 && <Step3Form control={forge.control} />}

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
                onClick={handleSaveAsDraft}
                disabled={isSavingDraft}
                size={"lg"}
                className="px-8 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {isSavingDraft ? "Saving..." : "Save as Draft"}
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
                onClick={currentStep === 4 ? undefined : handleNextStep}
                disabled={currentStep === 4 && isCreatingEvaluation}
                className="px-8 py-2 bg-[#2A4467] hover:bg-[#1e3147] text-white rounded-lg"
              >
                {currentStep === 4
                  ? isCreatingEvaluation
                    ? "Creating..."
                    : "Create Evaluation"
                  : "Continue"}
              </Button>
            </div>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEvaluationDialog;
