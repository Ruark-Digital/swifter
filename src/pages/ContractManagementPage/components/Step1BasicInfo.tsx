import React from "react";
import { Forger } from "@/lib/forge";
import {
  TextInput,
  TextSelect,
  TextSelectWithSearch,
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
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@/store/authSlice";
import { getExchangeRate } from "@/lib/currencyUtils";

type Props = {
  typeOptions: Array<{ label: string; value: string }>;
  projectOptions: Array<{ label: string; value: string }>;
  msaOptions: Array<{ label: string; value: string }>;
  awardedOptions: Array<{
    label: string;
    value: string;
    vendorEmail?: string;
    vendorId?: string;
  }>;
};

const MSA_CATEGORY_OPTIONS = [
  { label: "Task Order", value: "task_order" },
  { label: "Work Order", value: "work_order" },
  { label: "Child Contract", value: "child_contract" },
];

const ComplexityRating = ({
  value,
  onChange,
  error,
  helperText
}: {
  value: number;
  onChange: (val: number) => void;
  error: string;
  helperText: string;
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
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
                  ? "border-[#2A4467] bg-blue-50 dark:border-indigo-400 dark:bg-indigo-900/40"
                  : "border-slate-200 group-hover:border-slate-300 dark:border-slate-600 dark:group-hover:border-slate-500"
              )}
            >
              {value === num && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#2A4467] dark:bg-indigo-300" />
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                value === num
                  ? "text-[#2A4467] dark:text-indigo-300"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              {num}
            </span>
          </div>
        ))}
      </div>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      {!error && helperText && (
        <span className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {helperText}
        </span>
      )}
    </div>
  );
};

const Step1BasicInfo: React.FC<Props> = ({
  typeOptions,
  projectOptions,
  msaOptions,
  awardedOptions,
}) => {
  const { isManager } = useUserRole();
  const currentUser = useUser();
  const userCurrency = currentUser?.currency;
  const relationship = useWatch({ name: "relationship" });
  const selectedCurrency = useWatch({ name: "currency" });
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

  const { data: categoriesData } = useQuery({
    queryKey: ["contractCategories"],
    queryFn: async () => await getRequest({ url: "/procurement/solicitations/meta/categories" }),
    staleTime: 60000,
  });

  // API spec (POST/PUT /manager/contracts) describes `category` as a
  // string name (e.g. "Construction", "IT"), and the GET response
  // surfaces the same name back. Using the name as the option value
  // keeps the prefill round-trip stable — otherwise the edit form
  // received "Construction" but the options were keyed by `_id`, so
  // TextSelectWithSearch couldn't find a match and rendered empty.
  const categoryOptions = React.useMemo(
    () =>
      Array.isArray(categoriesData?.data?.data)
        ? categoriesData.data.data.map((c: { _id?: string; name: string }) => ({
            label: c.name,
            value: c.name,
          }))
        : [],
    [categoriesData?.data?.data],
  );

  const currencyOptions = React.useMemo(() => {
    const supportedValuesOf = (Intl as any).supportedValuesOf as
      | undefined
      | ((type: string) => string[]);

    const supportedCurrencies =
      typeof supportedValuesOf === "function" ? supportedValuesOf("currency") : [];

    const fallbackCurrencies = ["CAD", "USD", "EUR", "GBP"];

    const codes =
      Array.isArray(supportedCurrencies) && supportedCurrencies.length > 0
        ? supportedCurrencies
        : fallbackCurrencies;

    const displayNames =
      typeof (Intl as any).DisplayNames === "function"
        ? new (Intl as any).DisplayNames(["en"], { type: "currency" })
        : null;

    const getCurrencyName = (code: string) => {
      try {
        const name = displayNames?.of(code);
        if (typeof name === "string" && name.trim() && name !== code) return name;
      } catch (err) {
        void err;
      }

      try {
        const parts = new Intl.NumberFormat("en", {
          style: "currency",
          currency: code,
          currencyDisplay: "name",
        }).formatToParts(0);
        const name = parts.find((p) => p.type === "currency")?.value;
        if (typeof name === "string" && name.trim() && name !== code) return name;
      } catch (err) {
        void err;
      }

      return undefined;
    };

    return Array.from(new Set(codes))
      .map((code) => {
        const name = getCurrencyName(code);
        return {
          value: code,
          label: name ? `${code} — ${name}` : code,
        };
      })
      .sort((a, b) => a.value.localeCompare(b.value));
  }, []);

  const showRateConversion = userCurrency && selectedCurrency && userCurrency !== selectedCurrency;

  const { data: exchangeRate, isLoading: isLoadingRate } = useQuery({
    queryKey: ["exchangeRate", userCurrency, selectedCurrency],
    queryFn: async () => {
      if (!userCurrency || !selectedCurrency || userCurrency === selectedCurrency) return null;
      return getExchangeRate(userCurrency, selectedCurrency);
    },
    enabled: !!showRateConversion,
    staleTime: 5 * 60 * 1000,
  });

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
        </div>
      )}

      {relationship === "msa" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Forger
              name="msaContractId"
              label="Select MSA"
              placeholder="Select MSA"
              component={TextSelect}
              options={msaOptions}
            />
            <Forger
              name="msaCategory"
              label="Select MSA Category"
              placeholder="Select Category"
              component={TextSelect}
              options={MSA_CATEGORY_OPTIONS}
            />
          </div>
        </>
      )}

      {relationship === "msa_project" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Forger
              name="msaContractId"
              label="Select MSA"
              placeholder="Select MSA"
              component={TextSelect}
              options={msaOptions}
            />
            <Forger
              name="project"
              label="Select Project"
              placeholder="Select Project"
              component={TextSelect}
              options={projectOptions}
            />
          </div>
        </>
      )}

      {/* Awarded solicitation is selectable on every relationship (incl. standalone). */}
      <Forger
        name="awardedSolicitation"
        label="Select Awarded Solicitation (Optional)"
        placeholder="Select Solicitation"
        component={TextSelect}
        options={awardedOptions}
      />

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
          component={TextSelectWithSearch}
          options={categoryOptions}
          data-testid="contract-category-select"
        />
      </div>

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
              placeholder="Enter Title"
              value={
                isManager ? (currentUser?.name ?? "") : ((value as any) ?? "")
              }
              onChange={(e) => onChange?.(e.target.value)}
              disabled={isManager}
              className="bg-[#2A44670D]"
            />
          )}
          className="bg-[#2A44670D]"
          data-testid="contract-manager-input"
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
              placeholder="Enter Title"
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

      <Forger
        name="currency"
        label="Currency"
        placeholder="Select currency"
        searchPlaceholder="Search currency..."
        emptyMessage="No currency found."
        component={TextSelectWithSearch}
        options={currencyOptions}
      />

      {showRateConversion && (
        <div className="mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-600 dark:text-blue-300 font-medium">Rate Conversion:</span>
            {isLoadingRate ? (
              <span className="text-slate-500 dark:text-slate-400">Loading...</span>
            ) : exchangeRate ? (
              <span className="text-slate-700 dark:text-slate-200">
                1 {userCurrency} = {exchangeRate.toFixed(4)} {selectedCurrency}
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">Unable to fetch rate</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1BasicInfo;
