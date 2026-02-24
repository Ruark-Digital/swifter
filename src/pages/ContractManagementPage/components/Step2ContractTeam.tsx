import React from "react";
import { Forger } from "@/lib/forge";
import {
  TextInput,
  TextSelect,
  TextTagInput,
} from "@/components/layouts/FormInputs";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { Personnel } from "./Step7ApprovalLevel";
import { ApiResponse, ApiResponseError } from "@/types";

// type Props = {
//   internalStakeholderOptions?: Array<{ label: string; value: string }>;
// };

const Step2ContractTeam: React.FC = () => {
  const { data: personnelData } = useQuery<ApiResponse<Personnel>, ApiResponseError>({
    queryKey: ["contract-personnel"],
    queryFn: async () =>
      await getRequest({ url: "/contract/manager/personnel" }),
    staleTime: 60000,
  });

  const personnelOptions = React.useMemo(
    () =>
      Array.isArray(personnelData?.data?.data)
        ? personnelData?.data?.data?.map(
            (p) => ({
              id: p._id,
              text: p.firstName && p.lastName ? `${p.firstName} (${p.lastName})` : p.firstName,
              value: p._id,
              meta: { email: p.email, role: p.role, phone: p.phone },
            }),
          )
        : [],
    [personnelData?.data?.data],
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Forger
          name="manager"
          label="Contract Manger"
          placeholder="Enter Title"
          component={TextInput}
        />
        <Forger
          name="jobTitle"
          label="Job Title"
          placeholder="Enter Title"
          component={TextInput}
        />
      </div>

      <Forger
        name="vendor"
        label="Vendor / Contractor"
        placeholder="Enter Name"
        component={TextInput}
        // helperText="Add with email address, Vendor name"
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
