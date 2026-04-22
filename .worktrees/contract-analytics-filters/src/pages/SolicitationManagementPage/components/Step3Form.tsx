import { X, Plus } from "lucide-react";
import { useWatch } from "react-hook-form";
import { Forger, useFieldArray } from "@/lib/forge";
import { useFormContext } from "react-hook-form";
import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import {
  TextArea,
  TextDatePicker,
  TextInput,
  TextTimeInput,
} from "@/components/layouts/FormInputs/TextInput";
import { CreateSolicitationFormData } from "./CreateSolicitationDialog";
import { ForgeControl } from "@/lib/forge/types";

interface Step3FormProps {
  control: ForgeControl<CreateSolicitationFormData>;
  eventOptions: Array<{ label: string; value: string }>;
}

const Step3Form = ({
  eventOptions,
  control,
}: Step3FormProps) => {
  const { unregister } = useFormContext();
  const { append, fields, remove } = useFieldArray({
    name: "event" as unknown as string,
    control,
  } as any);

  const submissionDeadlineDate = useWatch({ name: "submissionDeadlineDate", control });
  const maxDate = submissionDeadlineDate ? new Date(submissionDeadlineDate) : undefined;

  // Custom remove handler to ensure proper cleanup of nested fields
  const handleRemove = (index: number) => {
    // Manually unregister all nested fields for this event
    const fieldNames = [
      `event.${index}.event`,
      `event.${index}.location`,
      `event.${index}.date`,
      `event.${index}.time`,
      `event.${index}.note`,
    ];
    
    fieldNames.forEach(fieldName => {
      unregister(fieldName);
    });
    
    // Remove the field from the array
    remove(index);
  };

  return (
    <div className="p-6 space-y-6">
      {fields.map((event, index) => (
        <FormInput
          key={event.id}
          {...{
            index,
            eventOptions,
            onRemove: handleRemove,
            totalFields: fields.length,
            maxDate,
          }}
        />
      ))}

      {/* Add Event Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            append({
              event: "",
              location: "",
              date: "",
              time: "",
              note: "",
            } as any)
          }
          className="w-fit border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 hover:border-gray-400 hover:text-gray-600 flex items-center justify-center gap-2 "
        >
          <Plus className="h-4 w-4" />
          Add Event
        </button>
      </div>
    </div>
  );
};

export default Step3Form;

type FormInputProps = {
  index: number;
  onRemove: (index: number) => void;
  totalFields: number;
  eventOptions: Step3FormProps["eventOptions"];
  maxDate?: Date;
};

const FormInput = ({
  index,
  onRemove,
  totalFields,
  eventOptions,
  maxDate,
}: FormInputProps) => {
  return (
    <div className="space-y-4">
      {/* Event Header */}
      {totalFields > 1 && index !== 0 && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 dark:text-slate-200">
            {index === 0 ? "Event" : `Event ${index + 1}`}
          </h3>
          {totalFields > 1 && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Remove Event
            </button>
          )}
        </div>
      )}

      {/* Event Field */}
      <Forger
        name={`event.${index}.event`}
        label="Event"
        component={TextSelect}
        options={eventOptions}
      />

      {/* Location Field */}
      <Forger
        name={`event.${index}.location`}
        label="Location"
        component={TextInput}
        type="text"
        placeholder="Site Visits/Conference Call"
      />

      {/* Date and Time Row */}
      <div className="grid grid-cols-2 gap-4">
        <Forger
          name={`event.${index}.date`}
          label="Date"
          component={TextDatePicker}
          minDate={new Date()}
          maxDate={maxDate}
        />

        <Forger
          name={`event.${index}.time`}
          label="Time"
          component={TextTimeInput}
        />
      </div>

      {/* Note Field */}
      <Forger
        name={`event.${index}.note`}
        label="Note"
        component={TextArea}
        placeholder="Enter Detail"
        rows={3}
      />
    </div>
  );
};
