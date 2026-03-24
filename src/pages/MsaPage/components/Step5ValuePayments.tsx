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
import { CreateMsaFormData } from "../layouts/CreateMSADialog";

type Props = {
  control: Control<CreateMsaFormData>;
  paymentTermOptions?: Array<{ label: string; value: string }>;
  isLoadingPaymentTerms?: boolean;
};

const Step5ValuePayments: React.FC<Props> = ({
  control,
  paymentTermOptions,
  isLoadingPaymentTerms,
}) => {
  const paymentStructure = useWatch({ control, name: "paymentStructure" });
  const deliverables = useWatch({
    control,
    name: "deliverables",
  }) as Array<{ name?: string }>;

  const deliverableOptions =
    deliverables?.map((d) => ({
      label: d.name || "Untitled Deliverable",
      value: d.name || "",
    })) || [];

  const { fields, append, remove } = useFieldArray({
    control,
    name: "milestones",
    inputProps: [],
  });

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Forger
        name="contractValue"
        label="Contract Value ($)"
        placeholder="Enter contract value"
        component={TextCurrencyInput}
        containerClass="md:col-span-2"
        helperText=">$5m = High Risk , >$1-5m = Medium, <$1m = Low Risk"
      />
      <Forger
        name="contingency"
        label="Contingency (only visible internally)"
        placeholder="Enter contingency"
        component={TextCurrencyInput}
      />
      <Forger
        name="holdback"
        label="Holdback (Optional)"
        placeholder="Enter holdback"
        component={TextInput}
      />
      <Forger
        name="paymentStructure"
        label="Payment Structure"
        placeholder="Select payment structure"
        component={TextSelect}
        containerClass="md:col-span-2"
        options={[
          { label: "Monthly", value: "monthly" },
          { label: "Milestone", value: "milestone" },
          { label: "Progress Draw", value: "lump_sum" },
        ]}
      />

      {paymentStructure === "milestone" && (
        <div className="col-span-2 space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Milestone Name</p>
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
                  placeholder="Enter amount"
                  component={TextCurrencyInput}
                />
                <Forger
                  name={`milestones.${index}.dueDate`}
                  label="Due Date"
                  component={TextDatePicker}
                  placeholder="Select due date"
                />
                <Forger
                  name={`milestones.${index}.deliverable`}
                  label="Select Deliverable (Optional)"
                  placeholder="Select deliverable"
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
        placeholder={
          isLoadingPaymentTerms ? "Loading..." : "Select payment term"
        }
        component={TextSelect}
        options={
          paymentTermOptions && paymentTermOptions.length > 0
            ? paymentTermOptions
            : [
                {
                  label: "NET 30 - Payment 30 days after invoice submission",
                  value: "net_30",
                },
                {
                  label: "NET 45 - Payment 45 days after invoice submission",
                  value: "net_45",
                },
                {
                  label: "NET 60 - Payment 60 days after invoice submission",
                  value: "net_60",
                },
                {
                  label: "NET 90 - Payment 90 days after invoice submission",
                  value: "net_90",
                },
                {
                  label: "NET 120 - Payment 120 days after invoice submission",
                  value: "net_120",
                },
              ]
        }
        containerClass="md:col-span-2"
      />
    </div>
  );
};

export default Step5ValuePayments;
