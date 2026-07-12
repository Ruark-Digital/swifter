import React from "react";
import { ForgeControl, Forger } from "@adexdsamson/forge";
import {
  TextDatePicker,
  TextInput,
  TextSelect,
} from "@/components/layouts/FormInputs";
import { useForgeValues } from "@adexdsamson/forge";
import { CreateMsaFormData } from "../layouts/CreateMSADialog";
import { useWatch } from "react-hook-form";
import { formatDateTZ } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";

type Props = {
  termTypeOptions?: Array<{ label: string; value: string }>;
  isLoadingTermTypes?: boolean;
  control: ForgeControl<CreateMsaFormData>;
};

const Step3Timeline: React.FC<Props> = ({
  termTypeOptions,
  isLoadingTermTypes,
  control,
}) => {
  // Past dates are intentionally allowed across every stage — MSA
  // contracts can be backdated, and editing an in-flight MSA needs to
  // keep the original past timeline. The chain still enforces order
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
      const days = Math.max(0, differenceInCalendarDays(end, start));
      setValue("duration", days.toString(), {
        shouldDirty: true,
        shouldValidate: false,
      });
    } else {
      setValue("duration", "", { shouldDirty: true, shouldValidate: false });
    }
  }, [effectiveDate, endDate, setValue]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Forger
            name="effectiveDate"
            label="Contract Effective Date"
            placeholder="Select contract effective date"
            component={TextDatePicker}
            showTime
          />
          <p className="text-xs font-semibold text-[#2A4467] dark:text-slate-300">
            Could be in the past, present or future.
          </p>
        </div>
        <div className="space-y-2">
          <Forger
            name="endDate"
            label="End Date"
            placeholder="Select end date"
            component={TextDatePicker}
            showTime
            minDate={clampMinDate(effectiveDate)}
          />
        </div>
      </div>

      <Forger
        name="duration"
        label="Duration"
        placeholder="Enter duration"
        component={TextInput}
        className="bg-[#2A44670D]"
        disabled={true}
      />

      <Forger
        name="termType"
        label="Term Type"
        placeholder={isLoadingTermTypes ? "Loading..." : "Select term type"}
        component={TextSelect}
        options={
          termTypeOptions && termTypeOptions.length > 0
            ? termTypeOptions
            : [
                { label: "Fixed", value: "fixed" },
                { label: "Multi Year", value: "multi_year" },
                { label: "Annual", value: "annual" },
              ]
        }
      />

      <div className="space-y-4 rounded-2xl bg-[#F9FAFB] dark:bg-slate-800/60 p-4">
        <p className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">
          Contract Formation Duration
        </p>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">Draft Duration</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Forger
              name="draftStartDate"
              label="Start Date"
              placeholder="Select start date"
              component={TextDatePicker}
            />
            <Forger
              name="draftEndDate"
              label="End Date"
              placeholder="Select end date"
              component={TextDatePicker}
              minDate={clampMinDate(draftStartDate)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">Review Duration</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Forger
              name="reviewStartDate"
              label="Start Date"
              placeholder="Select start date"
              component={TextDatePicker}
              minDate={clampMinDate(draftEndDate || draftStartDate)}
            />
            <Forger
              name="reviewEndDate"
              label="End Date"
              placeholder="Select end date"
              component={TextDatePicker}
              minDate={clampMinDate(reviewStartDate)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">Approval Duration</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Forger
              name="approvalStartDate"
              label="Start Date"
              placeholder="Select start date"
              component={TextDatePicker}
              minDate={clampMinDate(reviewEndDate || reviewStartDate)}
            />
            <Forger
              name="approvalEndDate"
              label="End Date"
              placeholder="Select end date"
              component={TextDatePicker}
              minDate={clampMinDate(approvalStartDate)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">Execution Duration</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Forger
              name="executionStartDate"
              label="Start Date"
              placeholder="Select start date"
              component={TextDatePicker}
              minDate={clampMinDate(approvalEndDate || approvalStartDate)}
            />
            <Forger
              name="executionEndDate"
              label="End Date"
              placeholder="Select end date"
              component={TextDatePicker}
              minDate={clampMinDate(executionStartDate)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3Timeline;
