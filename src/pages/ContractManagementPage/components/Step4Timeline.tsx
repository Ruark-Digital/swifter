import React from "react";
import { ForgeControl, Forger } from "@adexdsamson/forge";
import { TextDatePicker, TextInput, TextSelect } from "@/components/layouts/FormInputs";
import { useForgeValues } from "@adexdsamson/forge";
import { CreateContractFormData } from "./CreateContractSheet";
import { useWatch } from "react-hook-form";
import { formatDateTZ } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";



type Props = {
  termTypeOptions: Array<{ label: string; value: string }>;
  control: ForgeControl<CreateContractFormData>
};

const Step4Timeline: React.FC<Props> = ({ termTypeOptions, control }) => {
  // Past dates are intentionally allowed across every stage — contracts
  // can be backdated, and editing an in-flight contract needs to keep
  // the original past timeline. The chain still enforces order
  // (stage N start >= stage N-1 end) but no longer floors at today.
  const clampMinDate = React.useCallback(
    (d?: Date) => (d instanceof Date && !Number.isNaN(d.getTime()) ? d : undefined),
    [],
  );
  const { setValue } = useForgeValues({ control });
  const endDate = useWatch({ control, name: "endDate" });
  const effectiveDate = useWatch({ control, name: "effectiveDate" });
  const draftStartDate = useWatch({ control, name: "draftStartDate" });
  const draftEndDate = useWatch({ control, name: "draftEndDate" });
  const reviewStartDate = useWatch({ control, name: "reviewStartDate" });
  const reviewEndDate = useWatch({ control, name: "reviewEndDate" });
  const approvalStartDate = useWatch({ control, name: "approvalStartDate" });
  const approvalEndDate = useWatch({ control, name: "approvalEndDate" });
  const executionStartDate = useWatch({ control, name: "executionStartDate" });

  React.useEffect(() => {
    const start = effectiveDate ? formatDateTZ(effectiveDate) : undefined;
    const end = endDate ? formatDateTZ(endDate) : undefined;

    if (start && end) {
      const days = Math.max(0, differenceInCalendarDays(end,start));

      setValue("duration", days.toString(), { shouldDirty: true, shouldValidate: false });
    } else {
      setValue("duration", "", { shouldDirty: true, shouldValidate: false });
    }
  }, [effectiveDate, endDate, setValue]);

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Forger
        name="effectiveDate"
        label="Contract Effective Date"
        component={TextDatePicker}
        placeholder="Select Date"
        showTime
        helperText="Could be in the past, present or future."
      />
      
      <Forger
        name="endDate"
        label="End Date"
        component={TextDatePicker}
        showTime
        placeholder="Select Date"
        minDate={clampMinDate(effectiveDate)}
      />
      <Forger
        name="duration"
        label="Duration"
        placeholder="Duration"
        disabled={true}
        component={TextInput}
        containerClass="md:col-span-2"
      />
      <Forger
        name="termType"
        label="Term Type"
        placeholder="Select Type"
        component={TextSelect}
        options={termTypeOptions}
        containerClass="md:col-span-2"
      />

      <div className="md:col-span-2 space-y-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Duration of Contract Formation Stage
        </p>
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Draft Duration</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Forger
                name="draftStartDate"
                label="Start Date"
                component={TextDatePicker}
                placeholder="Select Date"
              />
              <Forger
                name="draftEndDate"
                label="End Date"
                component={TextDatePicker}
                placeholder="Select Date"
                minDate={clampMinDate(draftStartDate)}
              />
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Review Duration</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Forger
                name="reviewStartDate"
                label="Start Date"
                component={TextDatePicker}
                placeholder="Select Date"
                minDate={clampMinDate(draftEndDate || draftStartDate)}
              />
              <Forger
                name="reviewEndDate"
                label="End Date"
                component={TextDatePicker}
                placeholder="Select Date"
                minDate={clampMinDate(reviewStartDate)}
              />
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Approval Duration</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Forger
                name="approvalStartDate"
                label="Start Date"
                component={TextDatePicker}
                placeholder="Select Date"
                minDate={clampMinDate(reviewEndDate || reviewStartDate)}
              />
              <Forger
                name="approvalEndDate"
                label="End Date"
                component={TextDatePicker}
                placeholder="Select Date"
                minDate={clampMinDate(approvalStartDate)}
              />
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Execution Duration</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Forger
                name="executionStartDate"
                label="Start Date"
                component={TextDatePicker}
                placeholder="Select Date"
                minDate={clampMinDate(approvalEndDate || approvalStartDate)}
              />
              <Forger
                name="executionEndDate"
                label="End Date"
                component={TextDatePicker}
                placeholder="Select Date"
                minDate={clampMinDate(executionStartDate)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4Timeline;
