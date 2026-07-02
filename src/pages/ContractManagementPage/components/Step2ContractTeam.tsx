import React from "react";
import { Forger } from "@adexdsamson/forge";
import {
  TextInput,
  TextSelect,
  TextTagInput,
  TextMultiSelect,
} from "@/components/layouts/FormInputs";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { Personnel } from "./Step7ApprovalLevel";
import { ApiResponse, ApiResponseError } from "@/types";
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@/store/authSlice";
import { UseFormSetValue, useFormContext, useWatch } from "react-hook-form";
import { CreateContractFormData } from "./CreateContractSheet";

type Props = {
  setValue?: UseFormSetValue<CreateContractFormData>;
  projectManagerFallbackLabel?: string;
};

type SelectOption = { label: string; value: string; name?: string };

// Module-scope (not an inline closure): Forger's memoization compares the
// `component` prop via a deepEqual that treats any two plain functions as
// equal (Object.keys() is empty on both), so an inline arrow here would
// freeze at its first render and never react to `options` arriving from
// the network. `options` must be passed as an explicit Forger prop instead
// of captured via closure so the memo's array diff can see it change.
const SingleSelectField = ({
  value,
  onChange,
  options,
  placeholder,
  fallbackLabel,
  onVendorSelect,
  name,
}: {
  value?: string;
  onChange?: (val: string) => void;
  options: SelectOption[];
  placeholder: string;
  fallbackLabel?: string;
  onVendorSelect?: (label: string) => void;
  name?: string;
}) => {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  const selectedOption = normalizedValue
    ? options.find((option) => option.value === normalizedValue) ?? {
        label: fallbackLabel || normalizedValue,
        value: normalizedValue,
      }
    : undefined;

  const selectedValues = selectedOption ? [selectedOption] : [];

  return (
    <TextMultiSelect
      name={name ?? ""}
      options={options}
      placeholder={placeholder}
      maxCount={1}
      creatable={true}
      value={selectedValues as any}
      onChange={(selectedOptions) => {
        const selected = selectedOptions?.[0];
        const nextValue =
          typeof selected?.value === "string" ? selected.value.trim() : "";
        onChange?.(nextValue);
        if (onVendorSelect) {
          const nextLabel =
            typeof selected?.label === "string" ? selected.label.trim() : nextValue;
          onVendorSelect(nextLabel);
        }
      }}
    />
  );
};

const Step2ContractTeam: React.FC<Props> = ({
  setValue,
  projectManagerFallbackLabel,
}) => {
  const formContext = useFormContext<CreateContractFormData>();
  const applyValue = setValue ?? formContext.setValue;
  const vendorId = useWatch({ control: formContext.control, name: "vendor" });

  const { data: personnelData } = useQuery<
    ApiResponse<Personnel>,
    ApiResponseError
  >({
    queryKey: ["contract-personnel"],
    queryFn: async () =>
      await getRequest({ url: "/contract/manager/personnel" }),
    staleTime: 60000,
  });
  const { isManager } = useUserRole();
  const currentUser = useUser();

  React.useEffect(() => {
    if (!isManager || !currentUser?.name) return;
    applyValue?.("manager", currentUser.name as never);
  }, [applyValue, currentUser?.name, isManager]);

  const { data: vendorsData } = useQuery<
    ApiResponse<Array<{ email: string; _id: string; name: string }>>,
    ApiResponseError
  >({
    queryKey: ["solicitationVendors"],
    queryFn: async () =>
      await getRequest({ url: "/procurement/solicitations/vendors" }),
    staleTime: 60000,
  });

  const { data: projectManagersData } = useQuery<
    ApiResponse<Array<{ id: string; name: string; email?: string }>>,
    ApiResponseError
  >({
    queryKey: ["vendor-project-managers", vendorId],
    queryFn: async () =>
      await getRequest({ url: `/contract/manager/contracts/vendor/${vendorId}/project-managers` }),
    enabled: !!vendorId,
    staleTime: 60000,
  });

  const personnelOptions = React.useMemo(
    () =>
      Array.isArray(personnelData?.data?.data)
        ? personnelData?.data?.data?.map((p) => ({
            id: p._id,
            label:
              p.firstName && p.lastName
                ? `${p.firstName} ${p.lastName}`
                : p.firstName
                ? p.firstName
                : (p.email ?? p._id),
            text:
              p.firstName && p.lastName
                ? `${p.firstName} ${p.lastName}`
                : p.firstName
                ? p.firstName
                : (p.email ?? p._id),
            value: p._id,
            meta: {
              email: p.email,
              role: Array.isArray(p.role)
                ? p.role[0]?.name ?? ""
                : typeof (p as any)?.role === "string"
                ? (p as any).role
                : ((p as any)?.role?.name ?? ""),
              phone: (p as any)?.phone,
            },
          }))
        : [],
    [personnelData?.data?.data],
  );
  const vendorOptions = React.useMemo(
    () =>
      Array.isArray(vendorsData?.data?.data)
        ? vendorsData?.data?.data.map((vendor) => ({
            label: vendor.name || vendor.email,
            value: vendor._id,
            name: vendor.name,
          }))
        : [],
    [vendorsData?.data?.data],
  );

  const projectManagerOptions = React.useMemo(
    () =>
      Array.isArray(projectManagersData?.data?.data)
        ? projectManagersData?.data?.data.map((pm) => ({
            id: pm.id,
            label: pm.name || pm.email || pm.id,
            text: pm.name || pm.email || pm.id,
            value: pm.id,
          }))
        : [],
    [projectManagersData?.data?.data],
  );

  return (
    <div className="mt-4 space-y-4">
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
            />
          )}
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
                  ? (currentUser?.role?.name ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                  : ((value as any) ?? "")
              }
              onChange={(e) => onChange?.(e.target.value)}
              disabled={isManager}
            />
          )}
        />
      </div>

      <Forger
        name="vendor"
        label="Vendor / Contractor"
        component={SingleSelectField}
        options={vendorOptions}
        placeholder="Select vendor or type email"
        onVendorSelect={(label: string) =>
          applyValue?.("vendorLabel" as never, label as never)
        }
      />

      <Forger
        name="projectManager"
        label="Vendor/Contractor's Primary Contact"
        component={SingleSelectField}
        options={projectManagerOptions}
        placeholder="Select Vendor/Contractor's Primary Contact or Type e-mail"
        fallbackLabel={projectManagerFallbackLabel}
      />
      <Forger
        name="personnel"
        label="Vendor/Contractor Key Personnel. (Multi-Select)"
        component={TextTagInput}
        enableDetailsPopover
        helperText="Add vendor’s/contractor’s key personnel with email address, name"
      />
      <Forger
        name="internalTeam"
        label="Internal Team/Stakeholders (Multi-Select)"
        component={TextTagInput}
        // enableDetailsPopover
        enableAutocomplete
        autocompleteOptions={personnelOptions}
        // restrictTagsToAutocompleteOptions
        inputClassName="border-0"
        inlineTagsContainerClassName="border-0 outline-0 hover:border-0 focus:border-0 focus-within:ring-0"
        helperText="Add with email address, name"
      />
      <Forger
        name="visibility"
        label="Visibility"
        placeholder="Private, Public"
        component={TextSelect}
        options={[
          { label: "Private", value: "private" },
          { label: "Public", value: "public" },
        ]}
      />
    </div>
  );
};

export default Step2ContractTeam;
