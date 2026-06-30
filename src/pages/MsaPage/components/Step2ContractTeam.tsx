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
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@/store/authSlice";

import { useFormContext, useWatch } from "react-hook-form";

type Props = {
  /** Display label for the saved project manager — used as the chip
   *  label when the vendor's PM list doesn't include this user (so the
   *  trigger renders the real name instead of a raw ObjectId). */
  defaultPmLabel?: string;
};

const Step2ContractTeam: React.FC<Props> = ({ defaultPmLabel }) => {
  const formContext = useFormContext<any>();
  const vendorId = useWatch({ control: formContext as any, name: "vendor" });

  const { data: personnelData } = useQuery({
    queryKey: ["contract-personnel"],
    queryFn: async () => await getRequest({ url: "/contract/manager/personnel" }),
    staleTime: 60000,
  });
  const { isManager } = useUserRole();
  const currentUser = useUser();
  const { data: vendorsData } = useQuery({
    queryKey: ["solicitationVendors"],
    queryFn: async () => await getRequest({ url: "/procurement/solicitations/vendors" }),
    staleTime: 60000,
  });

  const { data: projectManagersData } = useQuery({
    queryKey: ["vendor-project-managers", vendorId],
    queryFn: async () =>
      await getRequest({ url: `/contract/manager/contracts/vendor/${vendorId}/project-managers` }),
    enabled: !!vendorId,
    staleTime: 60000,
  });

  const personnelOptions = React.useMemo(
    () =>
      Array.isArray((personnelData as any)?.data?.data)
        ? (personnelData as any)?.data?.data?.map((p: any) => ({
            id: p._id,
            label: p.firstName && p.lastName ? `${p.firstName} (${p.lastName})` : p.firstName,
            text: p.firstName && p.lastName ? `${p.firstName} (${p.lastName})` : p.firstName,
            value: p._id,
            meta: { email: p.email, role: p.role, phone: p.phone },
          }))
        : [],
    [personnelData],
  );

  const vendorOptions = React.useMemo(
    () =>
      Array.isArray((vendorsData as any)?.data?.data)
        ? (vendorsData as any)?.data?.data.map((vendor: any) => ({
            label: vendor.name || vendor.email,
            value: vendor._id,
            name: vendor.name,
          }))
        : [],
    [vendorsData],
  );

  const projectManagerOptions = React.useMemo(
    () =>
      Array.isArray((projectManagersData as any)?.data?.data)
        ? (projectManagersData as any)?.data?.data.map((pm: any) => ({
            id: pm.id,
            label: pm.name || pm.email || pm.id,
            text: pm.name || pm.email || pm.id,
            value: pm.id,
          }))
        : [],
    [projectManagersData],
  );

  return (
    <div className="space-y-4">
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
              placeholder="Enter job title"
              value={
                isManager
                  ? (currentUser?.role?.name ?? "")
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
        component={({
          value,
          onChange,
        }: {
          value?: string;
          onChange?: (val: string) => void;
        }) => {
          const normalizedValue = typeof value === "string" ? value.trim() : "";
          const selectedOption = normalizedValue
            ? vendorOptions.find((option: any) => option.value === normalizedValue) ?? {
                label: normalizedValue,
                value: normalizedValue,
              }
            : undefined;

          const selectedValues = selectedOption ? [selectedOption] : [];

          return (
            <TextMultiSelect
              name="vendor"
              options={vendorOptions}
              placeholder="Select vendor or type email"
              maxCount={1}
              creatable={true}
              value={selectedValues as any}
              onChange={(selectedOptions) =>
                onChange?.(
                  typeof selectedOptions?.[0]?.value === "string"
                    ? selectedOptions[0].value.trim()
                    : "",
                )
              }
            />
          );
        }}
      />

      <Forger
        name="projectManager"
        label="Vendor/Contractor's Primary Contact"
        component={({
          value,
          onChange,
        }: {
          value?: string;
          onChange?: (val: string) => void;
        }) => {
          const normalizedValue = typeof value === "string" ? value.trim() : "";
          const selectedOption = normalizedValue
            ? projectManagerOptions.find((option: any) => option.value === normalizedValue) ?? {
                label: defaultPmLabel || normalizedValue,
                value: normalizedValue,
              }
            : undefined;

          const selectedValues = selectedOption ? [selectedOption] : [];

          return (
            <TextMultiSelect
              name="projectManager"
              options={projectManagerOptions}
              placeholder="Select Vendor/Contractor's Primary Contact or Type e-mail"
              maxCount={1}
              creatable={true}
              value={selectedValues as any}
              onChange={(selectedOptions) =>
                onChange?.(
                  typeof selectedOptions?.[0]?.value === "string"
                    ? selectedOptions[0].value.trim()
                    : "",
                )
              }
            />
          );
        }}
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
        enableAutocomplete
        autocompleteOptions={personnelOptions}
        inputClassName="border-0"
        inlineTagsContainerClassName="border-0 outline-0 hover:border-0 focus:border-0 focus-within:ring-0"
        helperText="Add with email address, name"
      />
      <Forger
        name="visibility"
        label="Visibility"
        placeholder="Select visibility"
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
