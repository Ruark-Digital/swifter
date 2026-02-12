import React from "react";
import { Forger } from "@/lib/forge";
import {
  TextInput,
  TextSelect,
  TextArea,
} from "@/components/layouts/FormInputs";
import { useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { businessDivisionApi } from "@/pages/BusinessDivisionsPage/api/businessDivisionApi";

type Props = {
  typeOptions: Array<{ label: string; value: string }>;
  projectOptions: Array<{ label: string; value: string }>;
  awardedOptions: Array<{
    label: string;
    value: string;
    vendorEmail?: string;
    vendorId?: string;
  }>;
};

const ComplexityRating = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700">
          Complexity Rating (1-10)
        </label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-slate-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Rate the complexity of the contract from 1 (Low) to 10 (High)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <div
            key={num}
            className="flex flex-col items-center gap-2 cursor-pointer group"
            onClick={() => onChange(num)}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                value === num
                  ? "border-[#2A4467] bg-blue-50"
                  : "border-slate-200 group-hover:border-slate-300"
              )}
            >
              {value === num && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#2A4467]" />
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                value === num ? "text-[#2A4467]" : "text-slate-500"
              )}
            >
              {num}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Step1BasicInfo: React.FC<Props> = ({
  typeOptions,
  projectOptions,
  awardedOptions,
}) => {
  const relationship = useWatch({ name: "relationship" });
  const { data: divisionsRes, isLoading: isLoadingDivisions } = useQuery<
    Awaited<ReturnType<typeof businessDivisionApi.listDivisions>>
  >({
    queryKey: ["businessDivisions", "list", "all"],
    queryFn: async () =>
      await businessDivisionApi.listDivisions({ page: 1, limit: 1000 }),
  });

  const businessDivisionOptions = React.useMemo(() => {
    const divisions = divisionsRes?.data?.docs ?? [];
    return divisions.map((division) => ({
      label: division.name || division._id,
      value: division._id,
    }));
  }, [divisionsRes]);

  return (
    <div className="mt-4 space-y-4">
      <Forger
        name="name"
        label="Contract Name"
        placeholder="Enter Title"
        component={TextInput}
        data-testid="contract-name-input"
      />
      <Forger
        name="relationship"
        label="Contract Relationship"
        placeholder="Enter Contract Relationship"
        component={TextSelect}
        options={[
          { label: "Stand-Alone Contract", value: "standalone" },
          { label: "Link to Project", value: "project" },
          { label: "Link to MSA", value: "msa" },
          { label: "Link to Project & MSA", value: "msa_project" },
        ]}
        data-testid="contract-relationship-select"
      />

      {/* Dynamic Fields based on Relationship */}
      {relationship === "project" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Forger
            name="project"
            label="Select Project"
            placeholder="Construction Services ..."
            component={TextSelect}
            options={projectOptions}
            data-testid="select-project-select"
          />
          <Forger
            name="awardedSolicitation"
            label="Select Awarded Solicitation (Optional)"
            placeholder="Select Solicitation"
            component={TextSelect}
            options={awardedOptions}
          />
        </div>
      )}

      {relationship === "msa" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Forger
            name="msaCategory"
            label="Select MSA Category"
            placeholder="Construction Services ..."
            component={TextSelect}
            options={[
              { label: "Construction Services", value: "construction" },
              { label: "IT Services", value: "it" },
            ]}
          />
          <Forger
            name="project" // Using project field for MSA ID based on existing logic, or need a new field? existing logic uses 'project' for MSA ID in buildPayload
            label="Select project"
            placeholder="Select Solicitation"
            component={TextSelect}
            options={projectOptions} // Assuming MSA options are passed here or need separate props
          />
        </div>
      )}

      {relationship === "msa_project" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Forger
              name="msaCategory"
              label="Select MSA Category"
              placeholder="Construction Services ..."
              component={TextSelect}
              options={[
                { label: "Construction Services", value: "construction" },
                { label: "IT Services", value: "it" },
              ]}
            />
            <Forger
              name="msaId" // Separate field for MSA when both are present
              label="Select MSA"
              placeholder="Select MSA"
              component={TextSelect}
              options={[]}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Forger
              name="project"
              label="Select Project"
              placeholder="Select Project"
              component={TextSelect}
              options={projectOptions}
            />
            <Forger
              name="awardedSolicitation"
              label="Select Awarded Solicitation (Optional)"
              placeholder="Select Solicitation"
              component={TextSelect}
              options={awardedOptions}
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Forger
          name="type"
          label="Contract Type"
          placeholder="Fixed Price/Lump Sum"
          component={TextSelect}
          options={typeOptions}
          data-testid="contract-type-select"
        />
        <Forger
          name="category"
          label="Category"
          placeholder="Legal"
          component={TextSelect}
          options={[
            { label: "Legal", value: "legal" },
            { label: "IT Operations", value: "it_ops" },
            { label: "Office Supplies", value: "office_supplies" },
          ]}
          data-testid="contract-category-select"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Forger
          name="manager"
          label="Contract Manger"
          placeholder="Enter Title"
          component={TextInput}
          className="bg-[#2A44670D]"
          data-testid="contract-manager-input"
        />
        <Forger
          name="jobTitle"
          label="Job Title"
          placeholder="Enter Title"
          component={TextInput}
          className="bg-[#2A44670D]"
          data-testid="job-title-input"
        />
      </div>

      <Forger
        name="contractId"
        label="Contract ID/Number (Optional)"
        placeholder="Enter Title"
        component={TextInput}
        data-testid="contract-id-input"
      />

      <Forger
        name="rating"
        component={ComplexityRating}
      />

      <Forger
        name="description"
        label="Description"
        placeholder="Enter Detail"
        component={TextArea}
        data-testid="description-input"
      />

      <Forger
        name="businessDivision"
        label="Business Division"
        placeholder={isLoadingDivisions ? "Loading..." : "Select Division"}
        component={TextSelect}
        options={businessDivisionOptions}
        data-testid="business-division-select"
      />
    </div>
  );
};

export default Step1BasicInfo;
