import React from "react";
import { Forger } from "@/lib/forge";
import {
  TextDatePicker,
  TextInput,
  TextSelect,
} from "@/components/layouts/FormInputs";

const Step3Timeline: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Forger
            name="effectiveDate"
            label="Contract Effective Date"
            placeholder="Select Date"
            component={TextDatePicker}
          />
          <p className="text-xs font-semibold text-[#2A4467]">
            Could be in the past, present or future.
          </p>
        </div>
        <div className="space-y-2">
          <Forger
            name="endDate"
            label="End Date"
            placeholder="Select Date"
            component={TextDatePicker}
          />
        </div>
      </div>

      <Forger
        name="duration"
        label="Duration"
        placeholder="Duration"
        component={TextInput}
        className="bg-[#2A44670D]"
      />

      <Forger
        name="termType"
        label="Term Type"
        placeholder="Select Type"
        component={TextSelect}
        options={[
          { label: "Fixed", value: "fixed" },
          { label: "Multi Year", value: "multi_year" },
          { label: "Annual", value: "annual" },
        ]}
      />

      <div className="space-y-4 rounded-2xl bg-[#F9FAFB] p-4">
        <p className="text-sm font-medium text-[#0F0F0F]">
          Duration of Contract Formation  Stage
        </p>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0F0F0F]">Draft Stage</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Forger
              name="draftStartDate"
              label="Start Date"
              placeholder="Select Date"
              component={TextDatePicker}
            />
            <Forger
              name="draftEndDate"
              label="End Date"
              placeholder="Select Date"
              component={TextDatePicker}
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0F0F0F]">Review Stage</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Forger
              name="reviewStartDate"
              label="Start Date"
              placeholder="Select Date"
              component={TextDatePicker}
            />
            <Forger
              name="reviewEndDate"
              label="End Date"
              placeholder="Select Date"
              component={TextDatePicker}
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0F0F0F]">Approval Stage</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Forger
              name="approvalStartDate"
              label="Start Date"
              placeholder="Select Date"
              component={TextDatePicker}
            />
            <Forger
              name="approvalEndDate"
              label="End Date"
              placeholder="Select Date"
              component={TextDatePicker}
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0F0F0F]">Execution Stage</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Forger
              name="executionStartDate"
              label="Start Date"
              placeholder="Select Date"
              component={TextDatePicker}
            />
            <Forger
              name="executionEndDate"
              label="End Date"
              placeholder="Select Date"
              component={TextDatePicker}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3Timeline;

