import React from "react";
import { Forger } from "@/lib/forge";
import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import { TextDatePicker } from "@/components/layouts/FormInputs/TextInput";
import { TextSelectWithSearch } from "@/components/layouts/FormInputs/TextSelectWithSearch";
import { useWatch } from "react-hook-form";
import timezoneData from "@/assets/timezones.json";

interface Step2FormProps {
  bidIntentOptions: Array<{ label: string; value: string }>;
  visibilityOptions: Array<{ label: string; value: string }>;
}

const Step2Form: React.FC<Step2FormProps> = ({
  bidIntentOptions,
  visibilityOptions,
}) => {
  const submissionDeadlineDate = useWatch({ name: "submissionDeadlineDate" });
  const maxDate = submissionDeadlineDate
    ? new Date(submissionDeadlineDate)
    : undefined;

  return (
    <div className="p-6 space-y-6">
      {/* Submission Deadline Date & Time */}
      <Forger
        component={TextDatePicker}
        name="submissionDeadlineDate"
        label="Submission Deadline Date & Time"
        placeholder="Select Date"
        showTime
        minDate={new Date()}
        containerClass="space-y-2"
      />

      {/* Question Acceptance Deadline Date & Time */}
      <Forger
        component={TextDatePicker}
        name="questionAcceptanceDeadlineDate"
        label="Question Acceptance Deadline Date & Time"
        showTime
        placeholder="Select Date & Time"
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

      {/* Bid Intent */}
      <Forger
        showTime
        name="bidIntent"
        component={TextSelect}
        label="Bid Intent"
        placeholder="Optional/Required"
        options={bidIntentOptions}
        containerClass="space-y-2"
      />

      {/* Bid Intent Deadline Date & Time */}
      <Forger
        component={TextDatePicker}
        name="bidIntentDeadlineDate"
        label="Bid Intent Deadline Date & Time"
        placeholder="Select Date & Time"
        minDate={new Date()}
        dependencies={[maxDate]}
        maxDate={maxDate}
        showTime
        containerClass="space-y-2"
      />

      {/* Visibility */}
      <Forger
        name="visibility"
        component={TextSelect}
        label="Visibility"
        placeholder="Invite-only, Public"
        options={visibilityOptions}
        containerClass="space-y-2"
      />
    </div>
  );
};

export default Step2Form;
