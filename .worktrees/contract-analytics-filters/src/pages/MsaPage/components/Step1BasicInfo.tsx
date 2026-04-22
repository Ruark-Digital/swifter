import React from "react";
import { Forger } from "@/lib/forge";
import {
  TextInput,
  TextSelect,
  TextArea,
} from "@/components/layouts/FormInputs";
import { useQuery } from "@tanstack/react-query";
import { businessDivisionApi } from "@/pages/BusinessDivisionsPage/api/businessDivisionApi";
import { Info } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@/store/authSlice";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  typeOptions?: Array<{ label: string; value: string }>;
  isLoadingTypes?: boolean;
};

const ComplexityRating = ({
  value,
  onChange,
  error,
  helperText,
}: {
  value: number;
  onChange: (val: number) => void;
  error: string;
  helperText: string;
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
              <p>Rate the complexity from 1 (Low) to 10 (High)</p>
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
      
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      {!error && helperText && (
        <span className="text-xs text-gray-500 mt-1">{helperText}</span>
      )}
    </div>
  );
};

const Step1BasicInfo: React.FC<Props> = ({ typeOptions, isLoadingTypes }) => {
  const { isManager } = useUserRole();
  const currentUser = useUser();
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
    <div className="space-y-4">
      <Forger
        name="name"
        label="MSA Name"
        placeholder="Enter MSA name"
        component={TextInput}
        data-testid="msa-name-input"
      />

      <Forger
        name="type"
        label="MSA Type"
        placeholder={isLoadingTypes ? "Loading..." : "Select MSA type"}
        component={TextSelect}
        options={
          typeOptions && typeOptions.length > 0
            ? typeOptions
            : [
                {
                  label: "Major Work Construction",
                  value: "major_work_construction",
                },
                {
                  label: "Minor Work Contruction",
                  value: "minor_work_contruction",
                },
                {
                  label: "Engineering & Consulting",
                  value: "engineering_consulting",
                },
                {
                  label: "Environmental Services",
                  value: "environmental_services",
                },
                {
                  label: "Master Supply Agreement",
                  value: "master_supply_agreement",
                },
                {
                  label: "Geo-Technical Services",
                  value: "geo_technical_services",
                },
                { label: "Others", value: "others" },
              ]
        }
        data-testid="msa-type-select"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Forger
          name="manager"
          label="Contract Manger"
          component={({
            value,
            onChange,
          }: {
            value?: string;
            onChange?: (val: string) => void;
          }) => (
            <TextInput
              placeholder="Enter contract manager"
              value={
                isManager ? (currentUser?.name ?? "") : ((value as any) ?? "")
              }
              onChange={(e) => onChange?.(e.target.value)}
              disabled={isManager}
              className="bg-[#2A44670D]"
            />
          )}
          className="bg-[#2A44670D]"
          data-testid="msa-manager-input"
        />
        <Forger
          name="jobTitle"
          label="Job Title"
          component={({
            value,
            onChange,
          }: {
            value?: string;
            onChange?: (val: string) => void;
          }) => (
            <TextInput
              placeholder="Enter job title"
              value={
                isManager
                  ? (currentUser?.role?.name ?? "")
                  : ((value as any) ?? "")
              }
              onChange={(e) => onChange?.(e.target.value)}
              disabled={isManager}
              className="bg-[#2A44670D]"
            />
          )}
          className="bg-[#2A44670D]"
          data-testid="msa-job-title-input"
        />
      </div>

      <Forger
        name="msaId"
        label="MSA ID/Number (Optional)"
        placeholder="Enter MSA ID/Number"
        component={TextInput}
        data-testid="msa-id-input"
      />

      <Forger
        name="description"
        label="Description"
        placeholder="Enter description"
        component={TextArea}
        data-testid="msa-description-input"
      />

      <Forger name="rating" component={ComplexityRating} />

      <Forger
        name="businessDivision"
        label="Business Division"
        placeholder={isLoadingDivisions ? "Loading..." : "Select business division"}
        component={TextSelect}
        options={businessDivisionOptions}
        data-testid="msa-business-division-select"
      />
    </div>
  );
};

export default Step1BasicInfo;
