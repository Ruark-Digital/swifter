import { Forger } from "@/lib/forge";
import { TextCombo } from "@/components/layouts/FormInputs/TextCombo";
import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import { TextDatePicker } from "@/components/layouts/FormInputs/TextInput";
import { useWatch } from "react-hook-form";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface Step1FormProps {
  isEdit?: boolean;
  solicitationOptions: { label: string; value: string }[];
  timezoneOptions: { label: string; value: string }[];
  solicitationsData?: {
    _id: string;
    name: string;
    submissionDeadline: string;
    questionDeadline: string;
    bidIntentDeadline: string;
  }[];
}

const Step1Form = ({ solicitationOptions, timezoneOptions, solicitationsData, isEdit }: Step1FormProps) => {
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

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <Forger
          name="solicitation"
          component={TextCombo}
          label="Solicitation"
          containerClass={cn("", { "hidden": isEdit })}
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
        
        <div className="text-xs text-red-500">
          Evaluation Start Date & Time must be after the close date and time of solicitations
        </div>
        
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