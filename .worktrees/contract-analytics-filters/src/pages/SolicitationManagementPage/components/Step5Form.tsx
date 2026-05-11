import { TextArea, TextMultiSelect } from "@/components/layouts/FormInputs";
import { Forger } from "@/lib/forge";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useMemo } from "react";

type VendorEmailData = {
  email: string;
  _id: string;
  name: string;
};

function Step5Form() {
  // Fetch all company vendors
  const { data: vendorsData } = useQuery<
    ApiResponse<VendorEmailData[]>,
    ApiResponseError
  >({
    queryKey: ["solicitationVendors"],
    queryFn: async () =>
      await getRequest({ url: "/procurement/solicitations/vendors" }),
  });

  // Transform vendor data to options format
  const vendorTags = useMemo(() => {
    if (!vendorsData?.data?.data) return [];

    return vendorsData.data.data.map((vendor) => ({
      label: vendor.name || vendor.email,
      value: vendor._id,
      name: vendor.name,
    }));
  }, [vendorsData]);

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-2">
        <Forger
          name="vendor"
          label="Add Vendor (Multi-Select)"
          component={TextMultiSelect}
          options={vendorTags}
          placeholder="Select vendors"
          maxCount={15}
          creatable={true}
        />
        <span className="dark:text-gray-500 text-sm">
          Add with email address, Vendor name, domain name
        </span>
      </div>

      <Forger
        name="message"
        label="Message (Optional)"
        component={TextArea}
        rows={4}
      />
    </div>
  );
}

export default Step5Form;
