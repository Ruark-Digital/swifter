import React from "react";
import { Button } from "@/components/ui/button";
import { Forger, useFieldArray } from "@/lib/forge";
import { TextInput, TextDatePicker } from "@/components/layouts/FormInputs";
import { Control } from "react-hook-form";
import { CreateContractFormData } from "./CreateContractSheet";

type Props = { control: Control<CreateContractFormData> };

const Step5Deliverables: React.FC<Props> = ({ control }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "deliverables",
    inputProps: [],
  });

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end"
          >
            <Forger
              name={`deliverables.${index}.name`}
              label="Deliverable Name"
              placeholder={`Deliverable ${index + 1}`}
              component={TextInput}
            />
            <Forger
              name={`deliverables.${index}.dueDate`}
              label="Due Date"
              component={TextDatePicker}
            />
            {index > 0 && (
              <button
                type="button"
                className="text-xs text-red-600 md:col-span-2 text-left md:text-right"
                onClick={() => remove(index)}
              >
                Remove Deliverable
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              name: `Deliverable ${fields.length + 1}`,
              dueDate: undefined,
            })
          }
        >
          + Add Deliverable
        </Button>
      </div>
    </div>
  );
};

export default Step5Deliverables;

