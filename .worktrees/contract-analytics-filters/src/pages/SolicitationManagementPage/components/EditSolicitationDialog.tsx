import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Forge, useForge } from "@/lib/forge";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postRequest, getRequest, putRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserRole } from "@/hooks/useUserRole";
import Step1Form from "./Step1Form";
import Step2Form from "./Step2Form";
import Step3Form from "./Step3Form";
import Step4Form from "./Step4Form";
import Step5Form from "./Step5Form";
import Step6Form from "./Step6Form";
import { cn } from "@/lib/utils";
import { useClearSession } from "@/store/solicitationFileSlice";
import { format } from "date-fns";

// Form validation schemas for each step
const step1Schema = yup.object({
  solicitationName: yup.string().required("Solicitation name is required"),
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

const eventSchema = yup.object({
  event: yup.string().required("Event is required"),
  location: yup.string().required("Location is required"),
  date: yup.string().required("Date is required"),
  time: yup.string().required("Time is required"),
  note: yup.string().optional(),
});

const step3Schema = yup.object({
  event: yup.array().of(eventSchema).optional(),
});

const documentSchema = yup.mixed().test({
  name: "isFileOrUploaded",
  message: "Document must be a valid file or uploaded document",
  test: (value) => {
    return (
      value instanceof File ||
      (value && typeof value === "object" && "url" in value)
    );
  },
});

const vendorSchema = yup.object({
  value: yup.string().required("Vendor ID is required"),
  label: yup.string().required("Vendor Name is required"),
});

const step4Schema = yup.object({
  documents: yup.array().of(documentSchema).optional(),
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

export type EditSolicitationFormData = Step1FormData &
  Step2FormData &
  Step3FormData &
  Step4FormData &
  Step5FormData & {
    files?: File[];
    vendors?: Array<{ id: string; status?: string }>;
  };

// Types for API request
type SolicitationUpdateRequest = {
  name: string;
  typeId: string;
  categoryIds: string[];
  estimatedCost?: number;
  description: string;
  visibility?: "public" | "invite-only";
  status?: "draft" | "active" | "closed" | "awarded" | "evaluating";
  submissionDeadline: string;
  questionDeadline?: string;
  bidIntent?: string;
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

// Solicitation type for props
type Solicitation = {
  _id: string;
  name: string;
  typeId: { _id: string; name: string } | string;
  type?: { _id: string; name: string };
  categoryIds: Array<{ _id: string; name: string }>;
  categories?: Array<{ _id: string; name: string }>;
  submissionDeadline: string;
  estimatedCost?: number;
  description: string;
  visibility: "public" | "private" | "invite-only";
  status: "draft" | "active" | "closed" | "awarded" | "evaluating";
  questionDeadline?: string;
  bidIntent?: string;
  bidIntentDeadline?: string;
  timezone: string;
  events?: Array<{
    _id: string;
    eventType: string;
    eventLocation: string;
    eventDate: string;
    eventDescription?: string;
  }>;
  files?: Array<{
    _id: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  vendors?: Array<{
    _id: string;
    email: string;
    name?: string;
    status: "invited" | "confirmed" | "declined";
  }>;
};

interface EditSolicitationDialogProps {
  solicitation: Solicitation;
  isLink?: boolean;
}

const EditSolicitationDialog = ({
  solicitation,
  isLink,
}: EditSolicitationDialogProps) => {
  const toast = useToastHandler();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const clearSession = useClearSession();
  const { isCompanyAdmin } = useUserRole();

  // Hide edit button for non-company admin when solicitation is closed or awarded
  if (
    (solicitation.status === "closed" || solicitation.status === "awarded") &&
    !isCompanyAdmin
  ) {
    return null;
  }

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

  // Fetch full solicitation details when dialog opens to ensure all fields are available
  const { data: solicitationData } = useQuery<
    ApiResponse<any>,
    ApiResponseError
  >({
    queryKey: ["solicitation", solicitation._id],
    queryFn: async () =>
      await getRequest({
        url: `/procurement/solicitations/${solicitation._id}`,
      }),
    enabled: !!open && !!solicitation?._id,
  });

  const detailedSolicitation =
    solicitationData?.data?.data?.solicitation || solicitationData?.data?.data;
  const effectiveSolicitation = detailedSolicitation || solicitation;

  // Helper function to format date for input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    console.log({ dateString })
    const date = dateString;
    return date;
  };

  // Helper function to format time for input
  const formatTimeForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = format(dateString,  "yyyy-MM-dd'T'HH:mm:ss");
    return date.split("T")[1].substring(0, 5);
    // return date.toTimeString().split(" ")[0].substring(0, 5);
  };

  // Prepare default values from solicitation data
  const getDefaultValues = (): EditSolicitationFormData => {
    const s: any = effectiveSolicitation || {};
    const typeId = typeof s.typeId === "object" ? s.typeId._id : s.typeId;
    const categories = s.categories || s.categoryIds || [];
    const categoryId = categories.length > 0 ? categories[0]._id : "";
    const vendors =
      s.vendors?.map((vendor: any) => ({
        value: vendor._id,
        label: vendor?.id?.name || vendor.email || vendor?.id?.invite?.email,
        name: vendor?.id?.name || vendor.email || vendor?.id?.invite?.email,
      })) || [];

    return {
      solicitationName: s.name || "",
      solicitationType: typeId || "",
      estimatedCost: s.estimatedCost?.toString() || "",
      category: categoryId,
      description: s.description || "",
      submissionDeadlineDate: formatDateForInput(s.submissionDeadline),
      questionAcceptanceDeadlineDate: formatDateForInput(
        s.questionDeadline || ""
      ),
      timezone: s.timezone || "Africa/Lagos",
      bidIntent: s.bidIntent || "",
      bidIntentDeadlineDate: formatDateForInput(s.bidIntentDeadline || ""),
      visibility:
        s.visibility === "private" ? "invite-only" : s.visibility || "public",
      event: s.events?.map((evt: any) => ({
        event: evt.eventType || "",
        location: evt.eventLocation || "",
        date: formatDateForInput(evt.eventDate),
        time: formatTimeForInput(evt.eventDate),
        note: evt.eventDescription || "",
      })) || [{ event: "", location: "", date: "", time: "", note: "" }],
      documents:
        s.files?.map((file: any) => ({
          _id: file._id,
          name: file.name,
          url: file.url,
          size: file.size,
          type: file.type,
          originalName: file.originalName || file.name,
          fileName: file.fileName || file.name,
        })) || [],
      vendor: vendors,
      message: "",
    };
  };

  // Single form instance for all steps
  const forge = useForge<EditSolicitationFormData>({
    // defaultValues: getDefaultValues(),
    // values: getDefaultValues(),
  });

  // Reset form when solicitation changes or when detailed data loads
  useEffect(() => {
    if (!open) return;
    forge.reset(getDefaultValues());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSolicitation, open]);

  // File upload mutation
  const { mutateAsync: uploadFiles } = useMutation<
    ApiResponse<string[]>,
    ApiResponseError,
    FormData
  >({
    mutationKey: ["uploadFiles"],
    mutationFn: async (formData) =>
      await postRequest({
        url: "/upload",
        payload: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      }),
  });

  const { mutateAsync: updateSolicitation, isPending } = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    SolicitationUpdateRequest
  >({
    mutationKey: ["updateSolicitation"],
    mutationFn: async (data) =>
      await putRequest({
        url: `/procurement/solicitations/${effectiveSolicitation._id}`,
        payload: data,
      }),
  });

  const { mutateAsync: saveDraft, isPending: isDraftSaving } = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    SolicitationUpdateRequest
  >({
    mutationKey: ["saveSolicitationDraft"],
    mutationFn: async (data) =>
      await putRequest({
        url: `/procurement/solicitations/${effectiveSolicitation._id}`,
        payload: data,
      }),
  });

  const onSubmit = async (data: any) => {
    try {
      const formData = forge.getValues();
      const completeData = {
        ...formData,
        ...data,
      };

      // Handle file uploads first if there are files
      let uploadedFiles: Array<{
        name: string;
        url: string;
        size: string;
        type: string;
      }> = [];

      if (completeData.documents && completeData.documents.length > 0) {
        // Separate files that need upload from already uploaded files
        const filesToUpload = completeData.documents.filter(
          (doc: any) => doc instanceof File
        );
        const alreadyUploaded = (completeData.documents as any[])
          .filter(
            (
              doc: any
            ): doc is {
              name: string;
              url: string;
              size: string | number;
              type: string;
            } =>
              doc &&
              typeof doc === "object" &&
              "url" in doc &&
              "name" in doc &&
              "size" in doc &&
              "type" in doc
          )
          .map((doc) => ({
            name: String(doc.name),
            url: String(doc.url),
            size:
              typeof doc.size === "number"
                ? String(doc.size)
                : String(doc.size),
            type: String(doc.type),
          }));

        // Upload new files if any
        if (filesToUpload.length > 0) {
          const fileFormData = new FormData();
          filesToUpload.forEach((file: File) => {
            fileFormData.append("file", file);
          });

          const uploadResponse = await uploadFiles(fileFormData);
          if (uploadResponse?.data?.data) {
            const newlyUploaded = filesToUpload.map(
              (file: File, index: number) => ({
                name: file.name,
                url: uploadResponse.data.data[index],
                size: file.size.toString(),
                type: file.type,
              })
            );
            uploadedFiles = [...alreadyUploaded, ...newlyUploaded];
          }
        } else {
          // Only pre-uploaded files
          uploadedFiles = alreadyUploaded;
        }
      }

      // Transform form data to match API schema
      const apiPayload: SolicitationUpdateRequest = {
        name: completeData.solicitationName,
        typeId: completeData.solicitationType,
        categoryIds: Array.isArray(completeData.category)
          ? completeData.category
          : [completeData.category],
        estimatedCost: completeData.estimatedCost
          ? parseFloat(completeData.estimatedCost)
          : undefined,
        description: completeData.description,
        visibility: completeData.visibility as "public" | "invite-only",
        status: "active", // Set status to active when updating
        submissionDeadline: new Date(
          completeData.submissionDeadlineDate
        ).toISOString(),
        questionDeadline: completeData.questionAcceptanceDeadlineDate
          ? format(
              completeData.questionAcceptanceDeadlineDate,
              "yyyy-MM-dd'T'HH:mm:ss"
            )
          : undefined,
        bidIntent: completeData.bidIntent as "required" | "not required",
        bidIntentDeadline: completeData.bidIntentDeadlineDate
          ? format(completeData.bidIntentDeadlineDate, "yyyy-MM-dd'T'HH:mm:ss")
          : undefined,
        timezone: completeData.timezone || "",
        events: completeData.event
          ?.map((evt: any) => {
            // Validate date and time before creating Date object
            if (!evt.date || !evt.time) {
              console.warn("Invalid event date or time:", {
                date: evt.date,
                time: evt.time,
              });
              return null;
            }

            // Handle Date object from TextDatePicker
            const dateStr =
              evt.date instanceof Date
                ? evt.date.toISOString().split("T")[0] // Extract YYYY-MM-DD
                : evt.date;

            // Validate the constructed date string
            const dateTimeStr = `${dateStr}T${evt.time}`;
            const eventDate = format(dateTimeStr, "yyyy-MM-dd'T'HH:mm:ss");

            if (isNaN(Date.parse(eventDate))) {
              console.warn("Invalid date constructed:", dateTimeStr);
              return null;
            }

            return {
              eventType: evt.event,
              eventLocation: evt.location,
              eventDate: eventDate,
              eventDescription: evt.note || undefined,
            };
          })
          .filter(Boolean), // Remove null entries
        files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
        vendors:
          completeData.vendor?.map((item: any) => ({ id: item.value })) ||
          undefined,
      };

      const response = await updateSolicitation(apiPayload);

      if (response?.data) {
        // Invalidate queries to refresh the solicitation data
        queryClient.invalidateQueries({ queryKey: ["solicitations"] });
        queryClient.invalidateQueries({ queryKey: ["my-solicitations"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        queryClient.invalidateQueries({
          queryKey: ["solicitation", solicitation._id],
        });

        toast.success(
          "Solicitation Updated",
          "Your solicitation has been updated successfully."
        );
        // Clear file session after successful publish
        clearSession();
        setOpen(false);
        setCurrentStep(1);
        forge.reset(getDefaultValues());
      }
    } catch (error) {
      console.log(error);
      const err = error as ApiResponseError;
      toast.error(
        "Update Failed",
        err?.message ?? "Failed to update solicitation. Please try again."
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

      // Handle file uploads first if there are files
      let uploadedFiles: Array<{
        name: string;
        url: string;
        size: string;
        type: string;
      }> = [];

      if (formData.documents && formData.documents.length > 0) {
        // Separate files that need upload from already uploaded files
        const filesToUpload = formData.documents.filter(
          (doc: any) => doc instanceof File
        );
        const alreadyUploaded = (formData.documents as any[])
          .filter(
            (
              doc: any
            ): doc is {
              name: string;
              url: string;
              size: string | number;
              type: string;
            } =>
              doc &&
              typeof doc === "object" &&
              "url" in doc &&
              "name" in doc &&
              "size" in doc &&
              "type" in doc
          )
          .map((doc) => ({
            name: String(doc.name),
            url: String(doc.url),
            size:
              typeof doc.size === "number"
                ? String(doc.size)
                : String(doc.size),
            type: String(doc.type),
          }));

        if (filesToUpload.length > 0) {
          const fileFormData = new FormData();
          filesToUpload.forEach((file: File) => {
            fileFormData.append("file", file);
          });

          const uploadResponse = await uploadFiles(fileFormData);
          if (uploadResponse?.data?.data) {
            const newlyUploaded = filesToUpload.map(
              (file: File, index: number) => ({
                name: file.name,
                url: uploadResponse.data.data[index],
                size: file.size.toString(),
                type: file.type,
              })
            );
            uploadedFiles = [...alreadyUploaded, ...newlyUploaded];
          }
        } else {
          uploadedFiles = alreadyUploaded;
        }
      }

      // Transform form data to match API schema with draft status
      const apiPayload: SolicitationUpdateRequest = {
        name: formData.solicitationName || effectiveSolicitation.name,
        typeId:
          formData.solicitationType ||
          (typeof effectiveSolicitation.typeId === "object"
            ? effectiveSolicitation.typeId._id
            : effectiveSolicitation.typeId),
        categoryIds: formData.category
          ? Array.isArray(formData.category)
            ? formData.category
            : [formData.category]
          : (
              effectiveSolicitation.categories ||
              effectiveSolicitation.categoryIds ||
              []
            ).map((cat: any) => cat._id),
        estimatedCost: formData.estimatedCost
          ? parseFloat(formData.estimatedCost)
          : effectiveSolicitation.estimatedCost,
        description: formData.description || effectiveSolicitation.description,
        visibility:
          (formData.visibility as "public" | "invite-only") ||
          (effectiveSolicitation.visibility === "private"
            ? "invite-only"
            : effectiveSolicitation.visibility),
        status: "draft", // Always save as draft
        submissionDeadline: formData.submissionDeadlineDate
            ? format(formData.submissionDeadlineDate,  "yyyy-MM-dd'T'HH:mm:ss")
          : effectiveSolicitation.submissionDeadline,
        questionDeadline: formData.questionAcceptanceDeadlineDate 
          ? format(formData.questionAcceptanceDeadlineDate,  "yyyy-MM-dd'T'HH:mm:ss")
          : effectiveSolicitation.questionDeadline,
        bidIntent:
          (formData.bidIntent as "required" | "not required") ||
          effectiveSolicitation.bidIntent,
        bidIntentDeadline: formData.bidIntentDeadlineDate
          ? format(formData.bidIntentDeadlineDate,  "yyyy-MM-dd'T'HH:mm:ss")
          : effectiveSolicitation.bidIntentDeadline,
        timezone:
          formData.timezone || effectiveSolicitation.timezone || "Africa/Lagos",
        events:
          formData.event && formData.event.length > 0
            ? formData.event
                ?.map((evt: any) => {
                  if (!evt.date || !evt.time) {
                    return null;
                  }
                  const dateStr =
                    evt.date instanceof Date
                      ? evt.date.toISOString().split("T")[0]
                      : evt.date;
                  const dateTimeStr = `${dateStr}T${evt.time}`;
                  const eventDate = new Date(dateTimeStr);
                  if (isNaN(eventDate.getTime())) {
                    return null;
                  }
                  return {
                    eventType: evt.event,
                    eventLocation: evt.location,
                    eventDate: eventDate.toISOString(),
                    eventDescription: evt.note || undefined,
                  };
                })
                .filter((event) => event !== null)
            : effectiveSolicitation.events?.map((evt: any) => ({
                eventType: evt.eventType,
                eventLocation: evt.eventLocation,
                eventDate: evt.eventDate,
                eventDescription: evt.eventDescription,
              })),
        files:
          uploadedFiles.length > 0
            ? uploadedFiles
            : effectiveSolicitation.files?.map((file: any) => ({
                name: file.name,
                url: file.url,
                size: file.size.toString(),
                type: file.type,
              })),
        vendors:
          formData.vendor && formData.vendor.length > 0
            ? formData.vendor.map((item: any) => ({ id: item.value }))
            : effectiveSolicitation.vendors?.map((vendor: any) => ({
                id: vendor._id,
              })),
      };

      const response = await saveDraft(apiPayload);

      if (response?.data) {
        queryClient.invalidateQueries({ queryKey: ["solicitations"] });
        queryClient.invalidateQueries({ queryKey: ["my-solicitations"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        queryClient.invalidateQueries({
          queryKey: ["solicitation", effectiveSolicitation._id],
        });

        toast.success(
          "Draft Saved",
          "Your solicitation has been saved as draft successfully."
        );
        // Clear file session after successful save to draft
        clearSession();
        setOpen(false);
        setCurrentStep(1);
        forge.reset(getDefaultValues());
      }
    } catch (error) {
      console.log(error);
      const err = error as ApiResponseError;
      toast.error(
        "Save Failed",
        err?.message ??
          "Failed to save solicitation as draft. Please try again."
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
          // No validation for step 3 (events optional)
          break;
        case 4:
          // Skip validation for step 4 if no documents are uploaded
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
        <Button
          // variant={isLink ? "link" : "default"}
          className={cn(
            "flex items-center gap-2 bg-gray-300 text-gray-800 hover:bg-gray-400",
            {
              "!bg-transparent !text-gray-600": isLink,
            }
          )}
        >
          {!isLink && <Edit className="h-4 w-4" />}
          Edit Solicitation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Custom Header with Close Button */}
        <div className="flex items-center justify-between p-6">
          <div>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-200">
              Edit Solicitation
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">{getStepTitle()}</p>
          </div>
        </div>

        {/* Form Content */}
        <Forge control={forge.control} onSubmit={onSubmit}>
          {currentStep === 1 && (
            <Step1Form
              solicitationTypes={solicitationTypes}
              categoryOptions={[...categoryOptions]}
              showSolId={false}
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
              <Step3Form
                eventOptions={eventOptions}
                control={forge.control as any}
              />
            </>
          )}

          {currentStep === 4 && (
            <>
              <Step4Form
                documents={(getDefaultValues().documents as any[]) || []}
                control={forge.control as any}
              />
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
                formData={forge.getValues() as any}
                solicitationTypes={solicitationTypes}
                categoryOptions={categoryOptions}
              />
            </>
          )}

          {/* Footer Buttons */}
          <div
            className={cn("flex items-center justify-end pt-6  px-6 py-6", {
              "justify-between":
                currentStep > 1 && effectiveSolicitation.status === "draft",
            })}
          >
            {currentStep > 1 && effectiveSolicitation.status === "draft" && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={isDraftSaving}
                className="px-8 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {isDraftSaving ? "Saving..." : "Save as Draft"}
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
                    ? "Updating..."
                    : effectiveSolicitation.status === "draft"
                    ? "Publish Solicitation"
                    : "Update Solicitation"
                  : "Continue"}
              </Button>
            </div>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default EditSolicitationDialog;
