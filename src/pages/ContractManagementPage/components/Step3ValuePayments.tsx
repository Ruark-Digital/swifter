import React from "react";
import { Button } from "@/components/ui/button";
import { Forger, useFieldArray } from "@/lib/forge";
import {
  TextCurrencyInput,
  TextSelect,
  TextInput,
  TextDatePicker,
} from "@/components/layouts/FormInputs";
import { useWatch, Control } from "react-hook-form";
import { CreateContractFormData } from "./CreateContractSheet";

type Props = { 
  control: Control<CreateContractFormData>;
  paymentTermOptions: Array<{ label: string; value: string }>;
};

const Step3ValuePayments: React.FC<Props> = ({ control, paymentTermOptions }) => {
  const paymentStructure = useWatch({ control, name: "paymentStructure" });
  const deliverables = useWatch({ control, name: "deliverables" }) as Array<{
    name?: string;
  }>;

  const deliverableOptions =
    deliverables?.map((d) => ({
      label: d.name || "Untitled Deliverable",
      value: d.name || "",
    })) || [];
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "milestones",
    inputProps: []
  });

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Forger
        name="contractValue"
        label="Contract Value ($)"
        placeholder="Enter Amount"
        component={TextCurrencyInput}
        containerClass="md:col-span-2"
        helperText="Contract Higher than $5m = High Risk Contract"
      />
      <Forger
        name="contingency"
        label="Contingency (only visible internally)"
        placeholder="Enter Contingency"
        component={TextCurrencyInput}
      />
      <Forger
        name="holdback"
        label="Holdback (Optional)"
        placeholder="10%"
        component={TextInput}
      />
      <Forger
        name="paymentStructure"
        label="Payment Structure"
        placeholder="Monthly / Milestone / Progress Draw"
        component={TextSelect}
        containerClass="md:col-span-2"
        options={[
          { label: "Monthly", value: "monthly" },
          { label: "Milestone", value: "milestone" },
          { label: "Progress Draw", value: "lump_sum" },
        ]}
      />
     { paymentStructure !== "milestone" &&( <Forger
        name="selectedDeliverable"
        label="Select Deliverable (Optional)"
        placeholder="Select Deliverable"
        component={TextSelect}
        options={deliverableOptions}
        containerClass="md:col-span-2"
      />)}

      {paymentStructure === "milestone" && (
        <div className="col-span-2 space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Milestone</p>
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => remove(index)}
                >
                  Remove Milestone
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                <Forger
                  name={`milestones.${index}.name`}
                  label="Milestone Name"
                  placeholder={`Milestone ${index + 1}`}
                  containerClass="md:col-span-2"
                  component={TextInput}
                />
                <Forger
                  name={`milestones.${index}.amount`}
                  label="Amount ($)"
                  placeholder="Enter Amount"
                  component={TextCurrencyInput}
                />
                <Forger
                  name={`milestones.${index}.dueDate`}
                  label="Due Date"
                  component={TextDatePicker}
                  placeholder="Side Visits/Conference Call"
                />
                <Forger
                  name={`milestones.${index}.deliverable`}
                  label="Select Deliverable (Optional)"
                  placeholder="Select Deliverable"
                  component={TextSelect}
                  options={deliverableOptions}
                  containerClass="md:col-span-2"
                />
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  name: `Milestone ${fields.length + 1}`,
                  amount: "",
                  dueDate: undefined,
                  deliverable: "",
                })
              }
            >
              + Add Milestone
            </Button>
          </div>
        </div>
      )}

      <Forger
        name="paymentTerm"
        label="Payment Term"
        placeholder="When vendors will be paid after invoice submersion"
        component={TextSelect}
        options={paymentTermOptions}
        containerClass="md:col-span-2"
      />
    </div>
  );
};

export default Step3ValuePayments;
