import React from "react";
import { Forger, useFieldArray } from "@/lib/forge";
import {
  TextDatePicker,
  TextInput,
  TextSelect,
  TextCurrencyInput,
} from "@/components/layouts/FormInputs";
import { useWatch, Control } from "react-hook-form";
import { CreateMsaFormData } from "../layouts/CreateMSADialog";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

type Props = {
  control: Control<CreateMsaFormData>;
};

const Step6ComplianceSecurity: React.FC<Props> = ({ control }) => {
  const security = useWatch({ control, name: "contractSecurity" });
  const { fields: policyFields, append: appendPolicy, remove: removePolicy } = useFieldArray({
    control,
    name: "insurancePolicies",
    inputProps: []
  });
  const { fields: secFields, append: appendSec, remove: removeSec } = useFieldArray({
    control,
    name: "securities",
    inputProps: []
  });

  return (
    <Accordion type="multiple" className="mt-4 space-y-6">
      <AccordionItem value="insurance" className="border-none">
        <AccordionTrigger className="text-sm font-medium text-slate-700 hover:no-underline border-b border-slate-200 pb-4">
          Insurance Coverage
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Forger
              name="insuranceExpiryDate"
              label="Expiry Date"
              component={TextDatePicker}
              placeholder="Select expiry date"
              containerClass="md:col-span-2"
            />
            {policyFields.map((field, index) => (
              <React.Fragment key={field.id}>
                <Forger
                  name={`insurancePolicies.${index}.name`}
                  label="Policy Name"
                  placeholder="Enter policy name"
                  component={TextInput}
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">Limit</p>
                    {index > 0 && (
                      <button
                        type="button"
                        className="text-xs text-red-600"
                        onClick={() => removePolicy(index)}
                      >
                        Remove Policy
                      </button>
                    )}
                  </div>
                  <Forger
                    name={`insurancePolicies.${index}.limit`}
                    component={TextInput}
                    placeholder="Enter limit"
                  />
                </div>
              </React.Fragment>
            ))}
            <div className="md:col-span-2 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => appendPolicy({ name: "", limit: "" })}
              >
                + Add Policy
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="security" className="border-none">
        <AccordionTrigger className="text-sm font-medium text-slate-700 hover:no-underline border-b border-slate-200 pb-4">
          Contract Security
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Forger
              name="contractSecurity"
              label="Contract Security (Example LOC, Performance Bond, Bank Guarantee, Labor Bond, Material Bond)"
              placeholder="Select yes or no"
              component={TextSelect}
              options={[
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
              ]}
              containerClass="md:col-span-2"
            />

            {security === "yes" && (
              <>
                {secFields.map((field, index) => (
                  <div key={field.id} className="md:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">Amount</p>
                      <button
                        type="button"
                        className="text-xs text-red-600"
                        onClick={() => removeSec(index)}
                      >
                        Remove Security
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Forger
                        name={`securities.${index}.type`}
                        label="Security Type"
                        placeholder="Enter Security"
                        component={TextSelect}
                        options={[
                          { label: "Letter of Credit", value: "letter_of_credit" },
                          { label: "Bank Guarantee", value: "bank_guarantee" },
                          { label: "Performance Bond", value: "performance_bond" },
                          { label: "Material Bond", value: "material_bond" },
                          { label: "Labour Bond", value: "labour_bond" },
                        ]}
                      />
                      <Forger
                        name={`securities.${index}.amount`}
                        label="Amount"
                        placeholder="Enter Amount"
                        component={TextCurrencyInput}
                      />
                      <Forger
                        name={`securities.${index}.dueDate`}
                        label="Due Date"
                        component={TextDatePicker}
                        placeholder="Select due date"
                        containerClass="md:col-span-2"
                      />
                    </div>
                  </div>
                ))}
                <div className="md:col-span-2 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendSec({ type: "", amount: "", dueDate: undefined })}
                  >
                    + Add Security
                  </Button>
                </div>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default Step6ComplianceSecurity;
