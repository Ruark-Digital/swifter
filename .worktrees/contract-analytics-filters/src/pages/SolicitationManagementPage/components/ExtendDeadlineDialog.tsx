import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "lucide-react";
import { TextDatePicker } from "@/components/layouts/FormInputs/TextInput";
import { TextSelectWithSearch } from "@/components/layouts/FormInputs/TextSelectWithSearch";
import { Forge, Forger, useForge } from "@/lib/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { putRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { useWatch } from "react-hook-form";
import timezoneData from "@/assets/timezones.json";
import { formatDateTZ, zonedTimeToUtc } from "@/lib/utils";

const extendDeadlineSchema = yup.object({
  submissionDeadline: yup
    .string()
    .required("Submission deadline is required"),
  questionDeadline: yup.string().optional(),
  timezone: yup.string().required("Timezone is required"),
});

type FormValues = {
  submissionDeadline: string;
  questionDeadline?: string;
  timezone: string;
};

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

interface ExtendDeadlineDialogProps {
  solicitation: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExtendDeadlineDialog: React.FC<ExtendDeadlineDialogProps> = ({
  solicitation,
  open,
  onOpenChange,
}) => {
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  // Helper to get solicitation timezone
  const getSolicitationTimezone = () => solicitation?.timezone || "Africa/Lagos";

  // Helper function to format date for input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    return formatDateTZ(dateString, "yyyy-MM-dd'T'HH:mm", getSolicitationTimezone());
  };

  const { control, reset } = useForge<FormValues>({
    resolver: yupResolver(extendDeadlineSchema),
    defaultValues: {
      submissionDeadline: "",
      questionDeadline: "",
      timezone: "Africa/Lagos",
    },
  });

  // Auto-populate fields when solicitation data is loaded
  useEffect(() => {
    if (solicitation) {
      reset({
        submissionDeadline: formatDateForInput(
          solicitation.submissionDeadline || ""
        ),
        questionDeadline: formatDateForInput(
          solicitation.questionDeadline || ""
        ),
        timezone: solicitation.timezone || "Africa/Lagos",
      });
    }
  }, [solicitation, reset]);

  const submissionDeadlineDate = useWatch({
    name: "submissionDeadline",
    control,
  });
  const maxDate = submissionDeadlineDate
    ? new Date(submissionDeadlineDate)
    : undefined;

  // Update solicitation mutation
  const { mutateAsync: updateSolicitation, isPending } = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    SolicitationUpdateRequest
  >({
    mutationKey: ["updateSolicitation"],
    mutationFn: async (data) =>
      await putRequest({
        url: `/procurement/solicitations/${solicitation._id}`,
        payload: data,
      }),
    onSuccess: () => {
      toast.success("Success", "Deadline extended successfully");
      // Invalidate queries to refresh the solicitation data
      queryClient.invalidateQueries({ queryKey: ["solicitations"] });
      queryClient.invalidateQueries({ queryKey: ["my-solicitations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({
        queryKey: ["solicitation", solicitation._id],
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Extend deadline error:", error);
      toast.error(
        "Error",
        error?.response?.data?.message ?? "Failed to extend deadline"
      );
    },
  });

  const onSubmit = async (data: FormValues, _e?: React.BaseSyntheticEvent) => {
    try {
      // Transform form data to match API schema
      const apiPayload: SolicitationUpdateRequest = {
        name: solicitation.name,
        typeId: typeof solicitation.typeId === "object" 
          ? solicitation.typeId._id 
          : solicitation.typeId,
        categoryIds: (solicitation.categories || solicitation.categoryIds || [])
          .map((cat: any) => cat._id),
        estimatedCost: solicitation.estimatedCost,
        description: solicitation.description,
        visibility: solicitation.visibility === "private" 
          ? "invite-only" 
          : solicitation.visibility,
        status: solicitation.status,
        submissionDeadline: zonedTimeToUtc(data.submissionDeadline, data.timezone).toISOString(),
        questionDeadline: data.questionDeadline
          ? zonedTimeToUtc(data.questionDeadline, data.timezone).toISOString()
          : solicitation.questionDeadline,
        bidIntent: solicitation.bidIntent,
        bidIntentDeadline: solicitation.bidIntentDeadline,
        timezone: data.timezone,
        events: solicitation.events?.map((evt: any) => ({
          eventType: evt.eventType,
          eventLocation: evt.eventLocation,
          eventDate: evt.eventDate,
          eventDescription: evt.eventDescription,
        })),
        files: solicitation.files?.map((file: any) => ({
          name: file.name,
          url: file.url,
          size: file.size.toString(),
          type: file.type,
        })),
        vendors: solicitation.vendors?.map((vendor: any) => ({
          id: vendor._id,
          status: vendor.status,
        })),
      };

      await updateSolicitation(apiPayload);
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Extend Deadline
          </DialogTitle>
        </DialogHeader>

        <Forge control={control} onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Submission Deadline */}
            <Forger
              component={TextDatePicker}
              name="submissionDeadline"
              label="Submission Deadline"
              placeholder="Select Date & Time"
              showTime
              minDate={new Date()}
              containerClass="space-y-2"
            />

            {/* Question Deadline */}
            <Forger
              component={TextDatePicker}
              name="questionDeadline"
              label="Question Deadline (Optional)"
              placeholder="Select Date & Time"
              showTime
              minDate={new Date()}
              dependencies={[maxDate]}
              maxDate={maxDate}
              containerClass="space-y-2"
            />

            {/* Timezone */}
            <Forger
              name="timezone"
              component={TextSelectWithSearch}
              label="Timezone"
              placeholder="Select Timezone"
              options={timezoneData}
              containerClass="space-y-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Extending..." : "Extend Deadline"}
            </Button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default ExtendDeadlineDialog;