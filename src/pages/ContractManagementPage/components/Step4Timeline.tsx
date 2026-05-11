import React from "react";
import { ForgeControl, Forger } from "@/lib/forge";
import { TextDatePicker, TextInput, TextSelect } from "@/components/layouts/FormInputs";
import { useForgeValues } from "@/lib/forge";
import { CreateContractFormData } from "./CreateContractSheet";
import { useWatch } from "react-hook-form";
import { formatDateTZ } from "@/lib/utils";
import { differenceInCalendarDays, startOfDay } from "date-fns";



type Props = {
  termTypeOptions: Array<{ label: string; value: string }>;
  control: ForgeControl<CreateContractFormData>
};

const Step4Timeline: React.FC<Props> = ({ termTypeOptions, control }) => {
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const clampMinDate = React.useCallback(
    (d?: Date) => (d && d > today ? d : today),
    [today],
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
        minDate={today}
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
        <p className="text-sm font-medium text-slate-700">
          Duration of Contract Formation Stage
        </p>
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-50 p-4 space-y-4">
            <p className="text-sm font-medium text-slate-700">Draft Stage</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Forger
                name="draftStartDate"
                label="Start Date"
                component={TextDatePicker}
                placeholder="Select Date"
                minDate={today}
                maxDate={effectiveDate}
              />
              <Forger
                name="draftEndDate"
                label="End Date"
                component={TextDatePicker}
                placeholder="Select Date"
                minDate={clampMinDate(draftStartDate)}
                maxDate={effectiveDate}
              />
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 space-y-4">
            <p className="text-sm font-medium text-slate-700">Review Stage</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Forger
                name="reviewStartDate"
                label="Start Date"
                component={TextDatePicker}
                placeholder="Select Date"
                minDate={clampMinDate(draftEndDate || draftStartDate)}
                maxDate={effectiveDate}
              />
              <Forger
                name="reviewEndDate"
                label="End Date"
                component={TextDatePicker}
                placeholder="Select Date"
                minDate={clampMinDate(reviewStartDate)}
                maxDate={effectiveDate}
              />
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 space-y-4">
            <p className="text-sm font-medium text-slate-700">Approval Stage</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Forger
                name="approvalStartDate"
                label="Start Date"
                component={TextDatePicker}
                placeholder="Select Date"
                minDate={clampMinDate(reviewEndDate || reviewStartDate)}
                maxDate={effectiveDate}
              />
              <Forger
                name="approvalEndDate"
                label="End Date"
                component={TextDatePicker}
                placeholder="Select Date"
                minDate={clampMinDate(approvalStartDate)}
                maxDate={effectiveDate}
              />
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 space-y-4">
            <p className="text-sm font-medium text-slate-700">Execution Stage</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Forger
                name="executionStartDate"
                label="Start Date"
                component={TextDatePicker}
                placeholder="Select Date"
                minDate={clampMinDate(approvalEndDate || approvalStartDate)}
                maxDate={effectiveDate}
              />
              <Forger
                name="executionEndDate"
                label="End Date"
                component={TextDatePicker}
                placeholder="Select Date"
                minDate={clampMinDate(executionStartDate)}
                maxDate={effectiveDate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4Timeline;
