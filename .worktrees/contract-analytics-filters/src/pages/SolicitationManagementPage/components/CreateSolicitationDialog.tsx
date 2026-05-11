import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Forge, useForge } from "@/lib/forge";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postRequest, getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { format } from "date-fns";
import Step1Form from "./Step1Form";
import Step2Form from "./Step2Form";
import Step3Form from "./Step3Form";
import Step4Form from "./Step4Form";
import Step5Form from "./Step5Form";
import Step6Form from "./Step6Form";
import { cn } from "@/lib/utils";
import { useClearSession } from "@/store/solicitationFileSlice";

// Form validation schemas for each step
const step1Schema = yup.object({
  solicitationName: yup.string().required("Solicitation name is required"),
  solId: yup.string().optional(),
  solicitationType: yup.string().required("Solicitation type is required"),
  estimatedCost: yup.string().optional(),
  category: yup.string().required("Category is required"),
  description: yup.string().required("Description is required"),
});

const step2Schema = yup.object({
  submissionDeadlineDate: yup
    .string()
    .required("Submission deadline date is required"),
  questionAcceptanceDeadlineDate: yup
    .string()
    .required("Question acceptance deadline date is required"),
  timezone: yup.string().required("Timezone is required"),
  bidIntent: yup.string().required("Bid intent is required"),
  bidIntentDeadlineDate: yup.string().when("bidIntent", {
    is: "required",
    then: (schema) =>
      schema.required(
        "Bid intent deadline date is required when bid intent is required"
      ),
    otherwise: (schema) => schema.optional(),
  }),
  visibility: yup.string().required("Visibility is required"),
});

const eventSchema = yup
  .object({
    event: yup.string().required("Event is required"),
    location: yup.string().required("Location is required"),
    date: yup.string().required("Date is required"),
    time: yup.string().required("Time is required"),
    note: yup.string().optional(),
  })
  .optional();

const step3Schema = yup.object({
  event: yup.array().of(eventSchema).optional(),
});

const documentSchema = yup.mixed().test({
  name: "isFileOrUploaded",
  message: "Document is required",
  test: (value) => {
    // Accept both File objects and UploadedFile objects
    return (
      value instanceof File ||
      (value && typeof value === "object" && "url" in value)
    );
  },
}); // Allow additional properties without validation

const vendorSchema = yup.object({
  value: yup.string().required("Vendor ID is required"),
  label: yup.string().optional(),
});

const step4Schema = yup.object({
  documents: yup.array().of(documentSchema).optional().nullable(),
});

const step5Schema = yup.object({
  vendor: yup.array().of(vendorSchema).optional(),
  message: yup.string().optional(),
});

type Step1FormData = yup.InferType<typeof step1Schema>;
type Step2FormData = yup.InferType<typeof step2Schema>;
type Step3FormData = yup.InferType<typeof step3Schema>;
type Step4FormData = yup.InferType<typeof step4Schema>;
type Step5FormData = yup.InferType<typeof step5Schema>;

export type CreateSolicitationFormData = Step1FormData &
  Step2FormData &
  Step3FormData &
  Step4FormData &
  Step5FormData & {
    files?: File[];
    vendors?: Array<{ id: string; status?: string }>;
  };

// Types for API request
type SolicitationCreateRequest = {
  solId?: string;
  name: string;
  typeId: string;
  categoryIds: string[];
  estimatedCost?: number;
  description: string;
  visibility?: "public" | "invite-only";
  status?: "draft" | "active" | "closed" | "awarded" | "evaluating";
  submissionDeadline: string;
  questionDeadline?: string;
  bidIntent?: "required" | "not-required";
  bidIntentDeadline?: string;
  timezone?: string;
  events?: Array<{
    eventType: string;
    eventLocation: string;
    eventDate: string;
    eventDescription?: string;
  }>;
  files?: Array<{
    name: string;
    url: string;
    size: string;
    type: string;
  }>;
  vendors?: Array<{
    id: string;
    status?: "invited" | "confirmed" | "declined";
  }>;
};

const CreateSolicitationDialog = () => {
  const toast = useToastHandler();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const clearSession = useClearSession();

  // Types for category API
  type VendorCategory = {
    _id?: string;
    name: string;
  };

  type SolicitationType = {
    _id: string;
    name: string;
  };

  // Fetch vendor categories
  const { data: categoriesData } = useQuery<
    ApiResponse<VendorCategory[]>,
    ApiResponseError
  >({
    queryKey: ["solicitationCategories"],
    queryFn: async () =>
      await getRequest({ url: "/procurement/solicitations/meta/categories" }),
  });

  // Fetch solicitation types
  const { data: typesData } = useQuery<
    ApiResponse<SolicitationType[]>,
    ApiResponseError
  >({
    queryKey: ["solicitationTypes"],
    queryFn: async () =>
      await getRequest({ url: "/procurement/solicitations/meta/types" }),
  });

  const solicitationTypes =
    typesData?.data.data?.map((type) => ({
      label: type.name,
      value: type._id,
    })) || [];

  const categoryOptions =
    categoriesData?.data.data?.map((category) => ({
      label: category.name,
      value: category._id || category.name,
    })) || [];

  const bidIntentOptions = [
    { label: "Required", value: "required" },
    { label: "Not Required", value: "not required" },
  ];

  const visibilityOptions = [
    { label: "Public", value: "public" },
    { label: "Invite-only", value: "invite-only" },
  ];

  const eventOptions = [
    { label: "Pre-bid Meeting", value: "pre-bid-meeting" },
    { label: "Technical Presentation", value: "technical-presentation" },
    { label: "Q&A Session", value: "qa-session" },
  ];

  // Single form instance for all steps
  const forge = useForge<CreateSolicitationFormData>({
    defaultValues: {
      // Step 3 fields
      event: [{ event: "", location: "", date: "", time: "", note: "" }],
      // Step 5 fields
      vendor: [],
      message: "",
    },
    // Add mode for validation
    mode: "onChange",
  });

  const { mutateAsync: createSolicitation, isPending } = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    SolicitationCreateRequest
  >({
    mutationKey: ["createSolicitation"],
    mutationFn: async (data) =>
      await postRequest({ url: "/procurement/solicitations", payload: data }),
  });

  const onSubmit = async (data: any, event?: React.FormEvent) => {
    // Prevent default form submission behavior which causes page reload
    if (event) {
      event.preventDefault();
    }
    try {
      const formData = forge.getValues();
      const completeData: Omit<CreateSolicitationFormData, "submissionDeadline"> & { submissionDeadline: Date } = {
        ...formData,
        ...data,
      };

      // Transform form data to match API schema
      const apiPayload: SolicitationCreateRequest = {
        name: completeData.solicitationName,
        solId: completeData.solId,
        typeId: completeData.solicitationType,
        categoryIds: Array.isArray(completeData.category)
          ? completeData.category
          : [completeData.category],
        estimatedCost: completeData.estimatedCost
          ? parseFloat(completeData.estimatedCost)
          : undefined,
        description: completeData.description,
        visibility: completeData.visibility as "public" | "invite-only",
        status: "active",
        submissionDeadline: format(completeData.submissionDeadlineDate, "yyyy-MM-dd'T'HH:mm:ss"),
        questionDeadline: completeData.questionAcceptanceDeadlineDate
          ? format(completeData.questionAcceptanceDeadlineDate, "yyyy-MM-dd'T'HH:mm:ss")
          : undefined,
        bidIntent: completeData.bidIntent as "required" | "not-required",
        bidIntentDeadline: completeData.bidIntentDeadlineDate
          ? format(completeData.bidIntentDeadlineDate, "yyyy-MM-dd'T'HH:mm:ss")
          : undefined,
        timezone: completeData.timezone || "Africa/Lagos",
        events: (() => {
          if (!completeData.event) return undefined;

          const validEvents: Array<{
            eventType: string;
            eventLocation: string;
            eventDate: string;
            eventDescription?: string;
          }> = [];

          for (const evt of completeData.event) {
            if (!evt) continue;

            // Validate date and time before creating Date object
            if (!evt.date || !evt.time) {
              console.warn("Invalid event date or time:", {
                date: evt.date,
                time: evt.time,
              });
              continue;
            }

            // Handle Date object from TextDatePicker
            const dateStr =
              (evt.date as any) instanceof Date
                ? format(evt.date as unknown as Date, "yyyy-MM-dd") // Extract YYYY-MM-DD
                : evt.date;

            // Validate the constructed date string
            const dateTimeStr = `${dateStr}T${evt.time}`;
            const eventDate = format(dateTimeStr, "yyyy-MM-dd'T'HH:mm:ss");

            if (isNaN(Date.parse(eventDate))) {
              console.warn("Invalid date constructed:", dateTimeStr);
              continue;
            }

            validEvents.push({
              eventType: evt.event,
              eventLocation: evt.location,
              eventDate: eventDate,
              eventDescription: evt.note || undefined,
            });
          }

          // Return undefined if no valid events exist
          return validEvents.length > 0 ? validEvents : undefined;
        })(),
        // Use already uploaded files from Step4Form
        files:
          completeData.documents && completeData.documents.length > 0
            ? completeData.documents.map((doc: any) => ({
                name: doc.name,
                url: doc.url,
                size: doc.size,
                type: doc.type,
              }))
            : undefined,
        vendors:
          completeData.vendor?.map((item: any) => ({ id: item.value })) ||
          undefined,
      };

      const response = await createSolicitation(apiPayload);

      if (response?.data) {
        // Invalidate queries to refresh the solicitation list
        queryClient.invalidateQueries({ queryKey: ["solicitations"] });
        queryClient.invalidateQueries({ queryKey: ["my-solicitations"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

        toast.success(
          "Solicitation Created",
          "Your solicitation has been created successfully."
        );
        // Clear file session after successful publish
        clearSession();
        setOpen(false);
        setCurrentStep(1);
        forge.reset();
      }
    } catch (error) {
      console.log(error);
      const err = error as ApiResponseError;
      toast.error(
        "Creation Failed",
        err?.message ?? "Failed to create solicitation. Please try again."
      );
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      const formData = forge.getValues();

      // Check if we have at least the minimum required fields for draft
      if (
        !formData.solicitationName ||
        !formData.solicitationType ||
        !formData.category ||
        !formData.description
      ) {
        // If minimum fields are not filled, just close the dialog
        setOpen(false);
        setCurrentStep(1);
        forge.reset();
        return;
      }

      // Transform form data to match API schema for draft
      const apiPayload: Omit<SolicitationCreateRequest, "events"> & {
        events?: SolicitationCreateRequest["events"];
      } = {
        name: formData.solicitationName,
        solId: formData?.solId,
        typeId: formData.solicitationType,
        categoryIds: Array.isArray(formData.category)
          ? formData.category
          : [formData.category],
        estimatedCost: formData.estimatedCost
          ? parseFloat(formData.estimatedCost)
          : undefined,
        description: formData.description,
        visibility:
          (formData.visibility as "public" | "invite-only") || "invite-only",
        status: "draft", // Save as draft
        submissionDeadline: formData.submissionDeadlineDate
          ? format(formData.submissionDeadlineDate,  "yyyy-MM-dd'T'HH:mm:ss")
          : format(Date.now() + 30 * 24 * 60 * 60 * 1000, "yyyy-MM-dd'T'HH:mm:ss"), // Default to 30 days from now
        questionDeadline: formData.questionAcceptanceDeadlineDate
          ? format(formData.questionAcceptanceDeadlineDate,  "yyyy-MM-dd'T'HH:mm:ss")
          : undefined,
        bidIntent: formData.bidIntent as "required" | "not-required",
        bidIntentDeadline: formData.bidIntentDeadlineDate
          ? format(formData.bidIntentDeadlineDate,  "yyyy-MM-dd'T'HH:mm:ss")
          : undefined,
        timezone: formData.timezone || "Africa/Lagos",
        events: (() => {
          if (!formData.event) return undefined;

          const validEvents: Array<{
            eventType: string;
            eventLocation: string;
            eventDate: string;
            eventDescription?: string;
          }> = [];

          for (const evt of formData.event) {
            if (!evt) continue;

            // Validate date and time before creating Date object
            if (!evt.date || !evt.time) {
              continue;
            }

            // Handle Date object from TextDatePicker
            const dateStr =
              evt.date && typeof evt.date === "object" && (evt.date as any)
                ? format(evt.date, "yyyy-MM-dd") // Extract YYYY-MM-DD
                : evt.date;

            // Validate the constructed date string
            const dateTimeStr = `${dateStr}T${evt.time}`;
            const eventDate = new Date(dateTimeStr);

            if (isNaN(eventDate.getTime())) {
              continue;
            }

            validEvents.push({
              eventType: evt.event,
              eventLocation: evt.location,
              eventDate: eventDate.toISOString(),
              eventDescription: evt.note || undefined,
            });
          }

          // Return undefined if no valid events exist
          return validEvents.length > 0 ? validEvents : undefined;
        })(),
        // Use already uploaded files from Step4Form
        files:
          formData.documents && formData.documents.length > 0
            ? formData.documents.map((doc: any) => ({
                name: doc.name,
                url: doc.url,
                size: doc.size,
                type: doc.type,
              }))
            : undefined,
        vendors:
          formData.vendor?.map((item: any) => ({ id: item.value })) ||
          undefined,
      };

      const response = await createSolicitation(apiPayload);

      if (response?.data) {
        // Invalidate queries to refresh the solicitation list
        queryClient.invalidateQueries({ queryKey: ["solicitations"] });
        queryClient.invalidateQueries({ queryKey: ["my-solicitations"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

        toast.success(
          "Draft Saved",
          "Your solicitation has been saved as a draft. You can continue editing it later."
        );
        // Clear file session after successful save to draft
        clearSession();
        setOpen(false);
        setCurrentStep(1);
        forge.reset();
      }
    } catch (error) {
      // console.log(error);
      const err = error as ApiResponseError;
      toast.error(
        "Save Failed",
        err ?? "Failed to save draft. Please try again."
      );
    }
  };

  // Validate current step before proceeding to the next step
  const validateAndProceed = async () => {
    try {
      // Get current form values
      const formValues = forge.getValues();

      // Validate based on current step
      switch (currentStep) {
        case 1:
          await step1Schema.validate(formValues, { abortEarly: false });
          break;
        case 2:
          await step2Schema.validate(formValues, { abortEarly: false });
          break;
        case 3:
          // await step3Schema.validate(formValues, { abortEarly: false });
          break;
        case 4:
          // // Skip validation for step 4 if no documents are uploaded
          if (formValues.documents && formValues.documents.length > 0) {
            await step4Schema.validate(formValues, { abortEarly: false });
          }
          break;
        case 5:
          await step5Schema.validate(formValues, { abortEarly: false });
          break;
        default:
          break;
      }

      // If we reach here, validation passed, proceed to next step
      setCurrentStep((prev) => prev + 1);
    } catch (error) {
      // Handle validation errors
      if (error instanceof yup.ValidationError) {
        // Set errors in the form
        const fieldErrors: Record<string, string> = {};

        error.inner.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path] = err.message;
          }
        });

        // Set errors in the form
        Object.keys(fieldErrors).forEach((field) => {
          forge.setError(field as any, {
            type: "manual",
            message: fieldErrors[field],
          });
        });

        // Show toast with first error
        if (error.inner.length > 0) {
          toast.error(
            "Validation Error",
            error.inner[0].message || "Please check the form for errors."
          );
        }
      } else {
        // Handle unexpected errors
        console.error("Validation error:", error);
        toast.error("Error", "An unexpected error occurred. Please try again.");
      }
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Step 1 of 6: Basic Information";
      case 2:
        return "Step 2 of 6: Timeline & Bid Details";
      case 3:
        return "Step 3 of 6: Create Event";
      case 4:
        return "Step 4 of 6: Documents";
      case 5:
        return "Step 5 of 6: Invite Vendors";
      case 6:
        return "Step 6 of 6: Review & Publish";
      default:
        return "Step 1 of 6: Basic Information";
    }
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Clear file session when dialog is closed (user exits)
      clearSession();
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-[#2A4467] hover:bg-[#1e3147] text-white px-6 py-2 rounded-lg flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Solicitation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Custom Header with Close Button */}
        <div className="flex items-center justify-between p-6">
          <div>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-200">
              Create Solicitation
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">{getStepTitle()}</p>
          </div>
        </div>

        {/* Form Content */}
        <Forge control={forge.control} onSubmit={onSubmit} >
          {currentStep === 1 && (
            <Step1Form
              solicitationTypes={solicitationTypes}
              categoryOptions={categoryOptions}
              showSolId
            />
          )}

          {currentStep === 2 && (
            <Step2Form
              bidIntentOptions={bidIntentOptions}
              visibilityOptions={visibilityOptions}
            />
          )}

          {currentStep === 3 && (
            <>
              <Step3Form eventOptions={eventOptions} control={forge.control} />
            </>
          )}

          {currentStep === 4 && (
            <>
              <Step4Form control={forge.control} documents={[]} />
            </>
          )}

          {currentStep === 5 && (
            <>
              <Step5Form />
            </>
          )}

          {currentStep === 6 && (
            <>
              <Step6Form
                setStep={(val) => setCurrentStep(val)}
                formData={forge.getValues()}
                solicitationTypes={solicitationTypes}
                categoryOptions={categoryOptions}
              />
            </>
          )}

          {/* Footer Buttons */}
          <div
            className={cn("flex items-center justify-end pt-6  px-6 py-6", {
              "justify-between": currentStep > 1,
            })}
          >
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveAsDraft}
                className="px-8 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Save as Draft
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
                type={currentStep === 6 ? "submit" : "button"}
                onClick={currentStep === 6 ? undefined : validateAndProceed}
                disabled={isPending}
                className="px-8 py-2 bg-[#2A4467] hover:bg-[#1e3147] text-white rounded-lg"
              >
                {currentStep === 6
                  ? isPending
                    ? "Publishing..."
                    : "Publish"
                  : "Continue"}
              </Button>
            </div>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSolicitationDialog;
