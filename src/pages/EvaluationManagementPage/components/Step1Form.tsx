import { Forger } from "@adexdsamson/forge";
import { TextCombo } from "@/components/layouts/FormInputs/TextCombo";
import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import { TextDatePicker } from "@/components/layouts/FormInputs/TextInput";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { matchTimezoneOption } from "@/lib/timezoneOption";

interface Step1FormProps {
  isEdit?: boolean;
  // Show the solicitation but do not allow changing it (editing a draft).
  lockSolicitation?: boolean;
  solicitationOptions: { label: string; value: string }[];
  timezoneOptions: { label: string; value: string }[];
  solicitationsData?: {
    _id: string;
    name: string;
    submissionDeadline: string;
    questionDeadline: string;
    bidIntentDeadline: string;
    timezone?: string;
  }[];
}

const Step1Form = ({ solicitationOptions, timezoneOptions, solicitationsData, isEdit, lockSolicitation }: Step1FormProps) => {
  // Watch for solicitation selection changes
  const selectedSolicitationId = useWatch({ name: "solicitation" });
  
  // Watch for start date changes
  const selectedStartDate = useWatch({ name: "start_date" });
  
  // Find the selected solicitation's close date (submission deadline)
  const selectedSolicitationCloseDate = useMemo(() => {
    if (!selectedSolicitationId || !solicitationsData) return undefined;
    
    const selectedSolicitation = solicitationsData.find(
      (solicitation) => solicitation._id === selectedSolicitationId
    );
    
    return selectedSolicitation ? new Date(selectedSolicitation.submissionDeadline) : undefined;
  }, [selectedSolicitationId, solicitationsData]);

  // Inherit the timezone from the selected solicitation (create/draft flow).
  // The evaluations solicitation list does not include `timezone`, so read it
  // from the solicitation itself. Stored values may be abbreviations that are
  // not select options (e.g. "NZDT"), so map them onto an option. A timezone
  // the user picked by hand (dirty) is never overwritten.
  const { setValue } = useFormContext();
  const { dirtyFields } = useFormState({ name: ["start_date", "timezone"] });
  const { data: selectedSolicitationData } = useQuery({
    queryKey: ["solicitation", selectedSolicitationId],
    queryFn: async () =>
      await getRequest({
        url: `/procurement/solicitations/${selectedSolicitationId}`,
      }),
    enabled: !isEdit && !!selectedSolicitationId,
  });
  const selectedSolicitation = selectedSolicitationData?.data?.data;
  const selectedSolicitationTimezone: string | undefined =
    selectedSolicitation?.solicitation?.timezone ??
    selectedSolicitation?.timezone ??
    solicitationsData?.find((s) => s._id === selectedSolicitationId)?.timezone;
  const timezoneTouched = !!dirtyFields.timezone;
  useEffect(() => {
    if (isEdit || timezoneTouched) return;
    const option = matchTimezoneOption(selectedSolicitationTimezone, timezoneOptions);
    if (option) setValue("timezone", option, { shouldValidate: true });
  }, [isEdit, timezoneTouched, selectedSolicitationTimezone, timezoneOptions, setValue]);

  // Only surface the hint once the user has edited the start date (a value
  // prefilled from a draft must not show an error before any input) and it is
  // too early.
  const startDateInvalid =
    !!dirtyFields.start_date &&
    !!selectedStartDate &&
    !!selectedSolicitationCloseDate &&
    new Date(selectedStartDate) <= selectedSolicitationCloseDate;

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <Forger
          name="solicitation"
          component={TextCombo}
          label="Solicitation"
          containerClass={cn("", { "hidden": isEdit })}
          disabled={lockSolicitation}
          placeholder="Select Solicitation"
          options={solicitationOptions}
        />
        
        <Forger
          name="timezone"
          component={TextSelect}
          label="Timezone"
          placeholder="Select Timezone"
          options={timezoneOptions}
        />
        
        <Forger
          name="start_date"
          component={TextDatePicker}
          label="Evaluation Start Date & Time"
          showTime
          placeholder="Select Date & Time"
          minDate={selectedSolicitationCloseDate}
        />
        
        {startDateInvalid && (
          <div className="text-xs text-red-500">
            Evaluation Start Date & Time must be after the close date and time of solicitations
          </div>
        )}
        
        <Forger
          name="end_date"
          component={TextDatePicker}
          label="Evaluation End Date & Time"
          placeholder="Select Date & Time"
          showTime
          minDate={selectedStartDate}
        />
      </div>
    </div>
  );
};

export default Step1Form;